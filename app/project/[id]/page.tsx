"use client"

import { ProjectWorkspace } from "@/components/project-workspace"

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  // In a real app, you'd fetch project data based on the ID
  const projectName = "Summer Collection Launch"

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <ProjectWorkspace projectId={params.id} projectName={projectName} />
      </div>
    </div>
  )
}
