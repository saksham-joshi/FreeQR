from __future__ import annotations

import base64
import io
import math

from .builder import Scene
from .geometry import Subpath


def _num(value: float) -> str:
    text = f"{value:.3f}".rstrip("0").rstrip(".")
    return "0" if text in ("", "-0") else text


def _path_data(subpaths: list[Subpath]) -> str:
    out = []
    for subpath in subpaths:
        for command in subpath:
            out.append(command[0] + " ".join(_num(v) for v in command[1:]))
    return "".join(out)


def _gradient(scene: Scene) -> str:
    fill = scene.pattern_fill
    n = scene.size
    stops = f'<stop offset="0" stop-color="{fill.color}"/><stop offset="1" stop-color="{fill.color2}"/>'
    if fill.type == "radial":
        return (
            f'<radialGradient id="qr-fill" gradientUnits="userSpaceOnUse" '
            f'cx="{_num(n / 2)}" cy="{_num(n / 2)}" r="{_num(n / math.sqrt(2))}">{stops}</radialGradient>'
        )
    # Run the gradient corner to corner along its direction, matching the raster renderer.
    angle = math.radians(fill.angle)
    dx, dy = math.cos(angle), math.sin(angle)
    half = n / 2 * (abs(dx) + abs(dy))
    c = n / 2
    return (
        f'<linearGradient id="qr-fill" gradientUnits="userSpaceOnUse" '
        f'x1="{_num(c - half * dx)}" y1="{_num(c - half * dy)}" '
        f'x2="{_num(c + half * dx)}" y2="{_num(c + half * dy)}">{stops}</linearGradient>'
    )


def render_svg(scene: Scene) -> bytes:
    w, h = scene.width, scene.height
    gradient = scene.pattern_fill.type != "solid"
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
    ]
    if gradient:
        parts.append(f"<defs>{_gradient(scene)}</defs>")
    if scene.background:
        parts.append(f'<rect width="{w}" height="{h}" fill="{scene.background}"/>')

    # Shapes are drawn in module units; the group places and scales the whole code.
    parts.append(
        f'<g transform="translate({_num(scene.origin_x)} {_num(scene.origin_y)}) scale({_num(scene.module)})">'
    )
    if scene.pattern.fills:
        paint = "url(#qr-fill)" if gradient else scene.pattern_fill.color
        parts.append(f'<path fill="{paint}" d="{_path_data(scene.pattern.fills)}"/>')
    frames = scene.frames.fills + scene.frames.holes
    parts.append(f'<path fill="{scene.frame_color}" fill-rule="evenodd" d="{_path_data(frames)}"/>')
    parts.append(f'<path fill="{scene.dot_color}" d="{_path_data(scene.dots.fills)}"/>')

    if scene.logo and scene.logo_box:
        buffer = io.BytesIO()
        scene.logo.save(buffer, "PNG")
        href = "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")
        x, y, bw, bh = (_num(v) for v in scene.logo_box)
        parts.append(
            f'<image x="{x}" y="{y}" width="{bw}" height="{bh}" preserveAspectRatio="xMidYMid meet" '
            f'href="{href}" xlink:href="{href}"/>'
        )
    parts.append("</g></svg>")
    return "".join(parts).encode("utf-8")
