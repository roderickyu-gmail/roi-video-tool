#!/bin/bash

# ROI Video Tool - Supabase Setup Script
# This script helps initialize your Supabase project

set -e

echo "🚀 ROI Video Tool - Supabase Setup"
echo "=================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Please install it first:"
    echo "  brew install supabase/tap/supabase"
    echo "  or"
    echo "  npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Initialize Supabase project if not already initialized
if [ ! -f "supabase/config.toml" ]; then
    echo "📦 Initializing Supabase project..."
    supabase init
fi

# Function to prompt for input
prompt_for_input() {
    local prompt=$1
    local var_name=$2
    local default=$3
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        input=${input:-$default}
    else
        read -p "$prompt: " input
    fi
    
    eval "$var_name='$input'"
}

# Check for .env.local file
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    echo ""
    echo "Please provide your Supabase project details:"
    echo "(You can find these in your Supabase dashboard)"
    echo ""
    
    prompt_for_input "Supabase Project URL" SUPABASE_URL ""
    prompt_for_input "Supabase Anon Key" SUPABASE_ANON_KEY ""
    prompt_for_input "Supabase Service Role Key" SUPABASE_SERVICE_KEY ""
    
    cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# Database URL (for migrations)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
EOF
    
    echo "✅ .env.local file created"
else
    echo "✅ .env.local file already exists"
fi

echo ""
echo "🔄 Starting local Supabase instance..."
supabase start

echo ""
echo "📊 Running database migrations..."
echo ""

# Run migrations
supabase db push

echo ""
echo "🪣 Setting up storage buckets..."
echo ""

# Create storage buckets using Supabase CLI
supabase storage create public-assets --public
supabase storage create video-uploads
supabase storage create video-variants
supabase storage create thumbnails --public
supabase storage create brand-assets
supabase storage create templates

echo ""
echo "🔐 Configuring storage policies..."
echo ""

# Create storage policies
cat << 'EOF' | supabase db push
-- Storage policies for public-assets bucket
CREATE POLICY "Public read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'public-assets');

CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'public-assets' 
        AND auth.uid() IS NOT NULL
    );

-- Storage policies for video-uploads bucket
CREATE POLICY "Users can view their organization's uploads" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'video-uploads'
        AND auth.uid() IN (
            SELECT user_id FROM organization_members
            WHERE organization_id = (storage.foldername(name))[1]::uuid
        )
    );

CREATE POLICY "Editors can upload videos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'video-uploads'
        AND auth.uid() IN (
            SELECT user_id FROM organization_members
            WHERE organization_id = (storage.foldername(name))[1]::uuid
            AND role IN ('owner', 'admin', 'editor')
        )
    );

-- Storage policies for thumbnails bucket
CREATE POLICY "Public read access for thumbnails" ON storage.objects
    FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'thumbnails'
        AND auth.uid() IS NOT NULL
    );
EOF

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Visit your local Supabase dashboard: http://localhost:54323"
echo "  2. Default credentials:"
echo "     - Email: admin@example.com"
echo "     - Password: admin123"
echo ""
echo "  3. Run the development server:"
echo "     pnpm dev"
echo ""
echo "  4. To stop Supabase:"
echo "     supabase stop"
echo ""
echo "📚 Documentation:"
echo "  - Database design: supabase/DATABASE_DESIGN.md"
echo "  - Usage guide: supabase/USAGE_GUIDE.md"
echo ""
echo "Happy coding! 🚀"