-- READ ONLY. Review results privately; do not paste connection details into logs.
-- Run manually on the intended development branch, only after reviewing the plan.
SELECT current_database() AS database_name, current_user AS role_name,
       current_setting('server_version') AS postgres_version;
SELECT schema_name FROM information_schema.schemata
WHERE schema_name IN ('public', 'portfolio', 'storage', 'auth');
SELECT table_schema, table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema IN ('public', 'portfolio')
ORDER BY table_schema, table_name, ordinal_position;
SELECT schemaname, tablename, indexname, indexdef FROM pg_indexes
WHERE schemaname IN ('public', 'portfolio') ORDER BY schemaname, tablename, indexname;
SELECT table_schema, table_name, grantee, privilege_type
FROM information_schema.table_privileges WHERE table_schema = 'portfolio';
