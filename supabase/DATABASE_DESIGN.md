# ROI Video Tool Database Design - MVP

## Design Philosophy

### Core Principles
1. **Simplicity First**: Minimal viable schema focused on core functionality
2. **Fast Iteration**: Structure that supports rapid feature development 
3. **UTM-Driven Attribution**: UTM parameters as primary tracking method
4. **Basic Analytics**: Integration with GA4/Shopify for metrics
5. **Single Variable Testing**: Focus on simple A/B testing for MVP

## MVP Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User & Organization                     │
├─────────────────────────────────────────────────────────────┤
│  organizations ──── organization_members ── users(auth)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Projects                             │
├─────────────────────────────────────────────────────────────┤
│  projects ──── project_variables (content pools)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Experiments & Variants                 │
├─────────────────────────────────────────────────────────────┤
│  experiments ──── variants ──── variant_metrics             │
└─────────────────────────────────────────────────────────────┘
```

## Core MVP Tables

### 1. User & Organization Management

#### organizations (Organization Table)
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**Purpose**: Basic multi-tenant structure for MVP

#### organization_members (Organization Members)
```sql
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, member
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);
```
**Purpose**: Simple role-based access (owner/member only for MVP)

### 2. Project Management

#### projects (Projects Table)
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, archived
    
    -- UTM Configuration for all variants in this project
    utm_source VARCHAR(100), -- e.g., "tiktok", "facebook"
    utm_medium VARCHAR(100) DEFAULT 'video', -- e.g., "video", "social"
    utm_campaign VARCHAR(200), -- Project-level campaign name
    
    -- Target configuration
    base_url TEXT, -- Optional: landing page URL (e.g., product page)
    platform_profile_url TEXT, -- Optional: social profile URL (e.g., TikTok profile)
    tracking_method VARCHAR(50) DEFAULT 'platform', -- 'utm' (with landing page), 'platform' (native analytics)
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_org_status ON projects(organization_id, status);
```
**Purpose**: Simplified project structure with flexible tracking options

**Tracking Methods Explained**:
- **With Landing Page (`tracking_method = 'utm'`)**: Full funnel tracking via UTM parameters
  - User has their own website/landing page
  - Video → Landing Page → GA4/Shopify tracking
  - Can measure: CTR, page views, conversions, revenue
  
- **Without Landing Page (`tracking_method = 'platform'`)**: Platform-native metrics only
  - User only has social media profiles
  - Video → Platform profile/shop
  - Can measure: Views, engagement, platform conversions
  - Data imported from TikTok Ads Manager / Meta Business Suite

#### project_variables (Content Variables for Testing)
```sql
CREATE TABLE project_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    variable_type VARCHAR(50) NOT NULL, -- hook, cta, music, voiceover
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- The actual content/script/URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_project_variables_type ON project_variables(project_id, variable_type);
```
**Purpose**: Simplified content pools - just variables that can be swapped in/out for testing

### 3. Experiments & Variants

#### experiments (Experiments Table)
```sql
CREATE TABLE experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, running, completed, paused
    
    -- Single variable being tested
    test_variable_type VARCHAR(50) NOT NULL, -- hook, cta, music, voiceover
    
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_experiments_project_status ON experiments(project_id, status);
```
**Purpose**: Simple A/B testing focused on one variable at a time

#### variants (Video Variants Table)
```sql
CREATE TABLE variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    
    -- UTM Parameters (inherits from project + unique content identifier)
    utm_content VARCHAR(200) NOT NULL, -- Unique identifier for this variant
    
    -- Variable being tested (references project_variables)
    test_variable_id UUID REFERENCES project_variables(id),
    
    -- Video file information
    video_url TEXT,
    thumbnail_url TEXT,
    
    status VARCHAR(50) DEFAULT 'draft', -- draft, ready, published, archived
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_variants_experiment ON variants(experiment_id);
CREATE INDEX idx_variants_status ON variants(experiment_id, status);
```
**Purpose**: Simplified variants that test one variable from project_variables pool

### 4. Analytics & Metrics

#### variant_metrics (Basic Metrics from External Sources)
```sql
CREATE TABLE variant_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES variants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    source VARCHAR(50) NOT NULL, -- ga4, shopify, tiktok_ads, meta_ads, manual
    
    -- Platform metrics (always available)
    impressions INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2), -- likes, shares, comments as %
    platform_clicks INTEGER DEFAULT 0, -- clicks within platform
    
    -- Landing page metrics (when base_url exists)
    outbound_clicks INTEGER DEFAULT 0, -- clicks to landing page
    sessions INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2),
    
    -- Conversion metrics (from GA4/Shopify or platform shops)
    add_to_carts INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    
    -- Calculated metrics
    ctr DECIMAL(8,4), -- (outbound_clicks or platform_clicks) / impressions
    cvr DECIMAL(8,4), -- conversions / clicks
    roas DECIMAL(10,2), -- revenue / ad_spend
    
    -- Cost data (manual entry for MVP)
    ad_spend DECIMAL(10,2) DEFAULT 0,
    
    -- UTM attribution data (when available)
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(200),
    utm_content VARCHAR(200),
    
    -- Import metadata
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_data JSONB, -- Store original API response for debugging
    
    UNIQUE(variant_id, date, source)
);

CREATE INDEX idx_metrics_variant_date ON variant_metrics(variant_id, date DESC);
CREATE INDEX idx_metrics_utm ON variant_metrics(utm_source, utm_medium, utm_campaign, utm_content);
```
**Purpose**: Flexible metrics storage supporting both landing page and platform-only scenarios

**Data Collection Strategies**:

1. **Users WITH Landing Pages**: 
   - Full funnel tracking: Impressions → Clicks → Sessions → Conversions
   - Data sources: Platform Ads API + GA4 + Shopify
   - UTM parameters enable precise attribution

2. **Users WITHOUT Landing Pages**:
   - Platform-native tracking only
   - Data sources: TikTok Ads Manager, Meta Business Suite
   - Track: Views, engagement, platform shop conversions
   - Alternative: Use platform's native shopping features (TikTok Shop, Instagram Shopping)

3. **Hybrid Approach**:
   - Start with platform metrics only
   - Add landing page tracking when available
   - Compare performance across both methods

## Essential Indexes for MVP

```sql
-- Core query patterns for MVP
CREATE INDEX idx_projects_org_updated ON projects(organization_id, updated_at DESC);
CREATE INDEX idx_experiments_project ON experiments(project_id, status);
CREATE INDEX idx_variants_experiment ON variants(experiment_id);
CREATE INDEX idx_metrics_variant_date ON variant_metrics(variant_id, date DESC);
CREATE INDEX idx_project_vars_type ON project_variables(project_id, variable_type);
```

## Simple Dashboard View

```sql
-- Basic project metrics view
CREATE VIEW project_metrics AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.organization_id,
    COUNT(DISTINCT e.id) as experiment_count,
    COUNT(DISTINCT v.id) as variant_count,
    COALESCE(SUM(vm.clicks), 0) as total_clicks,
    COALESCE(SUM(vm.conversions), 0) as total_conversions,
    COALESCE(SUM(vm.revenue), 0) as total_revenue,
    MAX(vm.date) as last_metric_date
FROM projects p
LEFT JOIN experiments e ON p.id = e.project_id
LEFT JOIN variants v ON e.id = v.experiment_id  
LEFT JOIN variant_metrics vm ON v.id = vm.variant_id
GROUP BY p.id, p.name, p.organization_id;
```

## Basic RLS Policies for MVP

```sql
-- Enable RLS on core tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;

-- Organization access
CREATE POLICY "org_member_access" ON organizations
    FOR ALL
    USING (
        id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Project access (inherit from organization membership)
CREATE POLICY "project_org_access" ON projects
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Experiments inherit from project access
CREATE POLICY "experiment_access" ON experiments
    FOR ALL
    USING (
        project_id IN (
            SELECT p.id 
            FROM projects p
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
        )
    );

-- Variants inherit from experiment access
CREATE POLICY "variant_access" ON variants
    FOR ALL
    USING (
        experiment_id IN (
            SELECT e.id 
            FROM experiments e
            JOIN projects p ON e.project_id = p.id
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
        )
    );
```

## Basic Triggers for MVP

```sql
-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to main tables
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
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
```

## MVP Migration Script

```sql
-- Create MVP database schema
-- Run this script to set up the simplified MVP database

-- 1. Create core tables
\i create_organizations.sql
\i create_projects.sql  
\i create_experiments.sql
\i create_variants.sql
\i create_metrics.sql

-- 2. Create indexes
\i create_indexes.sql

-- 3. Enable RLS and create policies
\i create_rls_policies.sql

-- 4. Create triggers
\i create_triggers.sql

-- 5. Create views
\i create_views.sql
```

## Key Simplifications from Original Design

### Removed for MVP:
- **Templates library**: Focus on direct content input
- **Asset management**: Use external file storage directly
- **Audit logs**: Basic logging through application layer
- **Complex role system**: Just owner/member roles
- **Brand kits**: Store branding in project settings if needed
- **Advanced analytics**: Focus on UTM + GA4/Shopify integration
- **Content pool items**: Simplified to project variables
- **Variant elements**: Simplified to single test variable per experiment

### MVP Workflow:
1. **Create Project** with UTM configuration and base URL
2. **Add Variables** (hooks, CTAs, etc.) to test  
3. **Create Experiment** testing one variable type
4. **Generate Variants** using different variables
5. **Track Performance** via UTM parameters in GA4/Shopify
6. **Import Metrics** daily from external analytics
7. **Compare Results** in simple dashboard

## Practical Examples

### Example 1: User WITH Landing Page (Shopify Store)
```sql
-- Project setup
INSERT INTO projects (organization_id, name, utm_source, utm_medium, utm_campaign, base_url, tracking_method)
VALUES (
    'org-123',
    'Summer Sale Campaign',
    'tiktok',
    'video',
    'summer-sale-2024',
    'https://mystore.com/products/summer-dress',
    'utm'
);

-- Metrics collection
-- From TikTok Ads: impressions, views, platform_clicks
-- From GA4: sessions, page_views, bounce_rate (filtered by UTM)
-- From Shopify: conversions, revenue (matched by UTM)
```

### Example 2: User WITHOUT Landing Page (TikTok Profile Only)
```sql
-- Project setup
INSERT INTO projects (organization_id, name, utm_source, platform_profile_url, tracking_method)
VALUES (
    'org-456',
    'Brand Awareness Campaign',
    'tiktok',
    'https://www.tiktok.com/@mybrand',
    'platform'
);

-- Metrics collection
-- From TikTok Ads Manager only:
-- impressions, views, engagement_rate, profile_visits
-- platform shop conversions (if using TikTok Shop)
```

### Example 3: Calculating CTR for Different Scenarios
```sql
-- With landing page: CTR = outbound_clicks / impressions
UPDATE variant_metrics 
SET ctr = CASE 
    WHEN impressions > 0 THEN outbound_clicks::decimal / impressions 
    ELSE 0 
END
WHERE source = 'ga4';

-- Without landing page: CTR = platform_clicks / impressions
UPDATE variant_metrics 
SET ctr = CASE 
    WHEN impressions > 0 THEN platform_clicks::decimal / impressions 
    ELSE 0 
END
WHERE source = 'tiktok_ads';
```

### Future Expansion Path:
- Add asset management when file handling becomes complex
- Add templates when users request reusable configurations  
- Add advanced analytics when UTM tracking proves insufficient
- Add audit logging when compliance becomes necessary
- Add complex roles when team management needs grow
- Add multi-variable testing when single variable testing is mastered