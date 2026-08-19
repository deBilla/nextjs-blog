#!/usr/bin/env python3
"""Turn a full-size portrait into the circular avatar the sidebar renders.

The source is a multi-megapixel phone photo, orders of magnitude more pixels
than the sidebar ever shows. This crops it square around the face, masks it to
a circle, and downscales to SIZE so the checked-in asset is small enough that
Astro's image pipeline has almost nothing left to do.

    python3 scripts/profile-avatar.py <source> [dest.png]

Re-run it against the original if the framing needs adjusting; the crop box is
the only thing worth tuning. HEIC straight off a phone is accepted — Pillow
cannot read it, so it is converted with sips first.
"""

import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

# Square crop, in the pixel coordinates of the *upright* image, chosen so the
# head sits centred with a little headroom.
CROP = (0, 500, 2316, 2816)

# Rendered at 5.5-6.5rem, so 512 covers a 2x display with room to spare.
SIZE = 512

# The mask is built at 4x and downsampled, which antialiases the circle edge —
# drawing an ellipse straight at SIZE leaves visible stair-stepping.
SUPERSAMPLE = 4


def load_upright(source: Path) -> Image.Image:
    """Open the source, converting via sips if Pillow has no decoder for it.

    A phone photo carries its rotation in EXIF rather than in the pixels, so the
    crop box would otherwise be measured against a sideways image.
    """
    try:
        image = Image.open(source)
    except OSError:
        converted = Path(tempfile.mkdtemp()) / "source.png"
        subprocess.run(
            ["sips", "-s", "format", "png", str(source), "--out", str(converted)],
            check=True,
            capture_output=True,
        )
        image = Image.open(converted)

    return ImageOps.exif_transpose(image).convert("RGB")


def build(source: Path, dest: Path) -> None:
    image = load_upright(source)

    left, top, right, bottom = CROP
    if right > image.width or bottom > image.height:
        raise SystemExit(
            f"crop {CROP} does not fit inside {source.name} ({image.width}x{image.height})"
        )
    if right - left != bottom - top:
        raise SystemExit(f"crop {CROP} is not square")

    face = image.crop(CROP).resize((SIZE, SIZE), Image.LANCZOS)

    mask = Image.new("L", (SIZE * SUPERSAMPLE, SIZE * SUPERSAMPLE), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, mask.width - 1, mask.height - 1), fill=255)
    mask = mask.resize((SIZE, SIZE), Image.LANCZOS)

    avatar = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    avatar.paste(face, (0, 0), mask)
    avatar.save(dest, "PNG", optimize=True)

    print(
        f"{source.name} {image.width}x{image.height} {source.stat().st_size / 1e6:.2f} MB"
        f"  ->  {dest.name} {SIZE}x{SIZE} {dest.stat().st_size / 1e3:.0f} kB"
    )


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    src = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("src/assets/profile.png")
    build(src, out)
