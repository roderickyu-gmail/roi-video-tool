-- Create default organization and add current user to it
-- This is needed for testing when there's no organization setup yet

-- 1. Create a default organization
INSERT INTO organizations (id, name, slug) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default-org')
ON CONFLICT (id) DO NOTHING;

-- 2. Add the current user to the default organization
-- Note: This will only work if you're logged in
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current user ID from auth
    current_user_id := auth.uid();
    
    -- Only insert if we have a valid user ID
    IF current_user_id IS NOT NULL THEN
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES ('00000000-0000-0000-0000-000000000001', current_user_id, 'owner')
        ON CONFLICT (organization_id, user_id) DO NOTHING;
        
        RAISE NOTICE 'Added user % to default organization', current_user_id;
    ELSE
        RAISE NOTICE 'No authenticated user found. Please run this after logging in.';
    END IF;
END $$;

-- 3. Alternative: If you know your user ID, you can manually add it
-- Replace 'YOUR-USER-ID-HERE' with your actual Supabase auth user ID
/*
INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'YOUR-USER-ID-HERE', 'owner')
ON CONFLICT (organization_id, user_id) DO NOTHING;
*/

-- 4. Verify the setup
SELECT 
    o.id as org_id,
    o.name as org_name,
    o.slug,
    COUNT(om.id) as member_count
FROM organizations o
LEFT JOIN organization_members om ON o.id = om.organization_id
WHERE o.id = '00000000-0000-0000-0000-000000000001'
GROUP BY o.id, o.name, o.slug;