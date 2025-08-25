"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, X, Target, Globe, MessageSquare, Shield, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreateProject } from "@/hooks/use-create-project"
import { toast } from "sonner"

interface ProjectSetupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectSetupModal({ open, onOpenChange }: ProjectSetupModalProps) {
  const [currentTab, setCurrentTab] = useState("basic")
  const [isMobile, setIsMobile] = useState(false)
  const { createProject, isCreating } = useCreateProject()
  const firstInputRef = useRef<HTMLInputElement>(null)
  
  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (open && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platforms: [] as string[],
    goal: "",
    utmTemplate: {
      source: "",
      medium: "",
      campaign: "",
      content: "",
      term: "",
    },
    targetAudience: "",
    uniqueSellingPoints: "",
    hooks: [] as string[],
    ctas: [] as string[],
    languages: [] as string[],
    musicStyles: [] as string[],
    legalAuthorization: false,
  })

  const [newHook, setNewHook] = useState("")
  const [newCta, setNewCta] = useState("")

  const platforms = [
    { id: "tiktok", name: "TikTok", specs: "9:16, ≤500MB, H.264/H.265" },
    { id: "instagram", name: "Instagram Reels", specs: "9:16, ≤4GB, up to 15min" },
    { id: "facebook", name: "Facebook Reels", specs: "9:16, ≤4GB, up to 15min" },
    { id: "youtube", name: "YouTube Shorts", specs: "9:16, ≤15GB, up to 60s" },
  ]

  const goals = [
    { id: "ctr", name: "Click-Through Rate (CTR)", description: "Optimize for engagement and clicks" },
    { id: "cvr", name: "Conversion Rate (CVR)", description: "Optimize for purchases and sign-ups" },
    { id: "roas", name: "Return on Ad Spend (ROAS)", description: "Optimize for revenue and profitability" },
  ]

  const defaultHooks = [
    "Stop scrolling if you...",
    "This changed everything for me",
    "POV: You finally found...",
    "Nobody talks about this but...",
    "I wish I knew this sooner",
  ]

  const defaultCtas = [
    "Shop now",
    "Learn more",
    "Get yours today",
    "Try it free",
    "Limited time offer",
    "Swipe up to buy",
  ]

  const addToArray = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (value.trim() && !array.includes(value.trim())) {
      setter([...array, value.trim()])
    }
  }

  const removeFromArray = (array: string[], index: number, setter: (arr: string[]) => void) => {
    setter(array.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.name) {
        toast.error("Please enter a project name")
        setCurrentTab("basic")
        return
      }
      
      if (!formData.legalAuthorization) {
        toast.error("Please confirm content usage authorization")
        setCurrentTab("legal")
        return
      }
      
      // Get the first selected platform (single selection for now)
      const platform = formData.platforms[0] as 'tiktok' | 'reels' | 'shorts' || 'tiktok'
      
      // Prepare project data
      const projectData = {
        // Basic Info
        name: formData.name,
        description: formData.description,
        platform: platform,
        
        // Targeting
        testGoal: formData.goal,
        targetAudience: formData.audience,
        campaignObjective: formData.objective,
        
        // UTM Setup
        utmSource: formData.utmTemplate.source || platform,
        utmMedium: formData.utmTemplate.medium || 'video',
        utmCampaign: formData.utmTemplate.campaign,
        utmContent: formData.utmTemplate.content,
        landingPageUrl: formData.landingPage,
        trackingPixelId: formData.trackingPixel,
        
        // Content Pool
        hooks: formData.hooks,
        benefits: formData.benefits || [],
        ctas: formData.ctas,
        musicTracks: [],
        
        // Legal & Auth
        contentUsageAuthorization: formData.legalAuthorization,
        modelReleases: formData.modelReleases,
        musicLicensing: formData.musicLicensing,
        brandAssetRights: formData.brandAssets,
      }
      
      // Create the project
      await createProject(projectData)
      
      // Close modal on success (redirect happens in the hook)
      onOpenChange(false)
      
      // Reset form for next use
      setFormData({
        name: "",
        description: "",
        platforms: [],
        goal: "",
        audience: "",
        objective: "",
        landingPage: "",
        trackingPixel: "",
        utmTemplate: {
          source: "",
          medium: "video",
          campaign: "",
          content: "",
        },
        hooks: [],
        benefits: [],
        ctas: [],
        legalAuthorization: false,
        modelReleases: false,
        musicLicensing: false,
        brandAssets: false,
      })
      setCurrentTab("basic")
      
    } catch (error) {
      console.error("Failed to create project:", error)
      // Error toast is handled in the hook
    }
  }

  // Tab navigation helpers
  const tabs = ["basic", "targeting", "utm", "content", "legal"]
  const currentTabIndex = tabs.indexOf(currentTab)
  
  const goToPreviousTab = () => {
    if (currentTabIndex > 0) {
      setCurrentTab(tabs[currentTabIndex - 1])
    }
  }
  
  const goToNextTab = () => {
    if (currentTabIndex < tabs.length - 1) {
      setCurrentTab(tabs[currentTabIndex + 1])
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      
      // Ctrl/Cmd + Arrow for tab navigation
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPreviousTab()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault()
        goToNextTab()
      }
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && formData.name && formData.legalAuthorization) {
        e.preventDefault()
        handleSubmit()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, currentTab, formData.name, formData.legalAuthorization])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className={cn(
          "overflow-hidden p-0 gap-0 border-0",
          // Desktop: Large modal with some margin
          "sm:max-w-[95vw] sm:w-[95vw] sm:h-[90vh] sm:max-h-[90vh] sm:rounded-lg sm:border",
          // Mobile: Full screen
          "max-w-full w-full h-[100vh] max-h-[100vh] rounded-none",
          // Animation
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-bottom-[48%] data-[state=open]:slide-in-from-bottom-[48%]",
          "duration-500"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 sm:py-6 border-b bg-background">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-work-sans)] text-xl sm:text-2xl">Create New Project</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Set up your video production project with targeting, brand guidelines, and content variables.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full h-full">
              {/* Tab Navigation */}
              <div className="px-6 py-3 border-b bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                <TabsList className={cn(
                  "w-full justify-start h-auto p-1",
                  isMobile ? "flex overflow-x-auto" : "grid grid-cols-5"
                )}>
                  <TabsTrigger value="basic" className="whitespace-nowrap">Basic Info</TabsTrigger>
                  <TabsTrigger value="targeting" className="whitespace-nowrap">Targeting</TabsTrigger>
                  <TabsTrigger value="utm" className="whitespace-nowrap">UTM Setup</TabsTrigger>
                  <TabsTrigger value="content" className="whitespace-nowrap">Content Pool</TabsTrigger>
                  <TabsTrigger value="legal" className="whitespace-nowrap">Legal & Auth</TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Contents */}
              <div className="px-6 py-6">
                <TabsContent value="basic" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Project Details
                      </CardTitle>
                      <CardDescription>Basic information about your video production project</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Project Name</Label>
                          <Input
                            ref={firstInputRef}
                            id="name"
                            placeholder="e.g., Summer Collection Launch"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="h-12 text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="goal">Primary Goal</Label>
                          <Select value={formData.goal} onValueChange={(value) => setFormData({ ...formData, goal: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select optimization goal" />
                            </SelectTrigger>
                            <SelectContent>
                              {goals.map((goal) => (
                                <SelectItem key={goal.id} value={goal.id}>
                                  <div>
                                    <div className="font-medium">{goal.name}</div>
                                    <div className="text-sm text-muted-foreground">{goal.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Project Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Brief description of your campaign goals and target audience..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="min-h-[120px] text-base resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="targeting" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Platform & Audience
                      </CardTitle>
                      <CardDescription>Select platforms and define your target audience</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label>Target Platforms</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {platforms.map((platform) => (
                            <div
                              key={platform.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                formData.platforms.includes(platform.id)
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() => {
                                const newPlatforms = formData.platforms.includes(platform.id)
                                  ? formData.platforms.filter((p) => p !== platform.id)
                                  : [...formData.platforms, platform.id]
                                setFormData({ ...formData, platforms: newPlatforms })
                              }}
                            >
                              <div className="font-medium">{platform.name}</div>
                              <div className="text-sm text-muted-foreground">{platform.specs}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="audience">Target Audience</Label>
                          <Textarea
                            id="audience"
                            placeholder="e.g., Women 25-35, interested in sustainable fashion..."
                            value={formData.targetAudience}
                            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                            className="min-h-[100px] text-base resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="usp">Unique Selling Points</Label>
                          <Textarea
                            id="usp"
                            placeholder="e.g., Eco-friendly materials, 30-day return policy..."
                            value={formData.uniqueSellingPoints}
                            onChange={(e) => setFormData({ ...formData, uniqueSellingPoints: e.target.value })}
                            className="min-h-[100px] text-base resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="utm" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        UTM Template Configuration
                      </CardTitle>
                      <CardDescription>
                        Set up default UTM parameters for tracking campaign performance in GA4 and Shopify
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="utm-source">UTM Source</Label>
                          <Input
                            id="utm-source"
                            placeholder="e.g., tiktok, instagram"
                            className="h-12 text-base"
                            value={formData.utmTemplate.source}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                utmTemplate: { ...formData.utmTemplate, source: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="utm-medium">UTM Medium</Label>
                          <Input
                            id="utm-medium"
                            placeholder="e.g., video, social"
                            className="h-12 text-base"
                            value={formData.utmTemplate.medium}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                utmTemplate: { ...formData.utmTemplate, medium: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="utm-campaign">UTM Campaign</Label>
                          <Input
                            id="utm-campaign"
                            placeholder="e.g., summer-launch-2024"
                            className="h-12 text-base"
                            value={formData.utmTemplate.campaign}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                utmTemplate: { ...formData.utmTemplate, campaign: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="utm-content">UTM Content</Label>
                          <Input
                            id="utm-content"
                            placeholder="Will be auto-filled with variant ID"
                            className="h-12 text-base"
                            value={formData.utmTemplate.content}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                utmTemplate: { ...formData.utmTemplate, content: e.target.value },
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-2">Preview URL Structure:</h4>
                        <code className="text-sm text-muted-foreground">
                          https://yourstore.com?utm_source={formData.utmTemplate.source || "{source}"}&utm_medium=
                          {formData.utmTemplate.medium || "{medium}"}&utm_campaign=
                          {formData.utmTemplate.campaign || "{campaign}"}&utm_content={"{variant_id}"}
                        </code>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="content" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Content Variable Pool
                      </CardTitle>
                      <CardDescription>Define hooks, CTAs, and other variables for generating video variants</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Hooks Section */}
                      <div className="space-y-3">
                        <Label>Hook Variations</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a new hook..."
                            className="h-12 text-base"
                            value={newHook}
                            onChange={(e) => setNewHook(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                addToArray(formData.hooks, newHook, (hooks) => setFormData({ ...formData, hooks }))
                                setNewHook("")
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              addToArray(formData.hooks, newHook, (hooks) => setFormData({ ...formData, hooks }))
                              setNewHook("")
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {defaultHooks.map((hook, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary/10"
                              onClick={() => addToArray(formData.hooks, hook, (hooks) => setFormData({ ...formData, hooks }))}
                            >
                              {hook}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.hooks.map((hook, index) => (
                            <Badge key={index} className="gap-1">
                              {hook}
                              <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() =>
                                  removeFromArray(formData.hooks, index, (hooks) => setFormData({ ...formData, hooks }))
                                }
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* CTAs Section */}
                      <div className="space-y-3">
                        <Label>Call-to-Action Variations</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a new CTA..."
                            className="h-12 text-base"
                            value={newCta}
                            onChange={(e) => setNewCta(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                addToArray(formData.ctas, newCta, (ctas) => setFormData({ ...formData, ctas }))
                                setNewCta("")
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              addToArray(formData.ctas, newCta, (ctas) => setFormData({ ...formData, ctas }))
                              setNewCta("")
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {defaultCtas.map((cta, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary/10"
                              onClick={() => addToArray(formData.ctas, cta, (ctas) => setFormData({ ...formData, ctas }))}
                            >
                              {cta}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.ctas.map((cta, index) => (
                            <Badge key={index} className="gap-1">
                              {cta}
                              <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() =>
                                  removeFromArray(formData.ctas, index, (ctas) => setFormData({ ...formData, ctas }))
                                }
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="legal" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Legal Authorization
                      </CardTitle>
                      <CardDescription>Confirm content usage rights and compliance requirements</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="legal-auth"
                          checked={formData.legalAuthorization}
                          onCheckedChange={(checked) => setFormData({ ...formData, legalAuthorization: checked as boolean })}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor="legal-auth"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Content Usage Authorization
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            I confirm that I have obtained proper authorization to use all UGC content, including model
                            releases for identifiable persons and commercial usage rights for all assets that will be used in
                            this project's video advertisements.
                          </p>
                        </div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-2">Required Authorizations:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Content creator permission for commercial use</li>
                          <li>• Model releases for identifiable persons</li>
                          <li>• Music licensing for commercial usage</li>
                          <li>• Brand asset usage rights</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Footer with navigation */}
          <div className="px-6 py-4 border-t bg-background">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {!isMobile && currentTabIndex > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={goToPreviousTab}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-3 flex-1 justify-end">
                {/* Progress indicator */}
                <div className="hidden sm:flex items-center gap-1">
                  {tabs.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "h-1.5 w-8 rounded-full transition-colors",
                        index <= currentTabIndex ? "bg-primary" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                
                {currentTabIndex < tabs.length - 1 ? (
                  <Button onClick={goToNextTab} className="gap-1">
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!formData.name || !formData.legalAuthorization || isCreating}
                    className="min-w-[120px]"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Mobile navigation hint */}
            {isMobile && (
              <div className="mt-3 text-xs text-muted-foreground text-center">
                Swipe or tap tabs to navigate
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}