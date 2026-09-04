#!/usr/bin/env python3
"""One-off placeholder icon generator (no external deps).

Draws a flat rounded/plain square in the app's accent color with a
centered white play-triangle, and writes raw PNGs via zlib + struct.
Meant to be replaced with real branded icons later -- this only exists
to unblock PWA installability during development.
"""
import struct
import zlib
import os

ACCENT = (108, 92, 231)  # #6c5ce7
WHITE = (255, 255, 255)


def rounded_square_mask(size, radius):
    mask = [[False] * size for _ in range(size)]
    r = radius
    for y in range(size):
        for x in range(size):
            in_corner = False
            cx = cy = None
            if x < r and y < r:
                cx, cy = r, r
            elif x >= size - r and y < r:
                cx, cy = size - r - 1, r
            elif x < r and y >= size - r:
                cx, cy = r, size - r - 1
            elif x >= size - r and y >= size - r:
                cx, cy = size - r - 1, size - r - 1
            if cx is not None:
                in_corner = (x - cx) ** 2 + (y - cy) ** 2 > r * r
            mask[y][x] = not in_corner
    return mask


def triangle_mask(size, scale):
    # Equilateral-ish play triangle pointing right, centered.
    w = size * scale
    h = w * 0.9
    cx, cy = size / 2 + w * 0.08, size / 2
    x0, y0 = cx - w / 2, cy - h / 2
    x1, y1 = cx - w / 2, cy + h / 2
    x2, y2 = cx + w / 2, cy

    def sign(px, py, ax, ay, bx, by):
        return (px - bx) * (ay - by) - (ax - bx) * (py - by)

    mask = [[False] * size for _ in range(size)]
    for y in range(size):
        for x in range(size):
            d1 = sign(x, y, x0, y0, x1, y1)
            d2 = sign(x, y, x1, y1, x2, y2)
            d3 = sign(x, y, x2, y2, x0, y0)
            has_neg = d1 < 0 or d2 < 0 or d3 < 0
            has_pos = d1 > 0 or d2 > 0 or d3 > 0
            mask[y][x] = not (has_neg and has_pos)
    return mask


def make_icon(size, out_path, rounded=True, triangle_scale=0.42):
    corner_mask = rounded_square_mask(size, size // 8) if rounded else None
    tri_mask = triangle_mask(size, triangle_scale)

    rows = []
    for y in range(size):
        row = bytearray([0])  # filter type 0
        for x in range(size):
            if corner_mask is not None and not corner_mask[y][x]:
                r, g, b, a = 0, 0, 0, 0
            elif tri_mask[y][x]:
                r, g, b, a = *WHITE, 255
            else:
                r, g, b, a = *ACCENT, 255
            row += bytes([r, g, b, a])
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(raw, 9)
    png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(png)
    print(f"wrote {out_path} ({size}x{size})")


if __name__ == "__main__":
    base = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
    make_icon(192, os.path.join(base, "icon-192.png"), rounded=True)
    make_icon(512, os.path.join(base, "icon-512.png"), rounded=True)
    # Maskable: full-bleed background (no rounding/transparency), content
    # kept within the ~80% safe zone via a smaller triangle scale.
    make_icon(512, os.path.join(base, "icon-maskable-512.png"), rounded=False, triangle_scale=0.32)
    # iOS applies its own corner rounding -- plain square, no transparency.
    make_icon(180, os.path.join(base, "apple-touch-icon.png"), rounded=False)
