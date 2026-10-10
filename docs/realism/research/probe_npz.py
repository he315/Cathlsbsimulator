import sys, zipfile, array, time
sys.path.insert(0, "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/scripts/angio_library")
from common import read_npy, scalar
p = sys.argv[1]
t=time.time()
with zipfile.ZipFile(p) as z:
    names = z.namelist()
    print(names)
    for n in names:
        info = z.getinfo(n)
        print(n, info.file_size, info.compress_size)
    d, shape, payload = read_npy(z.read("pixel_array.npy"))
    print(d, shape, len(payload), time.time()-t)
    a = array.array({"<f8":"d","<f4":"f"}[d]); a.frombytes(payload[:512*512*8 if d=="<f8" else 512*512*4])
    nonint = sum(1 for v in a if abs(v-round(v))>1e-6)
    print("min", min(a), "max", max(a), "nonint frac", nonint/len(a))
    print(a[1000:1010])
    for n in names:
        if n!="pixel_array.npy":
            dd, sh, pl = read_npy(z.read(n)); print(n, scalar(dd, sh, pl))
