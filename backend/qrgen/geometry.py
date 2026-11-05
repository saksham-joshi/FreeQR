"""Vector shapes in module units, shared by the SVG and raster renderers.

A subpath is a list of commands: ("M", x, y), ("L", x, y),
("C", x1, y1, x2, y2, x, y) and ("Z",).
"""

from __future__ import annotations

import math

# Handle length of a cubic bezier that approximates a quarter circle.
K = 0.5522847498307936

Command = tuple
Subpath = list[Command]
Radii = tuple[float, float, float, float]  # top-left, top-right, bottom-right, bottom-left


def rect(x: float, y: float, w: float, h: float) -> Subpath:
    return [("M", x, y), ("L", x + w, y), ("L", x + w, y + h), ("L", x, y + h), ("Z",)]


def rounded_rect(x: float, y: float, w: float, h: float, radii: Radii) -> Subpath:
    tl, tr, br, bl = (min(r, w / 2, h / 2) for r in radii)
    path: Subpath = [("M", x + tl, y), ("L", x + w - tr, y)]
    if tr:
        path.append(("C", x + w - tr + tr * K, y, x + w, y + tr - tr * K, x + w, y + tr))
    path.append(("L", x + w, y + h - br))
    if br:
        path.append(("C", x + w, y + h - br + br * K, x + w - br + br * K, y + h, x + w - br, y + h))
    path.append(("L", x + bl, y + h))
    if bl:
        path.append(("C", x + bl - bl * K, y + h, x, y + h - bl + bl * K, x, y + h - bl))
    path.append(("L", x, y + tl))
    if tl:
        path.append(("C", x, y + tl - tl * K, x + tl - tl * K, y, x + tl, y))
    path.append(("Z",))
    return path


def circle(cx: float, cy: float, r: float) -> Subpath:
    return rounded_rect(cx - r, cy - r, 2 * r, 2 * r, (r, r, r, r))


def polygon(points: list[tuple[float, float]]) -> Subpath:
    first, *rest = points
    return [("M", *first), *(("L", *p) for p in rest), ("Z",)]


def diamond(x: float, y: float, w: float, h: float) -> Subpath:
    return polygon([(x + w / 2, y), (x + w, y + h / 2), (x + w / 2, y + h), (x, y + h / 2)])


def octagon(x: float, y: float, size: float, cut: float) -> Subpath:
    e = x + size
    b = y + size
    return polygon([
        (x + cut, y), (e - cut, y), (e, y + cut), (e, b - cut),
        (e - cut, b), (x + cut, b), (x, b - cut), (x, y + cut),
    ])


def star(x: float, y: float, w: float, h: float, inner: float = 0.5) -> Subpath:
    """Five-pointed star filling the width of its box, centred on its bounding box."""
    r = min(w / (2 * math.sin(math.radians(72))), h / (1 + math.cos(math.radians(36))))
    cx = x + w / 2
    # The star's bounding box sits lower than its centre point; shift it up to centre it.
    cy = y + h / 2 + r * (1 - math.cos(math.radians(36))) / 2
    points = []
    for i in range(10):
        radius = r if i % 2 == 0 else r * inner
        angle = math.radians(-90 + i * 36)
        points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return polygon(points)


# A heart drawn in a unit square, as (start point, cubic segments).
_HEART_START = (0.5, 0.95)
_HEART_CURVES = [
    (0.30, 0.80, 0.02, 0.60, 0.02, 0.36),
    (0.02, 0.17, 0.13, 0.06, 0.27, 0.06),
    (0.38, 0.06, 0.46, 0.12, 0.50, 0.21),
    (0.54, 0.12, 0.62, 0.06, 0.73, 0.06),
    (0.87, 0.06, 0.98, 0.17, 0.98, 0.36),
    (0.98, 0.60, 0.70, 0.80, 0.50, 0.95),
]


def heart(x: float, y: float, w: float, h: float) -> Subpath:
    sx, sy = _HEART_START
    path: Subpath = [("M", x + sx * w, y + sy * h)]
    for x1, y1, x2, y2, x3, y3 in _HEART_CURVES:
        path.append(("C", x + x1 * w, y + y1 * h, x + x2 * w, y + y2 * h, x + x3 * w, y + y3 * h))
    path.append(("Z",))
    return path
