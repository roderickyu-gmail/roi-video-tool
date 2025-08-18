-- ROI Video Tool Database Schema
-- Version: 1.0.0
-- Created: 2024-01-18

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. ORGANIZATIONS & TEAMS
-- =====================================================

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- =====================================================
-- 2. PROJECTS
-- =====================================================

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    optimization_goal VARCHAR(50) CHECK (optimization_goal IN ('ctr', 'cvr', 'roas')),
    target_audience JSONB DEFAULT '{}',
    unique_selling_points TEXT[],
    legal_authorization BOOLEAN DEFAULT FALSE,
    legal_authorization_details JSONB,
    stats JSONB DEFAULT '{"variants_count": 0, "total_views": 0, "total_clicks": 0}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Project platforms
CREATE TABLE IF NOT EXISTS project_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'facebook', 'youtube')),
    is_active BOOLEAN DEFAULT TRUE,
    platform_config JSONB DEFAULT '{}',
    video_specs JSONB DEFAULT '{
        "aspect_ratio": "9:16",
        "max_size_mb": 500,
        "max_duration_seconds": 60,
        "format": ["mp4", "mov"]
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, platform)
);

-- Project UTM configurations
CREATE TABLE IF NOT EXISTS project_utm_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content_template VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CONTENT POOLS & VARIANTS
-- =====================================================

-- Content pools
CREATE TABLE IF NOT EXISTS content_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    pool_type VARCHAR(50) NOT NULL CHECK (pool_type IN ('hook', 'cta', 'music', 'voiceover', 'subtitle_style')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content pool items
CREATE TABLE IF NOT EXISTS content_pool_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID REFERENCES content_pools(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    performance_score DECIMAL(5,2) CHECK (performance_score >= 0 AND performance_score <= 100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video variants
CREATE TABLE IF NOT EXISTS video_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    variant_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready', 'published', 'archived')),
    video_url TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER CHECK (duration_seconds > 0),
    file_size_bytes BIGINT CHECK (file_size_bytes > 0),
    utm_config JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{
        "views": 0,
        "clicks": 0,
        "conversions": 0,
        "revenue": 0
    }',
    ai_analysis JSONB,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Variant elements
CREATE TABLE IF NOT EXISTS variant_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES video_variants(id) ON DELETE CASCADE,
    element_type VARCHAR(50) NOT NULL,
    pool_item_id UUID REFERENCES content_pool_items(id),
    custom_content TEXT,
    position INTEGER,
    UNIQUE(variant_id, element_type, position)
);

-- =====================================================
-- 4. ASSETS
-- =====================================================

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('video', 'image', 'audio', 'font')),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    category VARCHAR(100),
    usage_rights VARCHAR(50) CHECK (usage_rights IN ('owned', 'licensed', 'ugc')),
    usage_rights_details JSONB,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Brand kits
CREATE TABLE IF NOT EXISTS brand_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    colors JSONB DEFAULT '[]',
    fonts JSONB DEFAULT '[]',
    logos JSONB DEFAULT '[]',
    guidelines TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand kit assets
CREATE TABLE IF NOT EXISTS brand_kit_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_kit_id UUID REFERENCES brand_kits(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    asset_role VARCHAR(50),
    UNIQUE(brand_kit_id, asset_id)
);

-- =====================================================
-- 5. EXPERIMENTS & METRICS
-- =====================================================

-- Experiments
CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    hypothesis TEXT,
    experiment_type VARCHAR(50) CHECK (experiment_type IN ('ab_test', 'multivariate')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
    traffic_allocation JSONB DEFAULT '{}',
    success_metrics JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    results JSONB,
    winner_variant_id UUID REFERENCES video_variants(id),
    confidence_level DECIMAL(5,2) CHECK (confidence_level >= 0 AND confidence_level <= 100),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experiment variants
CREATE TABLE IF NOT EXISTS experiment_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES video_variants(id) ON DELETE CASCADE,
    traffic_percentage DECIMAL(5,2) CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
    is_control BOOLEAN DEFAULT FALSE,
    UNIQUE(experiment_id, variant_id)
);

-- Variant metrics (partitioned by month)
CREATE TABLE IF NOT EXISTS variant_metrics (
    variant_id UUID REFERENCES video_variants(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    platform VARCHAR(50) NOT NULL,
    impressions INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    view_duration_avg DECIMAL(10,2),
    completion_rate DECIMAL(5,2),
    clicks INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    ctr DECIMAL(8,4),
    cvr DECIMAL(8,4),
    cpc DECIMAL(10,2),
    roas DECIMAL(10,2),
    PRIMARY KEY (variant_id, timestamp, platform)
) PARTITION BY RANGE (timestamp);

-- Create initial partitions
CREATE TABLE variant_metrics_2024_01 PARTITION OF variant_metrics
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE variant_metrics_2024_02 PARTITION OF variant_metrics
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE variant_metrics_2024_03 PARTITION OF variant_metrics
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- =====================================================
-- 6. TEMPLATES
-- =====================================================

-- Templates
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    thumbnail_url TEXT,
    template_config JSONB NOT NULL,
    usage_count INTEGER DEFAULT 0,
    avg_performance_score DECIMAL(5,2),
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. AUDIT & LOGGING
-- =====================================================

-- Audit logs (partitioned by month)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create initial partitions
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- =====================================================
-- INDEXES
-- =====================================================

-- Organization indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);

-- Project indexes
CREATE INDEX idx_projects_org_status ON projects(organization_id, status);
CREATE INDEX idx_projects_org_updated ON projects(organization_id, updated_at DESC);
CREATE INDEX idx_project_platforms_project ON project_platforms(project_id);

-- Content pool indexes
CREATE INDEX idx_content_pools_project_type ON content_pools(project_id, pool_type);
CREATE INDEX idx_pool_items_pool ON content_pool_items(pool_id);
CREATE INDEX idx_pool_items_performance ON content_pool_items(pool_id, performance_score DESC) WHERE is_active = TRUE;

-- Variant indexes
CREATE INDEX idx_variants_project_status ON video_variants(project_id, status);
CREATE INDEX idx_variants_project ON video_variants(project_id);
CREATE INDEX idx_variants_code ON video_variants(variant_code);
CREATE INDEX idx_variant_elements_variant ON variant_elements(variant_id);

-- Asset indexes
CREATE INDEX idx_assets_org_type ON assets(organization_id, asset_type);
CREATE INDEX idx_assets_project ON assets(project_id);
CREATE INDEX idx_assets_tags ON assets USING GIN(tags);

-- Experiment indexes
CREATE INDEX idx_experiments_project_status ON experiments(project_id, status);
CREATE INDEX idx_experiments_project ON experiments(project_id);
CREATE INDEX idx_experiment_variants_exp ON experiment_variants(experiment_id);

-- Template indexes
CREATE INDEX idx_templates_org_category ON templates(organization_id, category);
CREATE INDEX idx_templates_public ON templates(is_public) WHERE is_public = TRUE;

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_video_variants_updated_at
    BEFORE UPDATE ON video_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_brand_kits_updated_at
    BEFORE UPDATE ON brand_kits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Function to update project stats
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
DECLARE
    project_id_to_update UUID;
BEGIN
    -- Determine project_id based on operation
    IF TG_OP = 'DELETE' THEN
        project_id_to_update := OLD.project_id;
    ELSE
        project_id_to_update := NEW.project_id;
    END IF;
    
    -- Update project stats
    UPDATE projects
    SET stats = jsonb_build_object(
        'variants_count', (SELECT COUNT(*) FROM video_variants WHERE project_id = project_id_to_update),
        'total_views', (SELECT COALESCE(SUM((metrics->>'views')::int), 0) FROM video_variants WHERE project_id = project_id_to_update),
        'total_clicks', (SELECT COALESCE(SUM((metrics->>'clicks')::int), 0) FROM video_variants WHERE project_id = project_id_to_update)
    )
    WHERE id = project_id_to_update;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_variant_change
    AFTER INSERT OR UPDATE OR DELETE ON video_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_project_stats();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pool_item_id IS NOT NULL THEN
        UPDATE content_pool_items
        SET usage_count = usage_count + 1
        WHERE id = NEW.pool_item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_pool_item_usage
    AFTER INSERT ON variant_elements
    FOR EACH ROW
    EXECUTE FUNCTION increment_usage_count();

-- =====================================================
-- MATERIALIZED VIEWS
-- =====================================================

-- Project dashboard statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS project_dashboard_stats AS
SELECT 
    p.id as project_id,
    p.organization_id,
    p.name as project_name,
    p.status as project_status,
    COUNT(DISTINCT v.id) as total_variants,
    COUNT(DISTINCT CASE WHEN v.status = 'published' THEN v.id END) as published_variants,
    COALESCE(SUM((v.metrics->>'views')::int), 0) as total_views,
    COALESCE(SUM((v.metrics->>'clicks')::int), 0) as total_clicks,
    COALESCE(SUM((v.metrics->>'conversions')::int), 0) as total_conversions,
    COALESCE(SUM((v.metrics->>'revenue')::decimal), 0) as total_revenue,
    COALESCE(AVG(CASE WHEN (v.metrics->>'views')::int > 0 
        THEN ((v.metrics->>'clicks')::decimal / (v.metrics->>'views')::decimal) * 100 
        ELSE 0 END), 0) as avg_ctr,
    COALESCE(AVG(CASE WHEN (v.metrics->>'clicks')::int > 0 
        THEN ((v.metrics->>'conversions')::decimal / (v.metrics->>'clicks')::decimal) * 100 
        ELSE 0 END), 0) as avg_cvr,
    MAX(v.updated_at) as last_activity
FROM projects p
LEFT JOIN video_variants v ON p.id = v.project_id
GROUP BY p.id, p.organization_id, p.name, p.status;

CREATE INDEX idx_dashboard_stats_org ON project_dashboard_stats(organization_id);
CREATE INDEX idx_dashboard_stats_project ON project_dashboard_stats(project_id);

-- Top performing variants
CREATE MATERIALIZED VIEW IF NOT EXISTS top_performing_variants AS
SELECT 
    v.id as variant_id,
    v.project_id,
    v.variant_code,
    v.name as variant_name,
    p.organization_id,
    (v.metrics->>'views')::int as views,
    (v.metrics->>'clicks')::int as clicks,
    (v.metrics->>'conversions')::int as conversions,
    CASE WHEN (v.metrics->>'views')::int > 0 
        THEN ((v.metrics->>'clicks')::decimal / (v.metrics->>'views')::decimal) * 100 
        ELSE 0 END as ctr,
    CASE WHEN (v.metrics->>'clicks')::int > 0 
        THEN ((v.metrics->>'conversions')::decimal / (v.metrics->>'clicks')::decimal) * 100 
        ELSE 0 END as cvr,
    (v.metrics->>'revenue')::decimal as revenue
FROM video_variants v
JOIN projects p ON v.project_id = p.id
WHERE v.status = 'published';

CREATE INDEX idx_top_variants_org ON top_performing_variants(organization_id);
CREATE INDEX idx_top_variants_ctr ON top_performing_variants(ctr DESC);
CREATE INDEX idx_top_variants_cvr ON top_performing_variants(cvr DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_utm_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pool_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organization policies
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT
    USING (
        id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can update" ON organizations
    FOR UPDATE
    USING (
        id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Project policies
CREATE POLICY "Users can view projects in their organizations" ON projects
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Editors can create projects" ON projects
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'editor')
        )
    );

CREATE POLICY "Editors can update projects" ON projects
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'editor')
        )
    );

-- Video variant policies
CREATE POLICY "Users can view variants in their projects" ON video_variants
    FOR SELECT
    USING (
        project_id IN (
            SELECT p.id 
            FROM projects p
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
        )
    );

CREATE POLICY "Editors can manage variants" ON video_variants
    FOR ALL
    USING (
        project_id IN (
            SELECT p.id 
            FROM projects p
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('owner', 'admin', 'editor')
        )
    );

-- Asset policies
CREATE POLICY "Users can view assets in their organization" ON assets
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Editors can manage assets" ON assets
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'editor')
        )
    );

-- Audit log policies
CREATE POLICY "Users can view their organization's audit logs" ON audit_logs
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Public template policy
CREATE POLICY "Anyone can view public templates" ON templates
    FOR SELECT
    USING (is_public = TRUE);

CREATE POLICY "Users can view their organization's templates" ON templates
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to generate unique variant codes
CREATE OR REPLACE FUNCTION generate_variant_code(project_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    project_prefix VARCHAR;
    variant_count INTEGER;
    new_code VARCHAR;
BEGIN
    -- Get project prefix (first 3 letters of project name)
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 3))
    INTO project_prefix
    FROM projects
    WHERE id = project_id;
    
    -- Count existing variants
    SELECT COUNT(*) + 1
    INTO variant_count
    FROM video_variants
    WHERE video_variants.project_id = generate_variant_code.project_id;
    
    -- Generate code
    new_code := COALESCE(project_prefix, 'VAR') || '-' || LPAD(variant_count::text, 3, '0');
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate variant performance score
CREATE OR REPLACE FUNCTION calculate_performance_score(
    views INTEGER,
    clicks INTEGER,
    conversions INTEGER
) RETURNS DECIMAL AS $$
DECLARE
    ctr DECIMAL;
    cvr DECIMAL;
    score DECIMAL;
BEGIN
    -- Calculate CTR
    IF views > 0 THEN
        ctr := (clicks::DECIMAL / views::DECIMAL) * 100;
    ELSE
        ctr := 0;
    END IF;
    
    -- Calculate CVR
    IF clicks > 0 THEN
        cvr := (conversions::DECIMAL / clicks::DECIMAL) * 100;
    ELSE
        cvr := 0;
    END IF;
    
    -- Calculate weighted score (40% CTR, 60% CVR)
    score := (ctr * 0.4) + (cvr * 0.6);
    
    -- Normalize to 0-100 scale
    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default roles if needed
-- This would typically be handled by your application logic

-- =====================================================
-- GRANTS (for Supabase service role)
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (for public templates)
GRANT SELECT ON templates TO anon;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE organizations IS 'Core table for multi-tenant organizations';
COMMENT ON TABLE projects IS 'Video production projects with campaign details';
COMMENT ON TABLE video_variants IS 'Different versions of videos with unique content combinations';
COMMENT ON TABLE variant_metrics IS 'Time-series performance data for video variants';
COMMENT ON TABLE experiments IS 'A/B testing and multivariate testing experiments';
COMMENT ON TABLE assets IS 'Media assets including videos, images, and audio files';
COMMENT ON COLUMN projects.optimization_goal IS 'Primary KPI to optimize: CTR, CVR, or ROAS';
COMMENT ON COLUMN video_variants.variant_code IS 'Unique identifier like VAR-001 for tracking';
COMMENT ON COLUMN variant_metrics.roas IS 'Return on Ad Spend calculated as revenue/cost';