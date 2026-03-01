-- PostgreSQL initialization script for Spotlight
-- This runs automatically on first container start when the data volume is empty.

-- Create the spotlight database if it doesn't already exist.
-- Note: The POSTGRES_DB env var in docker-compose already creates the default database,
-- but this script ensures it exists for manual setups or custom entrypoints.
SELECT 'CREATE DATABASE spotlight'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'spotlight')\gexec

-- Enable useful extensions
\c spotlight

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
