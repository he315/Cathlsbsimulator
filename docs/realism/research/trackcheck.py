import json, sys, imlib
run, name, f0 = sys.argv[1], sys.argv[2], int(sys.argv[3])
r = [t for t in json.load(open(f'motion_{run}.json')) if t['name'].endswith(':' + name)][0]
tr = r['track']
idx = list(range(f0, f0 + len(tr)))
fr, _ = imlib.load_npz_run(run, frames=idx)
# tile 64x64 crops (x2) centred on the frame-0 track position, mark tracked point
cs = 64; sc = 2; cols = 8
cx0, cy0 = int(tr[0][0]), int(tr[0][1])
n = len(tr)
rows = (n + cols - 1) // cols
W = cols * cs * sc; H = rows * cs * sc
px = bytearray(W * H)
for k in range(n):
    img = fr[k]; r_, c_ = divmod(k, cols)
    x0 = cx0 - cs // 2; y0 = cy0 - cs // 2
    for j in range(cs * sc):
        for i in range(cs * sc):
            sx = x0 + i // sc; sy = y0 + j // sc
            v = img[sy * 512 + sx] if 0 <= sx < 512 and 0 <= sy < 512 else 0
            px[(r_ * cs * sc + j) * W + c_ * cs * sc + i] = int(v)
    mx = int((tr[k][0] - x0) * sc); my = int((tr[k][1] - y0) * sc)
    for d in range(-5, 6):
        for (a, b) in ((mx + d, my), (mx, my + d)):
            if 0 <= a < cs * sc and 0 <= b < cs * sc:
                px[(r_ * cs * sc + b) * W + c_ * cs * sc + a] = 255
imlib.write_png_gray(f'view/track_{run}_{name}.png', W, H, bytes(px))
