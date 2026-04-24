"""FastAPI entry point for the Exadata monitoring dashboard."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.oracle import init_pool, close_pool
from app.api import auth, metrics

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)
logger = logging.getLogger("exadata-dashboard")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — initialising Oracle pool")
    try:
        init_pool()
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Oracle pool init failed: {exc}")
        # Start the API anyway so /health still works; metrics endpoints
        # will surface a clear error when called.
    yield
    logger.info("Shutting down — closing Oracle pool")
    close_pool()


app = FastAPI(
    title="Exadata Monitoring Dashboard API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(metrics.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/")
def root() -> dict:
    return {"service": "Exadata Monitoring Dashboard", "docs": "/docs"}
