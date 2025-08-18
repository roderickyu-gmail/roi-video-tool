"use client"

import { useState } from "react"
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
import { Plus, X, Target, Globe, MessageSquare, Shield } from "lucide-react"

interface ProjectSetupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectSetupModal({ open, onOpenChange }: ProjectSetupModalProps) {
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

  const handleSubmit = () => {
    // Here you would typically save the project data
    console.log("Project data:", formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-work-sans)] text-xl">Create New Project</DialogTitle>
          <DialogDescription>
            Set up your video production project with targeting, brand guidelines, and content variables.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="targeting">Targeting</TabsTrigger>
            <TabsTrigger value="utm">UTM Setup</TabsTrigger>
            <TabsTrigger value="content">Content Pool</TabsTrigger>
            <TabsTrigger value="legal">Legal & Auth</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Project Details
                </CardTitle>
                <CardDescription>Basic information about your video production project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Summer Collection Launch"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="targeting" className="space-y-6">
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
                  <div className="grid grid-cols-2 gap-3">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="audience">Target Audience</Label>
                    <Textarea
                      id="audience"
                      placeholder="e.g., Women 25-35, interested in sustainable fashion..."
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usp">Unique Selling Points</Label>
                    <Textarea
                      id="usp"
                      placeholder="e.g., Eco-friendly materials, 30-day return policy..."
                      value={formData.uniqueSellingPoints}
                      onChange={(e) => setFormData({ ...formData, uniqueSellingPoints: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="utm" className="space-y-6">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="utm-source">UTM Source</Label>
                    <Input
                      id="utm-source"
                      placeholder="e.g., tiktok, instagram"
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

          <TabsContent value="content" className="space-y-6">
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

          <TabsContent value="legal" className="space-y-6">
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
        </Tabs>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name || !formData.legalAuthorization}>
            Create Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
