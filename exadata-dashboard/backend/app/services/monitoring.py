"""Service layer: wraps SQL execution with error handling and caching."""
import logging
from datetime import datetime
from app.db import queries
from app.db.oracle import run_query

logger = logging.getLogger(__name__)


def _safe(query: str, label: str) -> list[dict]:
    """Run a query; return [] on error so one failure doesn't break the dashboard."""
    try:
        return run_query(query)
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"Query '{label}' failed: {exc}")
        return []


class MonitoringService:
    """High-level API consumed by the FastAPI endpoints."""

    # --- overview ---
    @staticmethod
    def get_instance_info() -> list[dict]:
        return _safe(queries.INSTANCE_INFO, "instance_info")

    @staticmethod
    def get_database_info() -> list[dict]:
        return _safe(queries.DATABASE_INFO, "database_info")

    # --- resource utilisation ---
    @staticmethod
    def get_cpu() -> list[dict]:
        return _safe(queries.CPU_UTILISATION, "cpu")

    @staticmethod
    def get_sessions() -> list[dict]:
        return _safe(queries.ACTIVE_SESSIONS, "sessions")

    @staticmethod
    def get_sga() -> list[dict]:
        return _safe(queries.SGA_USAGE, "sga")

    @staticmethod
    def get_pga() -> list[dict]:
        return _safe(queries.PGA_USAGE, "pga")

    # --- waits ---
    @staticmethod
    def get_top_waits() -> list[dict]:
        return _safe(queries.TOP_WAIT_EVENTS, "top_waits")

    @staticmethod
    def get_ash_waits() -> list[dict]:
        return _safe(queries.ASH_ACTIVE_WAITS, "ash_waits")

    # --- storage ---
    @staticmethod
    def get_tablespaces() -> list[dict]:
        return _safe(queries.TABLESPACE_USAGE, "tablespaces")

    @staticmethod
    def get_asm_diskgroups() -> list[dict]:
        return _safe(queries.ASM_DISKGROUP_USAGE, "asm_diskgroups")

    # --- SQL ---
    @staticmethod
    def get_top_sql() -> list[dict]:
        return _safe(queries.TOP_SQL_BY_ELAPSED, "top_sql")

    # --- Exadata-specific ---
    @staticmethod
    def get_offload_efficiency() -> list[dict]:
        return _safe(queries.CELL_OFFLOAD_EFFICIENCY, "offload")

    @staticmethod
    def get_flash_cache() -> list[dict]:
        return _safe(queries.FLASH_CACHE_STATS, "flash_cache")

    # --- backup ---
    @staticmethod
    def get_recent_backups() -> list[dict]:
        return _safe(queries.RECENT_BACKUPS, "backups")

    # --- alerts / blocking ---
    @staticmethod
    def get_alerts() -> list[dict]:
        return _safe(queries.CRITICAL_ALERTS, "alerts")

    @staticmethod
    def get_blocking() -> list[dict]:
        return _safe(queries.BLOCKING_SESSIONS, "blocking")

    # --- aggregated overview for dashboard landing page ---
    @staticmethod
    def get_overview() -> dict:
        return {
            "generated_at": datetime.utcnow().isoformat(),
            "database": MonitoringService.get_database_info(),
            "instances": MonitoringService.get_instance_info(),
            "cpu": MonitoringService.get_cpu(),
            "sessions": MonitoringService.get_sessions(),
            "tablespaces_top": MonitoringService.get_tablespaces()[:5],
            "asm_diskgroups": MonitoringService.get_asm_diskgroups(),
            "offload": MonitoringService.get_offload_efficiency(),
            "blocking_count": len(MonitoringService.get_blocking()),
        }
