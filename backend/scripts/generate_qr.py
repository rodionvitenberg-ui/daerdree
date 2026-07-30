#!/usr/bin/env python3
"""Generate a premium QR code for daerdree.bar/games.

Outputs:
  frontend/public/qr/games-catalog.png  — 300 DPI, rounded modules
  frontend/public/qr/games-catalog.svg  — vector, rounded modules
"""

import qrcode
import qrcode.image.svg
from PIL import Image, ImageDraw
import math
import os

# ----- CONFIG -----
URL = "https://daerdree.bar/games"

# Brand colours
BG_COLOR = (255, 255, 255)       # white background
MODULE_COLOR = (26, 122, 130)    # #1a7a82  (teal accent)
PADDING_MODULES = 2              # quiet-zone in module units

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "qr")
PNG_PATH = os.path.join(OUTPUT_DIR, "games-catalog.png")
SVG_PATH = os.path.join(OUTPUT_DIR, "games-catalog.svg")

# Size for PNG (pixels at 300 DPI)
# 1 module ≈ 0.5 mm → at 300 DPI ≈ 5.9 px.  We'll target ~18 mm → ~212 px per module.
MODULE_PX = 17                    # pixels per module at output resolution
# ----- END CONFIG -----


def _rounded_rect(draw, xy, radius, fill):
    """Draw a filled rounded rectangle on *draw*."""
    x1, y1, x2, y2 = xy
    r = radius
    draw.ellipse((x1, y1, x1 + r * 2, y1 + r * 2), fill=fill)
    draw.ellipse((x2 - r * 2, y1, x2, y1 + r * 2), fill=fill)
    draw.ellipse((x1, y2 - r * 2, x1 + r * 2, y2), fill=fill)
    draw.ellipse((x2 - r * 2, y2 - r * 2, x2, y2), fill=fill)
    draw.rectangle((x1 + r, y1, x2 - r, y2), fill=fill)
    draw.rectangle((x1, y1 + r, x2, y2 - r), fill=fill)


def generate_png(matrix, version):
    """Render QR matrix as a high-quality PNG with rounded modules."""
    n = len(matrix)  # modules per side
    size = n + PADDING_MODULES * 2
    px = MODULE_PX
    canvas_px = size * px

    img = Image.new("RGB", (canvas_px, canvas_px), BG_COLOR)
    draw = ImageDraw.Draw(img)

    radius = max(1, px // 4)  # rounded corner radius for each module

    for row_idx, row in enumerate(matrix):
        for col_idx, cell in enumerate(row):
            if cell:
                x = (col_idx + PADDING_MODULES) * px
                y = (row_idx + PADDING_MODULES) * px
                _rounded_rect(draw, (x, y, x + px, y + px), radius, MODULE_COLOR)

    return img


def generate_svg(matrix, version):
    """Render QR matrix as SVG with rounded modules."""
    n = len(matrix)
    size = n + PADDING_MODULES * 2
    px = MODULE_PX  # logical units
    view_box = size * px
    r = max(1, px // 4)

    lines = []
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg"'
                 f' width="{view_box}" height="{view_box}"'
                 f' viewBox="0 0 {view_box} {view_box}">')
    lines.append(f'  <rect width="{view_box}" height="{view_box}"'
                 f' fill="#ffffff"/>')

    for row_idx, row in enumerate(matrix):
        for col_idx, cell in enumerate(row):
            if cell:
                x = (col_idx + PADDING_MODULES) * px
                y = (row_idx + PADDING_MODULES) * px
                lines.append(
                    f'  <rect x="{x}" y="{y}"'
                    f' width="{px}" height="{px}"'
                    f' rx="{r}" ry="{r}"'
                    f' fill="#{MODULE_COLOR[0]:02x}{MODULE_COLOR[1]:02x}{MODULE_COLOR[2]:02x}"/>'
                )

    lines.append('</svg>')
    return '\n'.join(lines)


def main():
    # Build QR code
    qr = qrcode.QRCode(
        version=None,           # auto-detect
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=0,               # we handle padding ourselves
    )
    qr.add_data(URL)
    qr.make(fit=True)

    matrix = qr.get_matrix()
    version = qr.version

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # --- PNG ---
    img = generate_png(matrix, version)
    # Save at 300 DPI
    dpi = 300
    # calculate print size in inches
    px_total = (len(matrix) + PADDING_MODULES * 2) * MODULE_PX
    img.save(PNG_PATH, dpi=(dpi, dpi))
    print(f"✅ PNG saved: {PNG_PATH}  ({px_total}×{px_total} px @ {dpi} DPI)")

    # --- SVG ---
    svg_content = generate_svg(matrix, version)
    with open(SVG_PATH, "w") as f:
        f.write(svg_content)
    print(f"✅ SVG saved: {SVG_PATH}")

    print(f"\n🔗 URL: {URL}")


if __name__ == "__main__":
    main()