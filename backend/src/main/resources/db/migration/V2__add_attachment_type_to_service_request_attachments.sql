-- Add attachment_type column to service_request_attachments table
-- This migration adds support for distinguishing between REQUEST and RESOLUTION attachments

ALTER TABLE service_request_attachments
ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(20) NOT NULL DEFAULT 'REQUEST';
