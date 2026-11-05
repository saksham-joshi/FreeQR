### To Run: `fastapi dev`

Install first with `pip install -r requirements-dev.txt` (inside a virtualenv). `requirements.txt` holds only the runtime dependencies that Vercel installs. API docs are at http://127.0.0.1:8000/docs.

- `POST /api/qr` takes the options in `qrgen/models.py` and returns an SVG, PNG or JPG file.
- `qrgen/builder.py` turns the options into vector layers; `svg.py` and `raster.py` render the same layers.
