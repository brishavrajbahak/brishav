from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
REFERENCE = Path.home() / "AppData/Local/Temp/cinematic-audit/05-gta-vi-hero-loaded.png"
IMPLEMENTATION = ROOT / "tests/e2e/visual-regression.spec.ts-snapshots/observatory-desktop-hero-desktop-win32.png"
OUTPUT = ROOT / "design-qa/gta-principles-vs-v3.png"


def fit_frame(source: Path) -> Image.Image:
    image = Image.open(source).convert("RGB")
    if image.height > 900:
        image = image.crop((0, 0, image.width, 900))
    return image.resize((720, 450), Image.Resampling.LANCZOS)


def main() -> None:
    reference = fit_frame(REFERENCE)
    implementation = fit_frame(IMPLEMENTATION)
    canvas = Image.new("RGB", (1440, 494), "#f7f1e7")
    canvas.paste(reference, (0, 44))
    canvas.paste(implementation, (720, 44))

    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default(size=18)
    draw.text((22, 13), "REFERENCE - CINEMATIC INTERACTION PRINCIPLES", fill="#251a16", font=font)
    draw.text((742, 13), "V3 - ORIGINAL HIMALAYAN OBSERVATORY", fill="#a80022", font=font)
    draw.line((720, 0, 720, 494), fill="#bcae9c", width=1)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUTPUT, optimize=True)
    print(OUTPUT)


if __name__ == "__main__":
    main()
