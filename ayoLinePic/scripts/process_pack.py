#!/usr/bin/env python3
"""Process generated sticker JPGs into LINE Creators Market PNG pack."""

from __future__ import annotations

import argparse
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 370, 320
FONT_PATH = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc"

DEFAULT_STICKERS = [
    ("sticker-01-thanks.jpg", "謝謝！", True),
    ("sticker-02-sorry.jpg", "對不起…", False),
    ("sticker-03-haode.jpg", "好的！", True),
    ("sticker-04-jiayou.jpg", "加油！", True),
    ("sticker-05-zan.jpg", "讚！", True),
    ("sticker-06-baibai.jpg", "掰掰！", True),
    ("sticker-07-huh.jpg", "蛤？", True),
    ("sticker-08-gotit.jpg", "了解！", False),
    ("sticker-09-please.jpg", "拜託了！", False),
    ("sticker-10-excuse.jpg", "不好意思…", False),
    ("sticker-11-busy.jpg", "我在忙！", False),
    ("sticker-12-eating.jpg", "吃飯中！", False),
    ("sticker-13-thinking.jpg", "讓我想想…", False),
    ("sticker-14-noproblem.jpg", "沒問題！", False),
    ("sticker-15-tired.jpg", "累了…", False),
    ("sticker-16-what.jpg", "什麼！？", False),
    ("sticker-17-haha.jpg", "哈哈哈！", False),
    ("sticker-18-cry.jpg", "嗚嗚…", False),
    ("sticker-19-received.jpg", "收到！", False),
    ("sticker-20-night.jpg", "晚安！", False),
    ("sticker-21-grateful.jpg", "感恩啦！", False),
    ("sticker-22-hardwork.jpg", "辛苦了！", False),
    ("sticker-23-done.jpg", "搞定！", False),
    ("sticker-24-smooth.jpg", "一切順利！", False),
]


def remove_white_bg(img: Image.Image, threshold: int = 245) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    assert pixels is not None
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, _a = pixels[x, y]
            m = min(r, g, b)
            if m >= 252:
                pixels[x, y] = (r, g, b, 0)
            elif m >= threshold:
                alpha = int(255 * (252 - m) / (252 - threshold))
                pixels[x, y] = (r, g, b, alpha)
    return img


def trim_alpha(img: Image.Image, pad: int = 4) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    return img.crop(
        (
            max(0, l - pad),
            max(0, t - pad),
            min(img.width, r + pad),
            min(img.height, b + pad),
        )
    )


def fit_canvas(
    img: Image.Image, canvas_w: int, canvas_h: int, bottom_reserve: int = 0
) -> Image.Image:
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    usable_h = canvas_h - bottom_reserve
    scale = min(canvas_w / img.width, usable_h / img.height)
    nw = max(1, int(img.width * scale))
    nh = max(1, int(img.height * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, ((canvas_w - nw) // 2, (usable_h - nh) // 2))
    return canvas


def draw_label(img: Image.Image, text: str) -> Image.Image:
    draw = ImageDraw.Draw(img)
    size = 54
    font = ImageFont.truetype(FONT_PATH, size)
    while size >= 28:
        font = ImageFont.truetype(FONT_PATH, size)
        bbox = draw.textbbox((0, 0), text, font=font)
        if bbox[2] - bbox[0] <= W - 24 and bbox[3] - bbox[1] <= 70:
            break
        size -= 2
    font = ImageFont.truetype(FONT_PATH, size)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (W - tw) // 2 - bbox[0]
    y = H - th - 14 - bbox[1]
    for dx in range(-3, 4):
        for dy in range(-3, 4):
            if dx * dx + dy * dy <= 10:
                draw.text((x + dx, y + dy), text, font=font, fill=(255, 255, 255, 255))
    draw.text((x, y), text, font=font, fill=(16, 34, 26, 255))
    return img


def to_size(img: Image.Image, w: int, h: int) -> Image.Image:
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bbox = img.getbbox() or (0, 0, img.width, img.height)
    cropped = img.crop(bbox)
    scale = min(w / cropped.width, h / cropped.height)
    nw = max(1, int(cropped.width * scale))
    nh = max(1, int(cropped.height * scale))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, ((w - nw) // 2, (h - nh) // 2))
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    for i, (name, label, has_text) in enumerate(DEFAULT_STICKERS, 1):
        src = args.src / name
        cut = trim_alpha(remove_white_bg(Image.open(src)))
        canvas = fit_canvas(cut, W, H, bottom_reserve=0 if has_text else 62)
        if not has_text:
            canvas = draw_label(canvas, label)
        canvas.save(args.out / f"{i:02d}.png", "PNG")
        print("OK", f"{i:02d}.png", label)

    to_size(Image.open(args.out / "01.png"), 240, 240).save(args.out / "main.png")
    to_size(Image.open(args.out / "05.png"), 96, 74).save(args.out / "tab.png")

    zip_path = args.out / "ayoLinePic-daily24-line-stickers.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(args.out.glob("*.png")):
            zf.write(path, arcname=f"png/{path.name}")
    print("ZIP", zip_path)


if __name__ == "__main__":
    main()
