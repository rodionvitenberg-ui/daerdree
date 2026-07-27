/**
 * Chunk Retry — patches Next.js/Turbopack chunk loading to gracefully
 * handle network failures on slow or unstable connections.
 *
 * Instead of crashing the page with an unhandled ChunkLoadError, this module:
 *   1. Catches script/link tag load errors (capture phase)
 *   2. Catches unhandled Promise rejections from dynamic imports
 *   3. Reloads the page with exponential backoff (up to 3 attempts)
 *   4. Shows a clean fallback UI when all retries are exhausted
 *
 * SessionStorage is used to prevent infinite reload loops.
 */

const CHUNK_RELOAD_LIMIT = 3;
const RELOAD_WINDOW_MS = 30_000; // reset counter after 30 s of stability
const STORAGE_KEY = "__daerdree_chunk_reloads";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isChunkError(err: unknown): err is Error {
  if (!(err instanceof Error)) return false;
  return (
    err.name === "ChunkLoadError" ||
    err.message.includes("Failed to load chunk") ||
    err.message.includes("Loading chunk") ||
    err.message.includes("Loading CSS chunk")
  );
}

function getReloadCount(): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const { count, ts } = JSON.parse(raw) as { count: number; ts: number };
    if (Date.now() - ts > RELOAD_WINDOW_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return 0;
    }
    return count;
  } catch {
    return 0;
  }
}

function bumpReloadCount(): number {
  const next = getReloadCount() + 1;
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ count: next, ts: Date.now() }),
  );
  return next;
}

function clearReloadCount(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

function showChunkFallback(): void {
  // Prevent duplicate overlays
  if (document.getElementById("__daerdree_chunk_fb")) return;

  const overlay = document.createElement("div");
  overlay.id = "__daerdree_chunk_fb";
  overlay.style.cssText =
    "position:fixed;inset:0;background:#0f0f0f;z-index:99999;" +
    "display:flex;align-items:center;justify-content:center;";

  overlay.innerHTML = `
    <div style="text-align:center;padding:2rem;max-width:420px">
      <h2 style="color:#f5f5f5;font-size:1.5rem;font-weight:600;margin-bottom:.75rem;font-family:system-ui,sans-serif">
        Connection Issue
      </h2>
      <p style="color:#a3a3a3;margin-bottom:2rem;line-height:1.6;font-family:system-ui,sans-serif">
        Your connection seems unstable. Some resources couldn't be loaded.
      </p>
      <button
        id="__daerdree_chunk_reload"
        style="padding:.75rem 2rem;border:1px solid rgba(255,255,255,.15);color:#f5f5f5;
               background:transparent;cursor:pointer;font-size:.8125rem;text-transform:uppercase;
               letter-spacing:.12em;font-family:system-ui,sans-serif;transition:background .2s"
        onmouseover="this.style.background='rgba(255,255,255,.05)'"
        onmouseout="this.style.background='transparent'"
      >
        Reload Page
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  document
    .getElementById("__daerdree_chunk_reload")
    ?.addEventListener("click", () => {
      clearReloadCount();
      window.location.reload();
    });
}

function scheduleReload(delayMs: number): void {
  setTimeout(() => window.location.reload(), delayMs);
}

// ---------------------------------------------------------------------------
// Install listeners (runs once per page load)
// ---------------------------------------------------------------------------

function install(): void {
  if (typeof window === "undefined") return;

  // 1. Script / link tag errors — caught in capture phase before they bubble
  window.addEventListener(
    "error",
    (event) => {
      const target = event.target;

      if (target instanceof HTMLScriptElement) {
        if (!target.src?.includes("/_next/static/")) return;
      } else if (target instanceof HTMLLinkElement) {
        if (!target.href?.includes("/_next/static/")) return;
      } else {
        return;
      }

      // Stop the error from crashing the React tree
      event.preventDefault();
      event.stopImmediatePropagation();

      const count = bumpReloadCount();

      if (count <= CHUNK_RELOAD_LIMIT) {
        const delay = Math.min(1000 * 2 ** (count - 1), 8_000);
        console.warn(
          `[chunk-retry] Resource failed, reloading page in ${delay}ms ` +
            `(attempt ${count}/${CHUNK_RELOAD_LIMIT})`,
        );
        scheduleReload(delay);
      } else {
        console.warn("[chunk-retry] Max retries exhausted, showing fallback");
        clearReloadCount();
        showChunkFallback();
      }
    },
    true, // capture phase — crucial to intercept before script.onerror
  );

  // 2. Dynamic import() rejections — unhandled Promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    if (!isChunkError(event.reason)) return;

    event.preventDefault();

    const count = bumpReloadCount();

    if (count <= CHUNK_RELOAD_LIMIT) {
      const delay = Math.min(1000 * 2 ** (count - 1), 8_000);
      console.warn(
        `[chunk-retry] Dynamic import failed, reloading page in ${delay}ms ` +
          `(attempt ${count}/${CHUNK_RELOAD_LIMIT})`,
      );
      scheduleReload(delay);
    } else {
      console.warn("[chunk-retry] Max retries exhausted, showing fallback");
      clearReloadCount();
      showChunkFallback();
    }
  });
}

install();

export {};

