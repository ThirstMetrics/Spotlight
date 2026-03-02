-- Spotlight Database Initialization
-- This runs on first container start when the data volume is empty.
-- Prisma migrations handle schema creation — this just ensures the DB exists.

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
