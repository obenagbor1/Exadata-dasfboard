-- ============================================================================
-- Exadata Monitoring User Setup
-- ============================================================================
-- Run as SYSDBA. This creates a dedicated read-only user for the dashboard.
-- Replace 'StrongPassword123!' with a secure password stored in a vault.
-- ============================================================================

-- 1. Create the monitoring user
CREATE USER dashboard_mon IDENTIFIED BY "StrongPassword123!"
  DEFAULT TABLESPACE users
  TEMPORARY TABLESPACE temp
  QUOTA 0 ON users;

-- 2. Basic session privileges
GRANT CREATE SESSION TO dashboard_mon;

-- 3. Core data-dictionary access
GRANT SELECT_CATALOG_ROLE TO dashboard_mon;
GRANT SELECT ANY DICTIONARY TO dashboard_mon;

-- 4. Explicit grants on performance views
--    (Needed because SELECT_CATALOG_ROLE isn't available inside PL/SQL.)
GRANT SELECT ON v_$instance              TO dashboard_mon;
GRANT SELECT ON gv_$instance             TO dashboard_mon;
GRANT SELECT ON v_$database              TO dashboard_mon;
GRANT SELECT ON v_$sysmetric             TO dashboard_mon;
GRANT SELECT ON gv_$session              TO dashboard_mon;
GRANT SELECT ON gv_$sga                  TO dashboard_mon;
GRANT SELECT ON gv_$pgastat              TO dashboard_mon;
GRANT SELECT ON v_$system_event          TO dashboard_mon;
GRANT SELECT ON v_$active_session_history TO dashboard_mon; -- Diagnostics Pack required
GRANT SELECT ON v_$sqlstats              TO dashboard_mon;
GRANT SELECT ON v_$sysstat               TO dashboard_mon;
GRANT SELECT ON v_$diag_alert_ext        TO dashboard_mon;
GRANT SELECT ON v_$rman_backup_job_details TO dashboard_mon;

-- 5. Storage views
GRANT SELECT ON dba_data_files           TO dashboard_mon;
GRANT SELECT ON dba_free_space           TO dashboard_mon;
GRANT SELECT ON dba_tablespaces          TO dashboard_mon;

-- 6. ASM disk group visibility
--    If the database is an ASM client, these views are available directly.
GRANT SELECT ON v_$asm_diskgroup         TO dashboard_mon;
GRANT SELECT ON v_$asm_disk              TO dashboard_mon;

-- 7. (Exadata only) Cell statistics — already covered by v_$sysstat above.
--    Additional cell views if you want per-cell drill-down later:
-- GRANT SELECT ON v_$cell_state          TO dashboard_mon;
-- GRANT SELECT ON v_$cell_config         TO dashboard_mon;
-- GRANT SELECT ON v_$cell_thread_history TO dashboard_mon;

-- 8. Profile-level protection (optional but recommended)
ALTER USER dashboard_mon PROFILE default;

-- 9. Verify
-- SELECT * FROM dba_role_privs WHERE grantee = 'DASHBOARD_MON';
-- SELECT * FROM dba_tab_privs  WHERE grantee = 'DASHBOARD_MON';

-- ============================================================================
-- NOTE: Viewing v$active_session_history and v$sqlstats in full requires the
-- Oracle Diagnostics Pack licence. If you are not licensed, remove the two
-- ASH/SQL tuning queries from app/db/queries.py or replace with free
-- alternatives (e.g. DBA_HIST_ACTIVE_SESS_HISTORY is also Diagnostics Pack).
-- ============================================================================
