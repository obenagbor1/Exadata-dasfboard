"""Monitoring endpoints — one per metric group."""
from fastapi import APIRouter, Depends
from app.services.monitoring import MonitoringService
from app.core.security import get_current_user

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

# All endpoints require auth
Auth = Depends(get_current_user)


@router.get("/overview")
def overview(_=Auth):
    """Dashboard landing page summary."""
    return MonitoringService.get_overview()


@router.get("/instances")
def instances(_=Auth):
    return MonitoringService.get_instance_info()


@router.get("/database")
def database(_=Auth):
    return MonitoringService.get_database_info()


@router.get("/cpu")
def cpu(_=Auth):
    return MonitoringService.get_cpu()


@router.get("/sessions")
def sessions(_=Auth):
    return MonitoringService.get_sessions()


@router.get("/memory/sga")
def sga(_=Auth):
    return MonitoringService.get_sga()


@router.get("/memory/pga")
def pga(_=Auth):
    return MonitoringService.get_pga()


@router.get("/waits/top")
def top_waits(_=Auth):
    return MonitoringService.get_top_waits()


@router.get("/waits/ash")
def ash_waits(_=Auth):
    return MonitoringService.get_ash_waits()


@router.get("/storage/tablespaces")
def tablespaces(_=Auth):
    return MonitoringService.get_tablespaces()


@router.get("/storage/asm")
def asm(_=Auth):
    return MonitoringService.get_asm_diskgroups()


@router.get("/sql/top")
def top_sql(_=Auth):
    return MonitoringService.get_top_sql()


@router.get("/exadata/offload")
def offload(_=Auth):
    return MonitoringService.get_offload_efficiency()


@router.get("/exadata/flash-cache")
def flash_cache(_=Auth):
    return MonitoringService.get_flash_cache()


@router.get("/backups")
def backups(_=Auth):
    return MonitoringService.get_recent_backups()


@router.get("/alerts")
def alerts(_=Auth):
    return MonitoringService.get_alerts()


@router.get("/blocking")
def blocking(_=Auth):
    return MonitoringService.get_blocking()
