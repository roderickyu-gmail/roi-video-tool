"use client"
import { Button } from "@/components/ui/button"
import { Video, BarChart3, Settings, Plus } from "lucide-react"

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onCreateProject: () => void
}

export function Navigation({ activeTab, onTabChange, onCreateProject }: NavigationProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground font-[family-name:var(--font-work-sans)]">
                ROI Video Studio
              </h1>
              <p className="text-sm text-muted-foreground">Professional Video Production</p>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex items-center gap-2">
            <Button
              variant={activeTab === "projects" ? "default" : "ghost"}
              onClick={() => onTabChange("projects")}
              className="gap-2"
            >
              <Video className="w-4 h-4" />
              Projects
            </Button>
            <Button
              variant={activeTab === "analytics" ? "default" : "ghost"}
              onClick={() => onTabChange("analytics")}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Data Reports
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              onClick={() => onTabChange("settings")}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </nav>

          {/* Action Button */}
          <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={onCreateProject}>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>
    </header>
  )
}
