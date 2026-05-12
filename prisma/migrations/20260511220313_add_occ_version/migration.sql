-- Migration: add_occ_version_to_patients
-- Generated: 2026-05-11T22:03:13 (timestamp: 20260511220313)
--
-- Adds the `version` column to the `patients` table for
-- Optimistic Concurrency Control (OCC).
-- Safe for production: NOT NULL with DEFAULT 1 means all existing rows
-- receive version=1 instantly without a table rewrite on PostgreSQL 11+.

ALTER TABLE "patients" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
