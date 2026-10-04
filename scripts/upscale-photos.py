"""
AI super-resolution for the client's small source photographs (docs/15 §11).

Most of the show photography we have is WordPress thumbnails (768x432, 768x512, even
300x300). Stretched across a 1440px hero or gallery tile they read as blurred. This runs
Real-ESRGAN x4plus (xinntao/Real-ESRGAN, BSD-3) on CPU through ncnn, then scales the 4x
result down to at most 2400px and writes images/hd/<stem>.jpg. scripts/build-photos.mjs
prefers images/hd/<stem>.jpg over images/<file> whenever it exists.

It is not part of the build (it takes ~1-4 min per photo on 4 cores). Re-run it only when
images/ gains a new small photo:

  pip install ncnn numpy pillow
  curl -LO https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-ubuntu.zip
  unzip realesrgan-ncnn-vulkan-20220424-ubuntu.zip -d /tmp/esr
  ESRGAN_MODELS=/tmp/esr/models python3 scripts/upscale-photos.py
"""
import os, sys, time
import numpy as np
import ncnn
from PIL import Image

SRC, OUT = 'images', 'images/hd'
MODELS = os.environ.get('ESRGAN_MODELS', '/tmp/esr/models')
MAX_SRC_W = 1300   # anything wider is already good enough for a 1600w hero
MAX_OUT_W = 2400
SKIP = {'cropped-112233-1.png', '222.png'}  # logo and hall diagram: not photographs

net = ncnn.Net()
net.opt.use_vulkan_compute = False
net.opt.num_threads = os.cpu_count() or 4
net.load_param(f'{MODELS}/realesrgan-x4plus.param')
net.load_model(f'{MODELS}/realesrgan-x4plus.bin')
IN, OUTB = net.input_names()[0], net.output_names()[0]


def run(tile):
    ex = net.create_extractor()
    m = ncnn.Mat.from_pixels(np.ascontiguousarray(tile), ncnn.Mat.PixelType.PIXEL_RGB, tile.shape[1], tile.shape[0])
    m.substract_mean_normalize([], [1 / 255.0] * 3)
    ex.input(IN, m)
    _, out = ex.extract(OUTB)
    return np.array(out).transpose(1, 2, 0)


def upscale(img, T=192, P=12, S=4):
    H, W, _ = img.shape
    out = np.zeros((H * S, W * S, 3), np.float32)
    for y in range(0, H, T):
        for x in range(0, W, T):
            y0, x0 = max(y - P, 0), max(x - P, 0)
            y1, x1 = min(y + T + P, H), min(x + T + P, W)
            r = run(img[y0:y1, x0:x1])
            h, w = (min(y + T, H) - y) * S, (min(x + T, W) - x) * S
            out[y * S:y * S + h, x * S:x * S + w] = r[(y - y0) * S:(y - y0) * S + h, (x - x0) * S:(x - x0) * S + w]
    return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))


os.makedirs(OUT, exist_ok=True)
only = set(sys.argv[1:])
for f in sorted(os.listdir(SRC)):
    p = os.path.join(SRC, f)
    if not os.path.isfile(p) or not f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) or f in SKIP:
        continue
    if only and f not in only:
        continue
    im = Image.open(p).convert('RGB')
    if im.width >= MAX_SRC_W or im.height > 1700:
        continue
    dst = os.path.join(OUT, os.path.splitext(f)[0] + '.jpg')
    if os.path.exists(dst) and not only:
        continue
    t = time.time()
    big = upscale(np.asarray(im))
    if big.width > MAX_OUT_W:
        big = big.resize((MAX_OUT_W, round(big.height * MAX_OUT_W / big.width)), Image.LANCZOS)
    big.save(dst, quality=90, optimize=True, progressive=True)
    print(f'{f} {im.width}x{im.height} -> {big.width}x{big.height} {os.path.getsize(dst) // 1024}K {time.time() - t:.0f}s', flush=True)
