import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract data from request
    const {
      // Basic Info
      name,
      description,
      platform,
      
      // Targeting
      testGoal,
      targetAudience,
      campaignObjective,
      
      // UTM Setup
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      landingPageUrl,
      trackingPixelId,
      
      // Content Pool
      hooks,
      benefits,
      ctas,
      musicTracks,
      
      // Legal & Auth
      contentUsageAuthorization,
      modelReleases,
      musicLicensing,
      brandAssetRights,
      
      // Organization
      organizationId,
      userId,
    } = body;

    // Start a transaction to create project and related data
    const { data: { user } } = await supabase.auth.getUser();
    
    // Ensure organization exists or create one
    let finalOrgId = organizationId;
    
    if (!finalOrgId) {
      // Check if user has any organizations
      const { data: userOrgs } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user?.id || userId)
        .limit(1);
      
      if (userOrgs && userOrgs.length > 0) {
        finalOrgId = userOrgs[0].organization_id;
      } else {
        // Create a new organization for the user
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: `${user?.email?.split('@')[0] || 'User'}'s Organization`,
            slug: `org-${Date.now()}`,
          })
          .select()
          .single();
        
        if (orgError) {
          console.error('Organization creation error:', orgError);
          return NextResponse.json(
            { error: 'Failed to create organization', details: orgError.message },
            { status: 500 }
          );
        }
        
        // Add user as owner of the new organization
        await supabase
          .from('organization_members')
          .insert({
            organization_id: newOrg.id,
            user_id: user?.id || userId,
            role: 'owner',
          });
        
        finalOrgId = newOrg.id;
      }
    }
    
    // 1. Create the main project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        organization_id: finalOrgId,
        name,
        description,
        platform,
        test_goal: testGoal,
        campaign_name: campaignObjective,
        utm_source: utmSource || platform,
        utm_medium: utmMedium || 'video',
        utm_campaign: utmCampaign,
        landing_page_url: landingPageUrl,
        tracking_pixel_id: trackingPixelId,
        status: 'draft',
        created_by: userId || user?.id,
        
        // Store additional config
        output_config: {
          format: 'MP4',
          codec: 'H.264',
          frame_rate: 30,
          aspect_ratio: '9:16',
          resolution: '1080x1920',
        },
      })
      .select()
      .single();

    if (projectError) {
      console.error('Project creation error:', projectError);
      return NextResponse.json(
        { error: 'Failed to create project', details: projectError.message },
        { status: 500 }
      );
    }

    // 2. Create project variables (content pool)
    const projectVariables = [];
    
    // Add hooks
    if (hooks && hooks.length > 0) {
      hooks.forEach((hook: string) => {
        projectVariables.push({
          project_id: project.id,
          variable_type: 'hook',
          name: `Hook ${projectVariables.filter(v => v.variable_type === 'hook').length + 1}`,
          content: hook,
        });
      });
    }
    
    // Add benefits
    if (benefits && benefits.length > 0) {
      benefits.forEach((benefit: string) => {
        projectVariables.push({
          project_id: project.id,
          variable_type: 'benefit',
          name: `Benefit ${projectVariables.filter(v => v.variable_type === 'benefit').length + 1}`,
          content: benefit,
        });
      });
    }
    
    // Add CTAs
    if (ctas && ctas.length > 0) {
      ctas.forEach((cta: string) => {
        projectVariables.push({
          project_id: project.id,
          variable_type: 'cta',
          name: `CTA ${projectVariables.filter(v => v.variable_type === 'cta').length + 1}`,
          content: cta,
        });
      });
    }
    
    // Add music tracks
    if (musicTracks && musicTracks.length > 0) {
      musicTracks.forEach((track: string) => {
        projectVariables.push({
          project_id: project.id,
          variable_type: 'music',
          name: `Music ${projectVariables.filter(v => v.variable_type === 'music').length + 1}`,
          content: track,
        });
      });
    }
    
    // Insert project variables if any
    if (projectVariables.length > 0) {
      const { error: variablesError } = await supabase
        .from('project_variables')
        .insert(projectVariables);
      
      if (variablesError) {
        console.error('Variables creation error:', variablesError);
        // Note: Project is already created, so we continue
      }
    }
    
    // 3. Create default brand kit
    const { data: brandKit, error: brandKitError } = await supabase
      .from('project_brandkits')
      .insert({
        project_id: project.id,
        // Default values - can be updated later
        primary_color: '#000000',
        secondary_color: '#FFFFFF',
        text_color: '#FFFFFF',
        font_family: 'Inter',
        font_weight: 500,
        subtitle_style: {
          background: 'semi-transparent',
          text_color: '#FFFFFF',
          outline_color: '#000000',
          outline_width: 2,
          position: 'bottom-center',
          margin_bottom: 100,
        },
        cta_style: {
          type: 'button',
          position: 'bottom-center',
          background_color: 'primary',
          text_color: '#FFFFFF',
          animation: 'pulse',
        },
      })
      .select()
      .single();
    
    if (brandKitError) {
      console.error('Brand kit creation error:', brandKitError);
      // Note: Project is already created, so we continue
    }
    
    // 4. Store legal/authorization metadata
    if (contentUsageAuthorization || modelReleases || musicLicensing || brandAssetRights) {
      // Store in project metadata or a separate legal_authorizations table
      // For now, we'll update the project with this info
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          metadata: {
            legal_authorizations: {
              content_usage: contentUsageAuthorization,
              model_releases: modelReleases,
              music_licensing: musicLicensing,
              brand_asset_rights: brandAssetRights,
            },
          },
        })
        .eq('id', project.id);
      
      if (updateError) {
        console.error('Legal metadata update error:', updateError);
      }
    }
    
    // Return success with project data
    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        platform: project.platform,
        status: project.status,
        brandKitId: brandKit?.id,
      },
      message: 'Project created successfully',
    });
    
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Get all projects for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      // Get user's organizations first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Get projects from all user's organizations
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_brandkits (
            id,
            logo_url,
            primary_color,
            secondary_color
          ),
          experiments (count),
          project_materials (count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return NextResponse.json({ projects });
    }
    
    // Get projects for specific organization
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_brandkits (
          id,
          logo_url,
          primary_color,
          secondary_color
        ),
        experiments (count),
        project_materials (count)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ projects });
    
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}