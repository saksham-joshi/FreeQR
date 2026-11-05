from .builder import QRInputError, build_scene
from .models import QROptions
from .raster import render_raster
from .svg import render_svg

__all__ = ["QRInputError", "QROptions", "render"]


def render(options: QROptions) -> bytes:
    scene = build_scene(options)
    if options.format == "svg":
        return render_svg(scene)
    return render_raster(scene, options.format)
