"""Oracle Database connection pooling using python-oracledb.

We use a session pool for efficient reuse. Thick mode is enabled when
ORACLE_CLIENT_LIB_DIR is set — some Exadata features (like OCI wallet
authentication and certain V$ views) need the Oracle Client libraries.
"""
import oracledb
import logging
from contextlib import contextmanager
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_pool: oracledb.ConnectionPool | None = None


def init_pool() -> oracledb.ConnectionPool:
    """Initialise a connection pool. Call once at app startup."""
    global _pool

    # Enable thick mode if instant client path is configured
    if settings.ORACLE_CLIENT_LIB_DIR:
        try:
            oracledb.init_oracle_client(lib_dir=settings.ORACLE_CLIENT_LIB_DIR)
            logger.info("Oracle thick mode initialised.")
        except oracledb.ProgrammingError:
            # Already initialised
            pass

    dsn = oracledb.makedsn(
        settings.ORACLE_HOST,
        settings.ORACLE_PORT,
        service_name=settings.ORACLE_SERVICE,
    )

    _pool = oracledb.create_pool(
        user=settings.ORACLE_USER,
        password=settings.ORACLE_PASSWORD,
        dsn=dsn,
        min=2,
        max=10,
        increment=1,
        getmode=oracledb.POOL_GETMODE_WAIT,
    )
    logger.info(f"Oracle pool created: {settings.ORACLE_HOST}:{settings.ORACLE_PORT}/{settings.ORACLE_SERVICE}")
    return _pool


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


@contextmanager
def get_connection():
    """Yield a connection from the pool and return it automatically."""
    if _pool is None:
        raise RuntimeError("Oracle pool is not initialised. Call init_pool() first.")
    conn = _pool.acquire()
    try:
        yield conn
    finally:
        _pool.release(conn)


def run_query(sql: str, params: dict | None = None) -> list[dict]:
    """Execute a SELECT and return rows as a list of dicts."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, params or {})
        columns = [col[0].lower() for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        return rows
