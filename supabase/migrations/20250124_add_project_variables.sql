-- Add project_variables table for content pool management
-- This table stores hooks, benefits, CTAs, music tracks, etc.

CREATE TABLE IF NOT EXISTS project_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Variable information
    variable_type VARCHAR(50) NOT NULL, -- hook, benefit, cta, music, voiceover, text_overlay
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- The actual content/script/URL
    
    -- Optional metadata
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_variables_project ON project_variables(project_id);
CREATE INDEX IF NOT EXISTS idx_project_variables_type ON project_variables(project_id, variable_type);
CREATE INDEX IF NOT EXISTS idx_project_variables_active ON project_variables(project_id, is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_project_variables_updated_at
    BEFORE UPDATE ON project_variables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE project_variables ENABLE ROW LEVEL SECURITY;

-- RLS Policy: inherit from project access
CREATE POLICY "project_variables_access" ON project_variables
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

-- Also add metadata column to projects table if not exists
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';