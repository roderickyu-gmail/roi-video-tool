-- ROI Video Tool Complete Database Schema
-- Created: 2025-01-24
-- Description: Complete schema including base tables and video tool tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PART 1: BASE TABLES (Organizations & Users)
-- =====================================================

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Organization members table
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- 3. User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PART 2: VIDEO TOOL CORE TABLES
-- =====================================================

-- 4. Platform configs table
CREATE TABLE IF NOT EXISTS platform_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL UNIQUE, -- tiktok, reels, shorts
    display_name VARCHAR(100) NOT NULL,
    
    -- Video specifications
    aspect_ratio VARCHAR(10) DEFAULT '9:16',
    max_duration_seconds INTEGER NOT NULL,
    recommended_duration_seconds INTEGER,
    video_format VARCHAR(20) DEFAULT 'MP4',
    video_codec VARCHAR(20) DEFAULT 'H.264',
    frame_rate INTEGER DEFAULT 30,
    gop_size INTEGER DEFAULT 15,
    chroma_subsampling VARCHAR(10) DEFAULT '4:2:0',
    
    -- Platform-specific constraints
    safe_zone_top_percent INTEGER DEFAULT 10,
    safe_zone_bottom_percent INTEGER DEFAULT 15,
    safe_zone_left_percent INTEGER DEFAULT 5,
    safe_zone_right_percent INTEGER DEFAULT 5,
    
    -- CTA guidelines
    cta_best_practices JSONB DEFAULT '{}',
    hook_duration_seconds INTEGER DEFAULT 3,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    platform VARCHAR(50) REFERENCES platform_configs(platform),
    
    -- Template structure
    structure_type VARCHAR(50) DEFAULT 'ABCD',
    duration_seconds INTEGER NOT NULL,
    
    -- Template configuration
    config JSONB NOT NULL DEFAULT '{
        "segments": [],
        "transitions": [],
        "text_overlays": [],
        "audio_tracks": []
    }',
    
    -- Metadata
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    platform VARCHAR(50) REFERENCES platform_configs(platform),
    template_id UUID REFERENCES templates(id),
    
    -- Testing configuration
    test_goal VARCHAR(100),
    campaign_name VARCHAR(255),
    
    -- Output settings
    output_config JSONB DEFAULT '{
        "format": "MP4",
        "codec": "H.264",
        "frame_rate": 30,
        "aspect_ratio": "9:16",
        "resolution": "1080x1920"
    }',
    
    -- UTM Parameters
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100) DEFAULT 'video',
    utm_campaign VARCHAR(200),
    
    -- URLs
    landing_page_url TEXT,
    tracking_pixel_id VARCHAR(255),
    
    status VARCHAR(50) DEFAULT 'draft',
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Project brand kits table
CREATE TABLE IF NOT EXISTS project_brandkits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Brand assets
    logo_url TEXT,
    logo_position VARCHAR(50) DEFAULT 'top-left',
    
    -- Colors
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    text_color VARCHAR(7) DEFAULT '#FFFFFF',
    
    -- Typography
    font_family VARCHAR(100) DEFAULT 'Inter',
    font_weight INTEGER DEFAULT 500,
    
    -- Subtitle/Caption styling
    subtitle_style JSONB DEFAULT '{
        "background": "semi-transparent",
        "text_color": "#FFFFFF",
        "outline_color": "#000000",
        "outline_width": 2,
        "position": "bottom-center",
        "margin_bottom": 100
    }',
    
    -- CTA styling
    cta_style JSONB DEFAULT '{
        "type": "button",
        "position": "bottom-center",
        "background_color": "primary",
        "text_color": "#FFFFFF",
        "animation": "pulse"
    }',
    
    -- Default CTA text
    default_cta_text VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(project_id)
);

-- 8. Project materials table
CREATE TABLE IF NOT EXISTS project_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Material info
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    
    -- File storage (R2)
    file_url TEXT NOT NULL,
    file_key TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    
    -- Video specific metadata
    duration_seconds NUMERIC(10,2),
    width INTEGER,
    height INTEGER,
    fps NUMERIC(5,2),
    codec VARCHAR(50),
    
    -- Thumbnail
    thumbnail_url TEXT,
    
    -- Processing status
    status VARCHAR(50) DEFAULT 'uploading',
    processing_error TEXT,
    
    -- Cloudinary integration
    cloudinary_public_id VARCHAR(255),
    cloudinary_url TEXT,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PART 3: EXPERIMENT & VARIANT TABLES (from existing design)
-- =====================================================

-- 9. Experiments table
CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    
    -- Single variable being tested
    test_variable_type VARCHAR(50) NOT NULL,
    
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Variants table
CREATE TABLE IF NOT EXISTS variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    
    -- UTM Parameters
    utm_content VARCHAR(200) NOT NULL,
    
    -- Video file information
    video_url TEXT,
    thumbnail_url TEXT,
    
    status VARCHAR(50) DEFAULT 'draft',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Project exports table
CREATE TABLE IF NOT EXISTS project_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES variants(id),
    
    -- Export configuration
    export_config JSONB NOT NULL,
    
    -- Output file
    output_url TEXT,
    output_key TEXT,
    file_size_bytes BIGINT,
    
    -- Export metadata
    duration_seconds NUMERIC(10,2),
    resolution VARCHAR(20),
    format VARCHAR(20),
    
    -- Processing
    status VARCHAR(50) DEFAULT 'queued',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- UTM tracking
    utm_content VARCHAR(200),
    full_tracking_url TEXT,
    
    exported_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Material segments table
CREATE TABLE IF NOT EXISTS material_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES project_materials(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Segment timing
    name VARCHAR(255),
    start_time NUMERIC(10,2) NOT NULL,
    end_time NUMERIC(10,2) NOT NULL,
    duration NUMERIC(10,2) GENERATED ALWAYS AS (end_time - start_time) STORED,
    
    -- Segment purpose
    segment_type VARCHAR(50),
    
    -- Cloudinary trimming parameters
    trim_params JSONB DEFAULT '{}',
    preview_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PART 4: INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_templates_platform ON templates(platform);
CREATE INDEX IF NOT EXISTS idx_templates_public ON templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_org ON templates(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_org_status ON projects(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_platform ON projects(platform);
CREATE INDEX IF NOT EXISTS idx_brandkits_project ON project_brandkits(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_project ON project_materials(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_type ON project_materials(project_id, type);
CREATE INDEX IF NOT EXISTS idx_materials_status ON project_materials(status);
CREATE INDEX IF NOT EXISTS idx_experiments_project ON experiments(project_id);
CREATE INDEX IF NOT EXISTS idx_variants_experiment ON variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_exports_project ON project_exports(project_id);
CREATE INDEX IF NOT EXISTS idx_exports_variant ON project_exports(variant_id);
CREATE INDEX IF NOT EXISTS idx_exports_status ON project_exports(status);
CREATE INDEX IF NOT EXISTS idx_segments_material ON material_segments(material_id);
CREATE INDEX IF NOT EXISTS idx_segments_project ON material_segments(project_id);

-- =====================================================
-- PART 5: HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 6: TRIGGERS
-- =====================================================

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_platform_configs_updated_at
    BEFORE UPDATE ON platform_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_brandkits_updated_at
    BEFORE UPDATE ON project_brandkits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_materials_updated_at
    BEFORE UPDATE ON project_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_experiments_updated_at
    BEFORE UPDATE ON experiments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_variants_updated_at
    BEFORE UPDATE ON variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- PART 7: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_brandkits ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_segments ENABLE ROW LEVEL SECURITY;

-- Organizations: users can see orgs they belong to
CREATE POLICY "org_member_access" ON organizations
    FOR ALL
    USING (
        id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Organization members: users can see members of their orgs
CREATE POLICY "org_members_view" ON organization_members
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- User profiles: users can see and update their own profile
CREATE POLICY "users_view_own_profile" ON user_profiles
    FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON user_profiles
    FOR UPDATE
    USING (id = auth.uid());

-- Platform configs: public read
CREATE POLICY "platform_configs_public_read" ON platform_configs
    FOR SELECT
    USING (true);

-- Templates: public or org access
CREATE POLICY "templates_access" ON templates
    FOR SELECT
    USING (
        is_public = true OR 
        created_by = auth.uid() OR 
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Projects: org member access
CREATE POLICY "projects_org_access" ON projects
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Brand kits: inherit from project
CREATE POLICY "brandkits_project_access" ON project_brandkits
    FOR ALL
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Materials: inherit from project
CREATE POLICY "materials_project_access" ON project_materials
    FOR ALL
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Experiments: inherit from project
CREATE POLICY "experiments_project_access" ON experiments
    FOR ALL
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Variants: inherit from experiment
CREATE POLICY "variants_experiment_access" ON variants
    FOR ALL
    USING (
        experiment_id IN (
            SELECT e.id FROM experiments e
            JOIN projects p ON e.project_id = p.id
            WHERE p.organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Exports: inherit from project
CREATE POLICY "exports_project_access" ON project_exports
    FOR ALL
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Segments: inherit from project
CREATE POLICY "segments_project_access" ON material_segments
    FOR ALL
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- =====================================================
-- PART 8: INITIAL DATA
-- =====================================================

-- Insert default platform configurations
INSERT INTO platform_configs (platform, display_name, max_duration_seconds, recommended_duration_seconds, cta_best_practices, hook_duration_seconds) 
VALUES
    ('tiktok', 'TikTok', 60, 15, '{"position": "bottom", "timing": "first_3_seconds", "style": "native_ugc"}', 3),
    ('reels', 'Instagram Reels', 90, 30, '{"position": "bottom", "timing": "throughout", "style": "branded"}', 3),
    ('shorts', 'YouTube Shorts', 180, 60, '{"position": "flexible", "timing": "first_6_seconds", "style": "clear_value"}', 6)
ON CONFLICT (platform) DO NOTHING;

-- Create a default organization for testing (optional)
-- Uncomment if you want to create test data
/*
INSERT INTO organizations (id, name, slug) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Organization', 'test-org')
ON CONFLICT DO NOTHING;

-- Add current user to test organization
INSERT INTO organization_members (organization_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000001', auth.uid(), 'owner'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;
*/

-- =====================================================
-- PART 9: HELPER VIEWS
-- =====================================================

-- Project overview view
CREATE OR REPLACE VIEW project_overview AS
SELECT 
    p.id,
    p.name,
    p.platform,
    p.status,
    p.organization_id,
    COUNT(DISTINCT e.id) as experiment_count,
    COUNT(DISTINCT v.id) as variant_count,
    COUNT(DISTINCT pm.id) as material_count,
    p.created_at,
    p.updated_at
FROM projects p
LEFT JOIN experiments e ON p.id = e.project_id
LEFT JOIN variants v ON e.id = v.experiment_id
LEFT JOIN project_materials pm ON p.id = pm.project_id
GROUP BY p.id;

-- Grant access to views
GRANT SELECT ON project_overview TO authenticated;

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully!';
END $$;