"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Client wrapper that activates chunk-retry side-effects on mount.
 * Must be rendered inside a client component tree so that
 * `@/lib/chunk-retry` only runs in the browser.
 */
export default function ChunkRetryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Side-effect import — loads the retry patch on mount
    void import("@/lib/chunk-retry");
  }, []);

  return <>{children}</>;
}