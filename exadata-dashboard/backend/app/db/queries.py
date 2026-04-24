"""Catalogue of SQL queries used by the dashboard.

These queries target the common Oracle performance views (V$, DBA_*) plus
Exadata-specific views (V$CELL_*, V$IOSTAT_FILE). The DB user needs at
minimum: SELECT_CATALOG_ROLE, plus SELECT on the V_$ and GV_$ views used.
For Exadata-specific views the user also needs SYSDBA-level access or a
role such as EXADATA_MONITOR.
"""

# ---- Instance / high-level health ----------------------------------------

INSTANCE_INFO = """
SELECT
    instance_number,
    instance_name,
    host_name,
    version,
    startup_time,
    status,
    database_status,
    active_state,
    ROUND((SYSDATE - startup_time) * 24, 2) AS uptime_hours
FROM gv$instance
ORDER BY instance_number
"""

DATABASE_INFO = """
SELECT
    name AS db_name,
    db_unique_name,
    database_role,
    open_mode,
    log_mode,
    protection_mode,
    created,
    platform_name
FROM v$database
"""

# ---- CPU, sessions, memory -----------------------------------------------

# Per-instance CPU% over the last 5 minutes (approximate)
CPU_UTILISATION = """
SELECT
    instance_number,
    ROUND(value, 2) AS cpu_used_pct
FROM gv$sysmetric
WHERE metric_name = 'Host CPU Utilization (%)'
  AND group_id   = 2
"""

ACTIVE_SESSIONS = """
SELECT
    inst_id                                              AS instance_number,
    COUNT(*)                                             AS total_sessions,
    SUM(CASE WHEN status = 'ACTIVE'   THEN 1 ELSE 0 END) AS active_sessions,
    SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END) AS inactive_sessions,
    SUM(CASE WHEN type   = 'BACKGROUND' THEN 1 ELSE 0 END) AS background_sessions
FROM gv$session
GROUP BY inst_id
ORDER BY inst_id
"""

SGA_USAGE = """
SELECT
    inst_id AS instance_number,
    name    AS component,
    ROUND(value / 1024 / 1024, 2) AS size_mb
FROM gv$sga
ORDER BY inst_id, component
"""

PGA_USAGE = """
SELECT
    inst_id                           AS instance_number,
    name                              AS metric,
    ROUND(value / 1024 / 1024, 2)     AS value_mb
FROM gv$pgastat
WHERE name IN (
    'total PGA inuse',
    'total PGA allocated',
    'maximum PGA allocated',
    'aggregate PGA target parameter'
)
ORDER BY inst_id, metric
"""

# ---- Wait events ---------------------------------------------------------

TOP_WAIT_EVENTS = """
SELECT *
FROM (
    SELECT
        event,
        wait_class,
        total_waits,
        ROUND(time_waited / 100, 2) AS time_waited_sec,
        ROUND(average_wait / 100, 4) AS avg_wait_sec
    FROM v$system_event
    WHERE wait_class != 'Idle'
    ORDER BY time_waited DESC
)
WHERE ROWNUM <= 20
"""

ASH_ACTIVE_WAITS = """
SELECT
    session_state,
    wait_class,
    COUNT(*) AS sample_count
FROM v$active_session_history
WHERE sample_time > SYSDATE - INTERVAL '5' MINUTE
GROUP BY session_state, wait_class
ORDER BY sample_count DESC
"""

# ---- Tablespace / storage health ----------------------------------------

TABLESPACE_USAGE = """
SELECT
    df.tablespace_name,
    ROUND(df.total_mb, 2)                              AS total_mb,
    ROUND(df.total_mb - NVL(fs.free_mb, 0), 2)         AS used_mb,
    ROUND(NVL(fs.free_mb, 0), 2)                       AS free_mb,
    ROUND(((df.total_mb - NVL(fs.free_mb, 0)) / df.total_mb) * 100, 2) AS used_pct
FROM (
    SELECT tablespace_name, SUM(bytes)/1024/1024 AS total_mb
    FROM dba_data_files GROUP BY tablespace_name
) df
LEFT JOIN (
    SELECT tablespace_name, SUM(bytes)/1024/1024 AS free_mb
    FROM dba_free_space GROUP BY tablespace_name
) fs ON df.tablespace_name = fs.tablespace_name
ORDER BY used_pct DESC
"""

ASM_DISKGROUP_USAGE = """
SELECT
    name                                               AS diskgroup,
    state,
    type                                               AS redundancy,
    ROUND(total_mb / 1024, 2)                          AS total_gb,
    ROUND((total_mb - free_mb) / 1024, 2)              AS used_gb,
    ROUND(free_mb / 1024, 2)                           AS free_gb,
    ROUND(((total_mb - free_mb) / total_mb) * 100, 2)  AS used_pct
FROM v$asm_diskgroup
ORDER BY name
"""

# ---- Top SQL by elapsed time --------------------------------------------

TOP_SQL_BY_ELAPSED = """
SELECT *
FROM (
    SELECT
        sql_id,
        SUBSTR(sql_text, 1, 120)                  AS sql_text,
        executions,
        ROUND(elapsed_time/1000000, 2)            AS elapsed_sec,
        ROUND(cpu_time/1000000, 2)                AS cpu_sec,
        ROUND(elapsed_time/GREATEST(executions,1)/1000000, 4) AS avg_elapsed_sec,
        buffer_gets,
        disk_reads,
        rows_processed
    FROM v$sqlstats
    ORDER BY elapsed_time DESC
)
WHERE ROWNUM <= 20
"""

# ---- Exadata Smart Scan / Cell offload ----------------------------------

# These views only exist on Exadata. Queries are wrapped with a
# BEGIN/EXCEPTION at the service level so non-Exadata environments don't
# crash the dashboard.
CELL_OFFLOAD_EFFICIENCY = """
SELECT
    ROUND(SUM(CASE WHEN name LIKE 'cell physical IO bytes eligible for predicate offload' THEN value END) / 1024 / 1024 / 1024, 2) AS eligible_gb,
    ROUND(SUM(CASE WHEN name LIKE 'cell physical IO interconnect bytes returned by smart scan' THEN value END) / 1024 / 1024 / 1024, 2) AS returned_gb,
    ROUND(
        100 * (1 -
            SUM(CASE WHEN name LIKE 'cell physical IO interconnect bytes returned by smart scan' THEN value END) /
            NULLIF(SUM(CASE WHEN name LIKE 'cell physical IO bytes eligible for predicate offload' THEN value END), 0)
        ), 2
    ) AS offload_efficiency_pct
FROM v$sysstat
WHERE name IN (
    'cell physical IO bytes eligible for predicate offload',
    'cell physical IO interconnect bytes returned by smart scan'
)
"""

FLASH_CACHE_STATS = """
SELECT
    name                                 AS metric,
    ROUND(value / 1024 / 1024 / 1024, 2) AS value_gb
FROM v$sysstat
WHERE name IN (
    'cell flash cache read hits',
    'physical read total IO requests',
    'physical read total bytes'
)
"""

# ---- Backup / RMAN status -----------------------------------------------

RECENT_BACKUPS = """
SELECT *
FROM (
    SELECT
        session_key,
        input_type,
        status,
        start_time,
        end_time,
        ROUND(elapsed_seconds / 60, 2)               AS elapsed_min,
        ROUND(input_bytes / 1024 / 1024 / 1024, 2)   AS input_gb,
        ROUND(output_bytes / 1024 / 1024 / 1024, 2)  AS output_gb
    FROM v$rman_backup_job_details
    ORDER BY start_time DESC
)
WHERE ROWNUM <= 15
"""

# ---- Alert log summary --------------------------------------------------

CRITICAL_ALERTS = """
SELECT *
FROM (
    SELECT
        originating_timestamp,
        message_level,
        message_type,
        host_id,
        SUBSTR(message_text, 1, 300) AS message_text
    FROM v$diag_alert_ext
    WHERE originating_timestamp > SYSDATE - 1
      AND message_level <= 8
    ORDER BY originating_timestamp DESC
)
WHERE ROWNUM <= 50
"""

# ---- Blocking sessions --------------------------------------------------

BLOCKING_SESSIONS = """
SELECT
    blocker.inst_id   AS blocker_inst,
    blocker.sid       AS blocker_sid,
    blocker.username  AS blocker_user,
    blocker.machine   AS blocker_machine,
    waiter.inst_id    AS waiter_inst,
    waiter.sid        AS waiter_sid,
    waiter.username   AS waiter_user,
    waiter.event      AS waiter_event,
    waiter.seconds_in_wait
FROM gv$session blocker
JOIN gv$session waiter
  ON blocker.sid = waiter.blocking_session
 AND blocker.inst_id = waiter.blocking_instance
ORDER BY waiter.seconds_in_wait DESC
"""
