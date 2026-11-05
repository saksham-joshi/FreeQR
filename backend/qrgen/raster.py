from __future__ import annotations

import io
import math

from PIL import Image, ImageColor, ImageDraw

from .builder import Layer, Scene
from .geometry import Subpath
from .models import Fill

# Shapes are drawn oversized and scaled down for smooth edges; this caps the working canvas.
MAX_SUPERSAMPLED_PIXELS = 8192 * 8192


def _supersample(width: int, height: int) -> int:
    return max(1, min(4, math.isqrt(MAX_SUPERSAMPLED_PIXELS // (width * height))))


def _flatten(subpath: Subpath, scale: float, dx: float, dy: float) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []
    cx = cy = 0.0
    for command in subpath:
        op = command[0]
        if op in ("M", "L"):
            cx, cy = command[1], command[2]
            points.append((dx + cx * scale, dy + cy * scale))
        elif op == "C":
            x1, y1, x2, y2, x3, y3 = command[1:]
            chord = math.hypot(x3 - cx, y3 - cy) * scale
            steps = max(2, min(32, int(chord / 3)))
            for i in range(1, steps + 1):
                t = i / steps
                mt = 1 - t
                a, b, c, d = mt * mt * mt, 3 * mt * mt * t, 3 * mt * t * t, t * t * t
                points.append((
                    dx + (a * cx + b * x1 + c * x2 + d * x3) * scale,
                    dy + (a * cy + b * y1 + c * y2 + d * y3) * scale,
                ))
            cx, cy = x3, y3
    return points


def _mask(layer: Layer, scene: Scene, ss: int) -> Image.Image:
    mask = Image.new("L", (scene.width * ss, scene.height * ss), 0)
    draw = ImageDraw.Draw(mask)
    scale, dx, dy = scene.module * ss, scene.origin_x * ss, scene.origin_y * ss
    for subpath in layer.fills:
        draw.polygon(_flatten(subpath, scale, dx, dy), fill=255)
    for subpath in layer.holes:
        draw.polygon(_flatten(subpath, scale, dx, dy), fill=0)
    if ss > 1:
        mask = mask.resize((scene.width, scene.height), Image.Resampling.BOX)
    return mask


def _gradient(fill: Fill, size: int) -> Image.Image:
    """An RGB square holding the gradient, laid out to match the SVG renderer."""
    base = 512
    if fill.type == "radial":
        # Pillow's radial gradient reaches white at radius 128; crop so that lands on the corners.
        half = round(128 / math.sqrt(2))
        ramp = Image.radial_gradient("L").crop((128 - half, 128 - half, 128 + half, 128 + half))
    else:
        span = abs(math.cos(math.radians(fill.angle))) + abs(math.sin(math.radians(fill.angle)))
        big = math.ceil(base * span)
        # Pillow's linear gradient runs top to bottom (90 degrees); rotate it onto the requested angle.
        ramp = Image.linear_gradient("L").resize((big, big), Image.Resampling.BILINEAR)
        ramp = ramp.rotate(90 - fill.angle, resample=Image.Resampling.BICUBIC)
        offset = (big - base) // 2
        ramp = ramp.crop((offset, offset, offset + base, offset + base))
    ramp = ramp.resize((size, size), Image.Resampling.BILINEAR)
    start = Image.new("RGB", (size, size), ImageColor.getrgb(fill.color))
    end = Image.new("RGB", (size, size), ImageColor.getrgb(fill.color2))
    return Image.composite(end, start, ramp)


def _paint(canvas: Image.Image, mask: Image.Image, color: str, scene: Scene | None = None) -> Image.Image:
    layer = Image.new("RGBA", canvas.size, ImageColor.getrgb(color) + (255,))
    if scene is not None:
        size = round(scene.module * scene.size)
        layer.paste(_gradient(scene.pattern_fill, size), (round(scene.origin_x), round(scene.origin_y)))
    layer.putalpha(mask)
    return Image.alpha_composite(canvas, layer)


def render_raster(scene: Scene, fmt: str) -> bytes:
    ss = _supersample(scene.width, scene.height)
    background = ImageColor.getrgb(scene.background) + (255,) if scene.background else (0, 0, 0, 0)
    canvas = Image.new("RGBA", (scene.width, scene.height), background)

    fill = scene.pattern_fill
    if scene.pattern.fills:
        gradient_scene = scene if fill.type != "solid" else None
        canvas = _paint(canvas, _mask(scene.pattern, scene, ss), fill.color, gradient_scene)
    canvas = _paint(canvas, _mask(scene.frames, scene, ss), scene.frame_color)
    canvas = _paint(canvas, _mask(scene.dots, scene, ss), scene.dot_color)

    if scene.logo and scene.logo_box:
        bx, by, bw, bh = (v * scene.module for v in scene.logo_box)
        logo = scene.logo
        fit = min(bw / logo.width, bh / logo.height)
        size = (max(1, round(logo.width * fit)), max(1, round(logo.height * fit)))
        logo = logo.resize(size, Image.Resampling.LANCZOS)
        x = round(scene.origin_x + bx + (bw - size[0]) / 2)
        y = round(scene.origin_y + by + (bh - size[1]) / 2)
        canvas.alpha_composite(logo, (x, y))

    buffer = io.BytesIO()
    if fmt == "jpg":
        # JPG has no transparency, so anything see-through lands on white.
        white = Image.new("RGBA", canvas.size, (255, 255, 255, 255))
        Image.alpha_composite(white, canvas).convert("RGB").save(buffer, "JPEG", quality=95, subsampling=0)
    else:
        canvas.save(buffer, "PNG")
    return buffer.getvalue()
