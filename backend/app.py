from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from qrgen import QRInputError, QROptions, render

app = FastAPI(
    title="FreeQR",
    summary="Generate free QR Code with custom colors and design",
    description="",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this for production
    allow_methods=["*"],
    allow_headers=["*"],
)

MEDIA_TYPES = {"svg": "image/svg+xml", "png": "image/png", "jpg": "image/jpeg"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post(
    "/api/qr",
    response_class=Response,
    responses={200: {"content": {media_type: {} for media_type in MEDIA_TYPES.values()}}},
)
def create_qr(options: QROptions) -> Response:
    """Render a QR code for `options.data` as an SVG, PNG or JPG file."""
    try:
        content = render(options)
    except QRInputError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return Response(
        content=content,
        media_type=MEDIA_TYPES[options.format],
        headers={"Cache-Control": "no-store"},
    )
