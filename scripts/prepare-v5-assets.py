"""Prepare V5 delivery assets from Brishav's real portrait and published data."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
IMAGES = PUBLIC / "assets" / "images"
CINEMATIC = PUBLIC / "assets" / "cinematic"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


def save_avif(image: Image.Image, path: Path, quality: int = 55) -> None:
    image.save(path, format="AVIF", quality=quality)


portrait_source = PUBLIC / "Brishav.jpg"
with Image.open(portrait_source) as opened:
    portrait = opened.convert("RGB")
    for width in (480, 768):
        height = round(width * portrait.height / portrait.width)
        resized = portrait.resize((width, height), Image.Resampling.LANCZOS)
        save_avif(resized, IMAGES / f"Brishav-portrait-{width}.avif")


canvas = Image.new("RGB", (1200, 630), "#f7f0df")
with Image.open(CINEMATIC / "summit-dawn-1280.webp") as source:
    background = ImageOps.fit(source.convert("RGB"), canvas.size, method=Image.Resampling.LANCZOS, centering=(0.62, 0.5))
    background = background.convert("RGBA")
    wash = Image.new("RGBA", canvas.size, (247, 240, 223, 165))
    background.alpha_composite(wash)
    canvas.paste(background.convert("RGB"))

draw = ImageDraw.Draw(canvas)
heading = font("C:/Windows/Fonts/georgia.ttf", 50)
body = font("C:/Windows/Fonts/arial.ttf", 25)
label = font("C:/Windows/Fonts/arialbd.ttf", 18)

draw.rounded_rectangle((46, 42, 1154, 588), radius=28, fill=(255, 252, 245, 230), outline=(177, 137, 105), width=2)
draw.text((82, 78), "BRISHAV RAJBAHAK / DATA ANALYST IN PROGRESS", font=label, fill="#9c2432")
draw.multiline_text(
    (82, 134),
    "I want the work to look good.\nI need the numbers to hold up.",
    font=heading,
    fill="#2b211d",
    spacing=6,
)
draw.text((82, 333), "Published Loan Default Analysis / 2007–2018", font=body, fill="#4e4038")

rates = [("A", 6.04), ("B", 12.96), ("C", 22.51), ("D", 30.73), ("E", 38.78), ("F", 44.58), ("G", 49.67)]
bar_left, bar_top, bar_width = 82, 405, 470
for index, (grade, rate) in enumerate(rates):
    y = bar_top + index * 22
    draw.text((bar_left, y - 2), grade, font=label, fill="#4e4038")
    draw.rounded_rectangle((bar_left + 34, y, bar_left + 34 + int(bar_width * rate / 55), y + 12), radius=6, fill="#b12c3b")
draw.text((82, 564), "19.98% = 269,360 / 1,348,099 final outcomes", font=label, fill="#9c2432")

with Image.open(portrait_source) as opened:
    portrait = ImageOps.fit(opened.convert("RGB"), (310, 430), method=Image.Resampling.LANCZOS, centering=(0.5, 0.24))
    mask = Image.new("L", portrait.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, portrait.width, portrait.height), radius=24, fill=255)
    canvas.paste(portrait, (812, 116), mask)
    draw.rounded_rectangle((812, 116, 1122, 546), radius=24, outline="#9c2432", width=3)

canvas.save(PUBLIC / "og-v5.png", optimize=True)


def icon_image(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), (247, 240, 223, 255))
    icon_draw = ImageDraw.Draw(image)
    inset = round(size * 0.09)
    icon_draw.ellipse((inset, inset, size - inset, size - inset), outline="#9c2432", width=max(2, round(size * 0.035)))
    icon_font = font("C:/Windows/Fonts/georgiab.ttf", round(size * 0.36))
    box = icon_draw.textbbox((0, 0), "BR", font=icon_font)
    icon_draw.text(((size - (box[2] - box[0])) / 2, (size - (box[3] - box[1])) / 2 - box[1]), "BR", font=icon_font, fill="#9c2432")
    return image


icon_image(180).save(PUBLIC / "apple-touch-icon.png", optimize=True)
icon_image(192).save(PUBLIC / "icon-192.png", optimize=True)
icon_image(512).save(PUBLIC / "icon-512.png", optimize=True)
icon_image(64).save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

print("Prepared V5 portrait AVIF, social card, and icon assets.")
