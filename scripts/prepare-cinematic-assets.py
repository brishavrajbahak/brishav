"""Create deterministic responsive delivery variants for V3 cinematic plates."""

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1] / "public" / "assets" / "cinematic"
PUBLIC_ROOT = ROOT.parents[1]
WIDTHS = (1672, 1280, 768)
MOBILE_WIDTHS = (900, 600)


def save_variant(image: Image.Image, destination: Path, quality: int) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, quality=quality, method=6)


for source in sorted(ROOT.glob("*-source.png")):
    stem = source.name.removesuffix("-source.png")
    with Image.open(source) as opened:
        image = opened.convert("RGB")
        for width in WIDTHS:
            if width > image.width:
                continue
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            save_variant(resized, ROOT / f"{stem}-{width}.webp", 82)
            save_variant(resized, ROOT / f"{stem}-{width}.avif", 58)

        for width in MOBILE_WIDTHS:
            height = round(width * 5 / 4)
            cropped = ImageOps.fit(
                image,
                (width, height),
                method=Image.Resampling.LANCZOS,
                centering=(0.5, 0.5),
            )
            save_variant(cropped, ROOT / f"{stem}-mobile-{width}.webp", 82)
            save_variant(cropped, ROOT / f"{stem}-mobile-{width}.avif", 58)

portrait_source = PUBLIC_ROOT / "Brishav.jpg"
portrait_output = PUBLIC_ROOT / "assets" / "images"
with Image.open(portrait_source) as opened:
    portrait = opened.convert("RGB")
    for width in (480, 768):
        height = round(width * portrait.height / portrait.width)
        resized = portrait.resize((width, height), Image.Resampling.LANCZOS)
        save_variant(resized, portrait_output / f"Brishav-portrait-{width}.webp", 80)

print("Prepared responsive cinematic assets in", ROOT)
