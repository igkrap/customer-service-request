-- Create companies table first (referenced by users and projects)
CREATE TABLE IF NOT EXISTS companies (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    company_code VARCHAR(50) NOT NULL UNIQUE,
    business_number VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20),
    company_id BIGINT,
    approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    profile_picture_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (role IN ('ROLE_CUSTOMER', 'ROLE_MANAGER', 'ROLE_ADMIN') OR role IS NULL),
    CONSTRAINT chk_users_approval_status CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    contract_man_days NUMERIC(10, 2) NOT NULL,
    license_key VARCHAR(50) UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_projects_service_type CHECK (service_type IN ('MAINTENANCE', 'DEFECT_REPAIR', 'ETC')),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Create customer_managers table for many-to-many relationship
CREATE TABLE IF NOT EXISTS customer_managers (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    manager_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(customer_id, manager_id)
);

-- Create service_requests table
CREATE TABLE IF NOT EXISTS service_requests (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    customer_id BIGINT NOT NULL,
    manager_id BIGINT,
    project_id BIGINT,
    created_by_user_id BIGINT,
    parent_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT,
    received_at TEXT,
    hours_spent DOUBLE PRECISION,
    resolution_notes TEXT,
    due_date TEXT,
    assigned_at TEXT,
    started_at TEXT,
    closed_at TEXT,
    cancelled_at TEXT,
    reopened_at TEXT,
    CONSTRAINT chk_service_requests_status CHECK (status IN ('OPEN', 'TRIAGE', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'HOLD', 'RESOLVED', 'REOPENED', 'CLOSED', 'CANCELLED')),
    CONSTRAINT chk_service_requests_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES service_requests(id) ON DELETE CASCADE
);

-- Create service_request_histories table
CREATE TABLE IF NOT EXISTS service_request_histories (
    id BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    from_manager_id BIGINT,
    to_manager_id BIGINT,
    note TEXT,
    created_by_user_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (from_manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (to_manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create user_projects table for many-to-many relationship between users and projects
CREATE TABLE IF NOT EXISTS user_projects (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(user_id, project_id)
);

-- Create project_requests table for customers to request new projects
CREATE TABLE IF NOT EXISTS project_requests (
    id BIGSERIAL PRIMARY KEY,
    requested_by_user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    contract_man_days NUMERIC(10, 2) NOT NULL,
    request_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_by_user_id BIGINT,
    approval_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_project_requests_status CHECK (request_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    FOREIGN KEY (requested_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create attachments table for file uploads
CREATE TABLE IF NOT EXISTS attachments (
    id BIGSERIAL PRIMARY KEY,
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    uploaded_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create service_request_attachments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS service_request_attachments (
    id BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT NOT NULL,
    attachment_id BIGINT NOT NULL,
    attachment_type VARCHAR(20) NOT NULL DEFAULT 'REQUEST',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_service_request_attachments_type CHECK (attachment_type IN ('REQUEST', 'RESOLUTION')),
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE CASCADE,
    UNIQUE(service_request_id, attachment_id)
);

-- Add foreign key constraint for users.profile_picture_id after attachments table is created
ALTER TABLE users
ADD CONSTRAINT fk_users_profile_picture
FOREIGN KEY (profile_picture_id) REFERENCES attachments(id) ON DELETE SET NULL;

-- Create email_settings table for SMTP configuration
CREATE TABLE IF NOT EXISTS email_settings (
    id BIGSERIAL PRIMARY KEY,
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INTEGER NOT NULL,
    smtp_username VARCHAR(255) NOT NULL,
    smtp_password VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    use_tls BOOLEAN NOT NULL DEFAULT true,
    use_ssl BOOLEAN NOT NULL DEFAULT false,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create email_templates table for customizable email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id BIGSERIAL PRIMARY KEY,
    template_code VARCHAR(100) NOT NULL UNIQUE,
    template_name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    description TEXT,
    variables TEXT,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_managers_customer_id ON customer_managers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_managers_manager_id ON customer_managers(manager_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_id ON service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_manager_id ON service_requests(manager_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_project_id ON service_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_priority ON service_requests(priority);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_by_user_id ON service_requests(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_due_date ON service_requests(due_date);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_at ON service_requests(assigned_at);
CREATE INDEX IF NOT EXISTS idx_service_requests_started_at ON service_requests(started_at);
CREATE INDEX IF NOT EXISTS idx_service_requests_closed_at ON service_requests(closed_at);
CREATE INDEX IF NOT EXISTS idx_service_requests_parent_id ON service_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_service_request_histories_request_id ON service_request_histories(service_request_id);
CREATE INDEX IF NOT EXISTS idx_service_request_histories_created_at ON service_request_histories(created_at);
CREATE INDEX IF NOT EXISTS idx_companies_company_code ON companies(company_code);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_license_key ON projects(license_key);
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_project_id ON user_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_project_requests_requested_by_user_id ON project_requests(requested_by_user_id);
CREATE INDEX IF NOT EXISTS idx_project_requests_company_id ON project_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_project_requests_request_status ON project_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_project_requests_approved_by_user_id ON project_requests(approved_by_user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by_user_id ON attachments(uploaded_by_user_id);
CREATE INDEX IF NOT EXISTS idx_service_request_attachments_service_request_id ON service_request_attachments(service_request_id);
CREATE INDEX IF NOT EXISTS idx_service_request_attachments_attachment_id ON service_request_attachments(attachment_id);

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create llm_configurations table for LLM settings
CREATE TABLE IF NOT EXISTS llm_configurations (
    id BIGSERIAL PRIMARY KEY,
    api_endpoint VARCHAR(500) NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    embedding_model_name VARCHAR(255) NOT NULL,
    embedding_dimension INTEGER NOT NULL DEFAULT 1536,
    api_key VARCHAR(500),
    temperature DOUBLE PRECISION DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    top_p DOUBLE PRECISION DEFAULT 0.9,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create rag_documents table for knowledge base with vector embeddings
-- Using vector(3072) to support various embedding models (768, 1536, 3072 dimensions)
CREATE TABLE IF NOT EXISTS rag_documents (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    embedding vector(3072),
    embedding_dimension INTEGER NOT NULL DEFAULT 1536,
    metadata JSONB,
    category VARCHAR(100),
    enabled BOOLEAN NOT NULL DEFAULT true,
    uploaded_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for RAG documents
CREATE INDEX IF NOT EXISTS idx_rag_documents_category ON rag_documents(category);
CREATE INDEX IF NOT EXISTS idx_rag_documents_enabled ON rag_documents(enabled);
CREATE INDEX IF NOT EXISTS idx_rag_documents_uploaded_by_user_id ON rag_documents(uploaded_by_user_id);

-- Create vector similarity search index (IVFFlat for better performance on large datasets)
CREATE INDEX IF NOT EXISTS idx_rag_documents_embedding ON rag_documents
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
