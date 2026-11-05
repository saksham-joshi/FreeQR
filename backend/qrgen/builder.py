"""Turns request options into a Scene: positioned vector layers ready to render."""

from __future__ import annotations

import base64
import binascii
import io
import math
from dataclasses import dataclass, field

import segno
from PIL import Image

from . import geometry as g
from .models import Fill, QROptions

Image.MAX_IMAGE_PIXELS = 4096 * 4096

PICTURE_ERROR = "The picture couldn't be read. Use a PNG, JPG or WebP image."


class QRInputError(ValueError):
    """A problem with the request that the user can fix."""


@dataclass
class Layer:
    fills: list[g.Subpath] = field(default_factory=list)
    # Cut out of the fills. Only used by layers whose shapes never overlap.
    holes: list[g.Subpath] = field(default_factory=list)


@dataclass
class Scene:
    width: int
    height: int
    # Placement of the code: module (0, 0) sits at origin, each module is `module` px wide.
    origin_x: float
    origin_y: float
    module: float
    size: int
    background: str | None
    pattern: Layer
    pattern_fill: Fill
    frames: Layer
    frame_color: str
    dots: Layer
    dot_color: str
    logo: Image.Image | None = None
    logo_box: tuple[float, float, float, float] | None = None  # x, y, w, h in modules


# Corner order for radii tuples: top-left, top-right, bottom-right, bottom-left.
# Each finder's "inner" corner is the one that faces the middle of the code.
_FINDERS = {"tl": 2, "tr": 3, "bl": 1}


def _leaf(radius: float, inner: int) -> g.Radii:
    outer = (inner + 2) % 4
    return tuple(radius if i in (inner, outer) else 0.0 for i in range(4))  # type: ignore[return-value]


def _drop(radius: float, inner: int) -> g.Radii:
    return tuple(0.0 if i == inner else radius for i in range(4))  # type: ignore[return-value]


def _frame(style: str, x: float, y: float, inner: int, layer: Layer) -> None:
    """The 7x7 ring of a finder pattern; the hole is the 5x5 square inside it."""
    if style == "dotted":
        for i in range(7):
            for j in range(7):
                if i in (0, 6) or j in (0, 6):
                    layer.fills.append(g.circle(x + i + 0.5, y + j + 0.5, 0.42))
        return
    if style == "square":
        outer, hole = g.rect(x, y, 7, 7), g.rect(x + 1, y + 1, 5, 5)
    elif style == "rounded":
        outer = g.rounded_rect(x, y, 7, 7, (2, 2, 2, 2))
        hole = g.rounded_rect(x + 1, y + 1, 5, 5, (1, 1, 1, 1))
    elif style == "circle":
        outer, hole = g.circle(x + 3.5, y + 3.5, 3.5), g.circle(x + 3.5, y + 3.5, 2.5)
    elif style == "leaf":
        outer = g.rounded_rect(x, y, 7, 7, _leaf(3, inner))
        hole = g.rounded_rect(x + 1, y + 1, 5, 5, _leaf(2, inner))
    elif style == "drop":
        outer = g.rounded_rect(x, y, 7, 7, _drop(3.5, inner))
        hole = g.rounded_rect(x + 1, y + 1, 5, 5, _drop(2.5, inner))
    else:  # chamfer: keep the diagonal edge as thick as the straight ones
        outer = g.octagon(x, y, 7, 2)
        hole = g.octagon(x + 1, y + 1, 5, 2 + math.sqrt(2) - 2)
    layer.fills.append(outer)
    layer.holes.append(hole)


def _dot(style: str, x: float, y: float, inner: int) -> g.Subpath:
    """The 3x3 centre of a finder pattern."""
    if style == "square":
        return g.rect(x, y, 3, 3)
    if style == "rounded":
        return g.rounded_rect(x, y, 3, 3, (0.9, 0.9, 0.9, 0.9))
    if style == "circle":
        return g.circle(x + 1.5, y + 1.5, 1.5)
    if style == "diamond":
        return g.diamond(x - 0.25, y - 0.25, 3.5, 3.5)
    if style == "heart":
        return g.heart(x - 0.2, y - 0.2, 3.4, 3.4)
    if style == "star":
        return g.star(x - 0.25, y - 0.25, 3.5, 3.5, inner=0.55)
    return g.rounded_rect(x, y, 3, 3, _leaf(1.5, inner))


def _module(style: str, x: int, y: int, top: bool, right: bool, bottom: bool, left: bool) -> g.Subpath:
    """One dark module. The neighbour flags say which adjacent modules are dark too."""
    if style == "rounded":
        r = 0.5
        return g.rounded_rect(x, y, 1, 1, (
            0 if top or left else r,
            0 if top or right else r,
            0 if bottom or right else r,
            0 if bottom or left else r,
        ))
    if style == "dots":
        return g.circle(x + 0.5, y + 0.5, 0.45)
    if style == "diamond":
        return g.diamond(x - 0.04, y - 0.04, 1.08, 1.08)
    if style == "heart":
        return g.heart(x - 0.04, y - 0.04, 1.08, 1.08)
    if style == "star":
        return g.star(x - 0.05, y - 0.05, 1.1, 1.1, inner=0.5)
    if style == "leaf":
        return g.rounded_rect(x, y, 1, 1, (0.5, 0, 0.5, 0))
    if style == "bars":
        r = 0.38
        return g.rounded_rect(x + 0.12, y, 0.76, 1, (
            0 if top else r, 0 if top else r, 0 if bottom else r, 0 if bottom else r,
        ))
    return g.rect(x, y, 1, 1)


def decode_picture(data_url: str) -> Image.Image:
    header, _, payload = data_url.partition(",")
    if not header.startswith("data:image/") or not header.endswith(";base64"):
        raise QRInputError(PICTURE_ERROR)
    try:
        picture = Image.open(io.BytesIO(base64.b64decode(payload, validate=True)))
        picture.load()
    except (binascii.Error, OSError, ValueError, Image.DecompressionBombError) as error:
        raise QRInputError(PICTURE_ERROR) from error
    picture = picture.convert("RGBA")
    picture.thumbnail((1024, 1024))
    return picture


def build_scene(options: QROptions) -> Scene:
    picture = options.image
    logo = decode_picture(picture.data_url) if picture else None

    try:
        # High error correction lets the code survive the picture covering part of it.
        qr = segno.make(options.data, error="h" if logo else "m", micro=False, boost_error=False)
    except segno.DataOverflowError as error:
        raise QRInputError("This link is too long for a QR code. Use a shorter link.") from error

    matrix = [[bool(v) for v in row] for row in qr.matrix_iter(scale=1, border=0)]
    n = len(matrix)

    space = min(options.width - 2 * options.margin_x, options.height - 2 * options.margin_y)
    if space < n:
        raise QRInputError(
            "The margins leave no room for the code. Lower margin X or Y, or make the image bigger."
        )
    module = space / n
    if module >= 3:
        # Whole-pixel modules keep straight edges crisp in PNG and JPG files.
        module = math.floor(module)
    origin_x = (options.width - module * n) / 2
    origin_y = (options.height - module * n) / 2

    finders = {"tl": (0, 0), "tr": (n - 7, 0), "bl": (0, n - 7)}

    def in_finder(r: int, c: int) -> bool:
        return (r < 7 and (c < 7 or c >= n - 7)) or (r >= n - 7 and c < 7)

    logo_box = None
    cleared = (n, -1)  # empty range
    if logo and picture:
        side = picture.size * n
        start = (n - side) / 2
        logo_box = (start, start, side, side)
        if picture.clear_behind:
            # Clear every module the picture touches, plus half a module of breathing room.
            pad = side + 1
            cleared = (math.floor((n - pad) / 2), math.ceil((n + pad) / 2) - 1)

    def dark(r: int, c: int) -> bool:
        if not (0 <= r < n and 0 <= c < n) or not matrix[r][c] or in_finder(r, c):
            return False
        lo, hi = cleared
        return not (lo <= r <= hi and lo <= c <= hi)

    style = options.pattern.style
    pattern = Layer()
    for r in range(n):
        c = 0
        while c < n:
            if not dark(r, c):
                c += 1
            elif style == "square":
                # Merge runs of square modules into one rectangle to keep files small.
                start = c
                while c < n and dark(r, c):
                    c += 1
                pattern.fills.append(g.rect(start, r, c - start, 1))
            else:
                pattern.fills.append(
                    _module(style, c, r, dark(r - 1, c), dark(r, c + 1), dark(r + 1, c), dark(r, c - 1))
                )
                c += 1

    frames, dots = Layer(), Layer()
    for key, (x, y) in finders.items():
        _frame(options.corner_frame.style, x, y, _FINDERS[key], frames)
        dots.fills.append(_dot(options.corner_dot.style, x + 2, y + 2, _FINDERS[key]))

    return Scene(
        width=options.width,
        height=options.height,
        origin_x=origin_x,
        origin_y=origin_y,
        module=module,
        size=n,
        background=None if options.background.transparent else options.background.color,
        pattern=pattern,
        pattern_fill=options.pattern.fill,
        frames=frames,
        frame_color=options.corner_frame.color,
        dots=dots,
        dot_color=options.corner_dot.color,
        logo=logo,
        logo_box=logo_box,
    )
