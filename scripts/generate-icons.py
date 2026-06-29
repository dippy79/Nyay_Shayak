"""Generate valid PWA icon PNGs for Legis. Run: python scripts/generate-icons.py"""
from __future__ import annotations

from pathlib import Path
import os

from PIL import Image
from PIL import ImageDraw
from PIL import ImageFont



BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(BASE_DIR, "public")

BRAND = (27, 79, 216)  # #1B4FD8 — Legis primary
WHITE = (255, 255, 255)


def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for name in ("arial.ttf", "Arial.ttf", "segoeui.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def make_app_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BRAND + (255,))
    draw = ImageDraw.Draw(img)
    pad = max(size // 10, 4)
    draw.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=max(size // 8, 6),
        fill=WHITE + (255,),
    )
    font = _font(int(size * 0.42))
    text = "L"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        ((size - tw) // 2, (size - th) // 2 - max(size // 40, 1)),
        text,
        fill=BRAND + (255,),
        font=font,
    )
    return img


def make_shortcut_icon(size: int, label: str, color: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGBA", (size, size), color + (255,))
    draw = ImageDraw.Draw(img)
    inset = size // 8
    draw.rounded_rectangle(
        [inset, inset, size - inset, size - inset],
        radius=size // 6,
        fill=WHITE + (255,),
    )
    font = _font(int(size * 0.38))
    bbox = draw.textbbox((0, 0), label, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - tw) // 2, (size - th) // 2), label, fill=color + (255,), font=font)
    return img


def main() -> None:
    os.makedirs(PUBLIC, exist_ok=True)



    for size, filename in ((72, "icon-72.png"), (192, "icon-192.png"), (512, "icon-512.png")):
        path = PUBLIC / filename
        make_app_icon(size).convert("RGB").save(path, "PNG", optimize=True)
        print(f"Wrote {path} ({path.stat().st_size} bytes)")

    for filename, label, color in (
        ("icon-scan.png", "S", (16, 185, 129)),
        ("icon-status.png", "C", (245, 158, 11)),
        ("icon-help.png", "?", (139, 92, 246)),
    ):
        path = PUBLIC / filename
        make_shortcut_icon(96, label, color).convert("RGB").save(path, "PNG", optimize=True)
        print(f"Wrote {path} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
