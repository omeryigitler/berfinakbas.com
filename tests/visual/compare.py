from __future__ import annotations

import json
import math
import sys
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageDraw
except ImportError as error:
    raise SystemExit("Pillow is required: python3 -m pip install Pillow==12.3.0") from error

ROOT = Path(__file__).resolve().parents[2]
REFERENCE = ROOT / "tests/visual/references/yonetim-approved.png"
CURRENT = ROOT / "tests/visual/results/yonetim-current.png"
DIFF = ROOT / "tests/visual/results/yonetim-diff.png"
MASKS = ROOT / "tests/visual/results/yonetim-masks.json"
RESULT = ROOT / "tests/visual/results/yonetim-result.json"


def load_rgba(path: Path) -> Image.Image:
    if not path.exists():
        raise SystemExit(f"Missing visual artifact: {path}")
    return Image.open(path).convert("RGBA")


def apply_masks(image: Image.Image, rectangles: list[dict[str, float]]) -> None:
    draw = ImageDraw.Draw(image)
    for rectangle in rectangles:
        padding = 2
        left = max(0, math.floor(rectangle["x"]) - padding)
        top = max(0, math.floor(rectangle["y"]) - padding)
        right = min(image.width, math.ceil(rectangle["x"] + rectangle["width"]) + padding)
        bottom = min(image.height, math.ceil(rectangle["y"] + rectangle["height"]) + padding)
        draw.rectangle((left, top, right, bottom), fill=(0, 0, 0, 0))


def alpha_mask(difference: Image.Image) -> Image.Image:
    red, green, blue, alpha = difference.split()
    return ImageChops.lighter(ImageChops.lighter(red, green), ImageChops.lighter(blue, alpha))


def main() -> int:
    reference = load_rgba(REFERENCE)
    current = load_rgba(CURRENT)
    if reference.size != current.size:
        raise SystemExit(
            f"Visual dimensions differ: reference={reference.size}, current={current.size}"
        )

    rectangles: list[dict[str, float]] = []
    if MASKS.exists():
        payload = json.loads(MASKS.read_text(encoding="utf-8"))
        rectangles = payload.get("rectangles", [])

    apply_masks(reference, rectangles)
    apply_masks(current, rectangles)

    difference = ImageChops.difference(reference, current)
    mask = alpha_mask(difference)
    mismatch_count = sum(1 for pixel in mask.getdata() if pixel != 0)
    total_pixels = reference.width * reference.height
    mismatch_ratio = mismatch_count / total_pixels

    DIFF.parent.mkdir(parents=True, exist_ok=True)
    highlighted = Image.new("RGBA", reference.size, (255, 0, 0, 0))
    highlighted.putalpha(mask.point(lambda pixel: 255 if pixel else 0))
    highlighted.save(DIFF)

    result = {
        "current": str(CURRENT.relative_to(ROOT)),
        "diff": str(DIFF.relative_to(ROOT)),
        "maskedRectangles": len(rectangles),
        "mismatchPixels": mismatch_count,
        "pixelMismatchRatio": mismatch_ratio,
        "reference": str(REFERENCE.relative_to(ROOT)),
        "totalPixels": total_pixels,
    }
    RESULT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"pixel mismatch ratio = {mismatch_ratio:.4f}")

    return 0 if mismatch_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
