"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { DashboardOverview } from "@/components/dashboard-overview"
import { ProjectSetupModal } from "@/components/project-setup-modal"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("projects")
  const [showProjectSetup, setShowProjectSetup] = useState(false)

  const renderContent = () => {
    switch (activeTab) {
      case "projects":
        return <DashboardOverview onCreateProject={() => setShowProjectSetup(true)} />
      case "analytics":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-work-sans)] mb-4">
              Analytics Dashboard
            </h2>
            <p className="text-muted-foreground">Coming in the next milestone...</p>
          </div>
        )
      case "settings":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-work-sans)] mb-4">
              Team Settings
            </h2>
            <p className="text-muted-foreground">Coming in the next milestone...</p>
          </div>
        )
      default:
        return <DashboardOverview onCreateProject={() => setShowProjectSetup(true)} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} onCreateProject={() => setShowProjectSetup(true)} />
      <main className="container mx-auto px-6 py-8">{renderContent()}</main>

      <ProjectSetupModal open={showProjectSetup} onOpenChange={setShowProjectSetup} />
    </div>
  )
}
