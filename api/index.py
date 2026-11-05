"""Vercel entry point: serves the FastAPI app in backend/ as a serverless function."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app import app  # noqa: E402

__all__ = ["app"]
