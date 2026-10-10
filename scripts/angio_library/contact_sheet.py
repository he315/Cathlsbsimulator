"""Make a contact sheet (grid of thumbnails) from JPEG/PNG frames to screen for burned-in text."""

import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))
from common import read_png_gray, resize_nearest, write_png_gray  # noqa: E402


def sheet(paths, out_png, cols=5, thumb=160):
    rows = (len(paths) + cols - 1) // cols
    W, H = cols * thumb, rows * thumb
    canvas = bytearray(W * H)
    with tempfile.TemporaryDirectory() as td:
        for i, p in enumerate(paths):
            png = os.path.join(td, f"{i}.png")
            r = subprocess.run(["sips", "-s", "format", "png", "-Z", str(thumb), p, "--out", png], capture_output=True, text=True)
            if not os.path.exists(png):
                print("sips failed", p, r.returncode, r.stdout[-200:], r.stderr[-200:])
                continue
            w, h, px = read_png_gray(png)
            if (w, h) != (thumb, thumb):
                px = resize_nearest(px, w, h, thumb, thumb)
            r, c = divmod(i, cols)
            for y in range(thumb):
                canvas[(r * thumb + y) * W + c * thumb : (r * thumb + y) * W + (c + 1) * thumb] = px[y * thumb : (y + 1) * thumb]
    write_png_gray(out_png, W, H, bytes(canvas))


if __name__ == "__main__":
    out = sys.argv[1]
    sheet(sys.argv[2:], out)
