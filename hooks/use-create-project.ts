import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export interface ProjectData {
  // Basic Info
  name: string;
  description?: string;
  platform: 'tiktok' | 'reels' | 'shorts';
  
  // Targeting
  testGoal?: string;
  targetAudience?: string;
  campaignObjective?: string;
  
  // UTM Setup
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  landingPageUrl?: string;
  trackingPixelId?: string;
  
  // Content Pool
  hooks?: string[];
  benefits?: string[];
  ctas?: string[];
  musicTracks?: string[];
  
  // Legal & Auth
  contentUsageAuthorization?: boolean;
  modelReleases?: boolean;
  musicLicensing?: boolean;
  brandAssetRights?: boolean;
  
  // Organization
  organizationId?: string;
}

export function useCreateProject() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const createProject = async (projectData: ProjectData) => {
    setIsCreating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create project');
      }
      
      if (result.success) {
        toast.success('Project created successfully!');
        
        // Redirect to the new project page
        router.push(`/project/${result.project.id}`);
        
        return result.project;
      } else {
        throw new Error(result.error || 'Project creation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };
  
  return {
    createProject,
    isCreating,
    error,
  };
}