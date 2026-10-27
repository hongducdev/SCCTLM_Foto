"""Regenerate tests/fixtures/wm-reference.json from the original renderer (yishun-watermark-cli.py).

For each of the 54 templates it records the result size and where the photo lands, plus the per-character
advance table of MiSans (so the Node test measures text exactly like PIL does).

Usage: python -I tests/fixtures/gen-wm-reference.py "<path to leica-yishun>"
"""
import importlib.util
import json
import sys
from argparse import Namespace
from pathlib import Path

from PIL import Image, ImageFont

PHOTO = (1600, 1200)
MARK = (1, 2, 3)
INFO = dict(make="Xiaomi", model="Xiaomi 17 Ultra", date="2022.08.16 18:33:00", focal="24mm", aperture="f/1.4", exposure="1/25", iso="ISO850",
            location="118°59'37.00\"W 25°25'25.00\"N")


def main() -> int:
    pack = Path(sys.argv[1])
    spec = importlib.util.spec_from_file_location("yishun", pack / "yishun-watermark-cli.py")
    yishun = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(yishun)
    info = yishun.leica_cli.ExifInfo(**INFO)
    args = Namespace(bg="", brand="xiaomi", model="", location="", hide_location=False, hide_date=False, ref_width=1080.0)
    out = {"photo": PHOTO, "info": INFO, "templates": {}}
    for tid, tdir in yishun.find_templates().items():
        cfg = json.loads((tdir / "config.json").read_text(encoding="utf-8"))
        photo = Image.new("RGB", PHOTO, MARK)
        ctx = yishun.Context(tdir, cfg, photo, info, args)
        root = yishun.pick_layout(cfg, bool(ctx.text("@location=location_latlng")))
        w, h = yishun.measure(root, ctx)
        rendered = yishun.render(root, ctx, w, h).convert("RGB")
        bbox = Image.eval(rendered, lambda v: 255).getbbox()
        marked = Image.new("L", rendered.size, 0)
        marked.putdata([255 if p == MARK else 0 for p in rendered.getdata()])
        out["templates"][tid] = {"size": [w, h], "photo": list(marked.getbbox()) if marked.getbbox() else None, "bbox": list(bbox)}
    sizes = range(1, 201)
    chars = [chr(c) for c in range(32, 127)] + ["°"]
    out["advance"] = {str(s): {c: ImageFont.truetype(str(pack / "assets" / "mi_sans_normal.ttf"), s).getlength(c) for c in chars} for s in sizes}
    target = Path(__file__).parent / "wm-reference.json"
    target.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")
    print(f"{len(out['templates'])} templates -> {target}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
