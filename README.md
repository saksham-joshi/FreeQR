# FreeQR
Generate your free QR code with custom colors and designs!

Paste a link, choose the pattern, corner frames, corner dots, colors (solid or gradient), background (or transparent), a center picture, the image size and margins, then download it as SVG, PNG or JPG.

## Structure

- `frontend/`: React + Vite + TypeScript + Tailwind CSS. The live preview and the download controls.
- `backend/`: FastAPI. `POST /api/qr` renders the code. `qrgen/` builds one set of vector shapes and writes it out as SVG or rasterises it with Pillow, so the preview and the downloads always match.
- `api/index.py`: the Vercel serverless entry point that serves the backend.

## Run locally

```sh
# Backend, on http://127.0.0.1:8000
cd backend
python -m venv .venv
.venv/Scripts/activate      # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
fastapi dev

# Frontend, on http://localhost:5173 (proxies /api to the backend)
cd frontend
pnpm install
pnpm dev
```

## Deploy to Vercel

Import the repository with the project root as the root directory. `vercel.json` builds `frontend/` as static files and sends `/api/*` to the Python function in `api/index.py`, which installs its dependencies from the root `requirements.txt`.
