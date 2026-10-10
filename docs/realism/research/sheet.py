"""Contact sheet of a run (every k-th frame), each thumbnail labelled by frame index via tick count."""
import sys
import imlib

def sheet(frames, idx, out, thumb=170, cols=5):
    rows = (len(idx) + cols - 1) // cols
    Wc, Hc = cols * thumb, rows * thumb
    px = bytearray(Wc * Hc)
    for n, k in enumerate(idx):
        img = frames[k]
        r, c = divmod(n, cols)
        for y in range(thumb - 2):
            sy = int(y * 512 / (thumb - 2))
            for x in range(thumb - 2):
                sx = int(x * 512 / (thumb - 2))
                px[(r * thumb + y) * Wc + c * thumb + x] = int(img[sy * 512 + sx])
        # frame number as small white bars (tens) and dots (units) at the top-left
        t, u = divmod(k + 1, 10)
        for i in range(t):
            for yy in range(2, 12):
                for xx in range(3):
                    px[(r * thumb + yy) * Wc + c * thumb + 3 + i * 5 + xx] = 255
        for i in range(u):
            for yy in range(14, 17):
                for xx in range(3):
                    px[(r * thumb + yy) * Wc + c * thumb + 3 + i * 5 + xx] = 255
    imlib.write_png_gray(out, Wc, Hc, bytes(px))

if __name__ == "__main__":
    rid = sys.argv[1]
    step = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    if rid.startswith("cd-"):
        fr, meta = imlib.load_npz_run(rid)
    else:
        names = imlib.cadica_frames(rid)
        fr = [imlib.load_png(imlib.cadica_png(rid, k + 1)) for k in range(len(names))]
    idx = list(range(0, len(fr), step))[:30]
    sheet(fr, idx, f"view/sheet_{rid}.png", cols=6, thumb=150)
    print(len(fr))
