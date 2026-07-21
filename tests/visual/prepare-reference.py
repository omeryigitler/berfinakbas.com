from __future__ import annotations

import hashlib
import os
import shutil
import sys
from pathlib import Path

EXPECTED_SHA256 = "40450b438b81538d5d82cc2708ef3d9e2b745fb4ce4d5fb52c9a8605a8f7018c"
EXPECTED_SIZE = (1904, 861)
ROOT = Path(__file__).resolve().parents[2]
DESTINATION = ROOT / "tests/visual/references/yonetim-approved.png"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_dimensions(path: Path) -> None:
    try:
        from PIL import Image
    except ImportError as error:
        raise SystemExit("Pillow is required: python3 -m pip install Pillow==12.3.0") from error

    with Image.open(path) as image:
        if image.size != EXPECTED_SIZE:
            raise SystemExit(
                f"Approved screenshot dimensions differ: expected={EXPECTED_SIZE}, actual={image.size}"
            )


def main() -> int:
    source_value = os.environ.get("YONETIM_APPROVED_SCREENSHOT")
    source = Path(source_value).expanduser().resolve() if source_value else DESTINATION

    if not source.exists():
        raise SystemExit(
            "Approved screenshot is missing. Set YONETIM_APPROVED_SCREENSHOT to the approved PNG."
        )

    if source != DESTINATION:
        DESTINATION.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, DESTINATION)

    actual_sha256 = sha256(DESTINATION)
    if actual_sha256 != EXPECTED_SHA256:
        raise SystemExit(
            f"Approved screenshot checksum differs: expected={EXPECTED_SHA256}, actual={actual_sha256}"
        )

    validate_dimensions(DESTINATION)
    print(f"Approved screenshot ready: {DESTINATION.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
