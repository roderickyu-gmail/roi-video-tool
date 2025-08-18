"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssetUpload } from "./asset-upload"
import { SubtitleEditor } from "./subtitle-editor"
import { BrandKitManager } from "./brand-kit-manager"
import { TemplateLibrary } from "./template-library"
import { VariantGenerator } from "./variant-generator"
import { ExperimentDashboard } from "./experiment-dashboard"
import { ExportManager } from "./export-manager"
import { UTMBuilder } from "./utm-builder"
import { Settings, Zap, BarChart3 } from "lucide-react"

interface ProjectWorkspaceProps {
  projectId: string
  projectName: string
}

export function ProjectWorkspace({ projectId, projectName }: ProjectWorkspaceProps) {
  const [showSubtitleEditor, setShowSubtitleEditor] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<string>("")

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">{projectName}</h1>
          <p className="text-muted-foreground">Project ID: {projectId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Project Settings
          </Button>
          <Button>
            <Zap className="w-4 h-4 mr-2" />
            Generate Variants
          </Button>
        </div>
      </div>

      {/* Main Workspace */}
      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="brand-kit">Brand Kit</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-6">
          <AssetUpload
            projectId={projectId}
            onAssetsChange={(assets) => {
              console.log("Assets updated:", assets)
            }}
          />
        </TabsContent>

        <TabsContent value="brand-kit" className="space-y-6">
          <BrandKitManager
            projectId={projectId}
            onBrandKitChange={(brandKit) => {
              console.log("Brand kit updated:", brandKit)
            }}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <TemplateLibrary
            onSelectTemplate={(template) => {
              console.log("Template selected:", template)
            }}
          />
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <VariantGenerator />
        </TabsContent>

        <TabsContent value="variants" className="space-y-6">
          <ExperimentDashboard />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <ExportManager />
          <UTMBuilder />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">Performance Analytics</CardTitle>
              <CardDescription>Track performance of your video variants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Advanced analytics dashboard coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Subtitle Editor Modal */}
      <SubtitleEditor
        open={showSubtitleEditor}
        onOpenChange={setShowSubtitleEditor}
        assetName={selectedAsset}
        initialSubtitles=""
      />
    </div>
  )
}
