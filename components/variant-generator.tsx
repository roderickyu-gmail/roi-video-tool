"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Play,
  Zap,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  Settings,
  BarChart3,
  Shuffle,
  Target,
} from "lucide-react"

interface Variant {
  id: string
  name: string
  hook: string
  cta: string
  template: string
  status: "generating" | "ready" | "error"
  progress: number
  thumbnail?: string
  duration: number
  utmParams: {
    source: string
    medium: string
    campaign: string
    content: string
  }
}

interface GenerationConfig {
  template: string
  testVariable: "hook" | "cta" | "music" | "subtitle-style"
  selectedHooks: string[]
  selectedCtas: string[]
  variantCount: number
  experimentName: string
}

export function VariantGenerator() {
  const [config, setConfig] = useState<GenerationConfig>({
    template: "",
    testVariable: "hook",
    selectedHooks: [],
    selectedCtas: [],
    variantCount: 15,
    experimentName: "",
  })

  const [variants, setVariants] = useState<Variant[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  // Mock data
  const availableTemplates = [
    { id: "template-1", name: "Product Showcase", category: "product-demo" },
    { id: "template-2", name: "Customer Testimonial", category: "testimonial" },
    { id: "template-3", name: "Flash Sale Alert", category: "announcement" },
  ]

  const availableHooks = [
    "Stop scrolling if you...",
    "This changed everything for me",
    "POV: You finally found...",
    "Nobody talks about this but...",
    "I wish I knew this sooner",
    "You're doing this wrong...",
    "The secret that brands don't want you to know",
    "Before vs After using this",
  ]

  const availableCtas = [
    "Shop now",
    "Learn more",
    "Get yours today",
    "Try it free",
    "Limited time offer",
    "Swipe up to buy",
    "Don't miss out",
    "Claim your discount",
  ]

  const generateVariants = async () => {
    if (!config.template || !config.experimentName) {
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    // Create variant combinations based on test variable
    const newVariants: Variant[] = []
    const baseTemplate = availableTemplates.find((t) => t.id === config.template)

    if (config.testVariable === "hook") {
      config.selectedHooks.forEach((hook, index) => {
        const variant: Variant = {
          id: `variant-${Date.now()}-${index}`,
          name: `Variant ${index + 1}: ${hook.substring(0, 20)}...`,
          hook,
          cta: config.selectedCtas[0] || "Shop now",
          template: baseTemplate?.name || "",
          status: "generating",
          progress: 0,
          duration: 15 + Math.floor(Math.random() * 10),
          utmParams: {
            source: "tiktok",
            medium: "video",
            campaign: config.experimentName.toLowerCase().replace(/\s+/g, "-"),
            content: `variant-${index + 1}`,
          },
        }
        newVariants.push(variant)
      })
    } else if (config.testVariable === "cta") {
      config.selectedCtas.forEach((cta, index) => {
        const variant: Variant = {
          id: `variant-${Date.now()}-${index}`,
          name: `Variant ${index + 1}: ${cta}`,
          hook: config.selectedHooks[0] || "Stop scrolling if you...",
          cta,
          template: baseTemplate?.name || "",
          status: "generating",
          progress: 0,
          duration: 15 + Math.floor(Math.random() * 10),
          utmParams: {
            source: "tiktok",
            medium: "video",
            campaign: config.experimentName.toLowerCase().replace(/\s+/g, "-"),
            content: `variant-${index + 1}`,
          },
        }
        newVariants.push(variant)
      })
    }

    setVariants(newVariants)

    // Simulate generation progress
    const totalVariants = newVariants.length
    let completed = 0

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + 5, 95))

      // Randomly complete variants
      if (Math.random() > 0.7 && completed < totalVariants) {
        const pendingVariants = newVariants.filter((v) => v.status === "generating")
        if (pendingVariants.length > 0) {
          const randomVariant = pendingVariants[Math.floor(Math.random() * pendingVariants.length)]
          randomVariant.status = "ready"
          randomVariant.progress = 100
          randomVariant.thumbnail = `/placeholder.svg?height=400&width=225&query=video-${randomVariant.id}`
          completed++
          setVariants([...newVariants])
        }
      }

      if (completed >= totalVariants) {
        setGenerationProgress(100)
        setIsGenerating(false)
        clearInterval(progressInterval)
      }
    }, 500)
  }

  const getVariableValidation = () => {
    if (config.testVariable === "hook" && config.selectedHooks.length < 2) {
      return "Select at least 2 hooks to test"
    }
    if (config.testVariable === "cta" && config.selectedCtas.length < 2) {
      return "Select at least 2 CTAs to test"
    }
    return null
  }

  const canGenerate = () => {
    return (
      config.template &&
      config.experimentName &&
      !getVariableValidation() &&
      ((config.testVariable === "hook" && config.selectedHooks.length >= 2) ||
        (config.testVariable === "cta" && config.selectedCtas.length >= 2))
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
            Generate Variants
          </h2>
          <p className="text-muted-foreground">Create multiple video variants for A/B testing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Advanced Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Experiment Setup
              </CardTitle>
              <CardDescription>Configure your A/B test parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Experiment Name</Label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-md"
                  placeholder="e.g., Hook Test - Summer Campaign"
                  value={config.experimentName}
                  onChange={(e) => setConfig({ ...config, experimentName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={config.template} onValueChange={(value) => setConfig({ ...config, template: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Test Variable (Only One)</Label>
                <Select
                  value={config.testVariable}
                  onValueChange={(value: any) => setConfig({ ...config, testVariable: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hook">Hook Variations</SelectItem>
                    <SelectItem value="cta">CTA Variations</SelectItem>
                    <SelectItem value="music">Music Style</SelectItem>
                    <SelectItem value="subtitle-style">Subtitle Style</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Best practice: Test only one variable at a time for clear results. Other elements will remain
                  consistent across all variants.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variable Selection</CardTitle>
              <CardDescription>Choose the variations to test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.testVariable === "hook" && (
                <div className="space-y-3">
                  <Label>Select Hooks to Test ({config.selectedHooks.length} selected)</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableHooks.map((hook) => (
                      <div key={hook} className="flex items-center space-x-2">
                        <Checkbox
                          id={hook}
                          checked={config.selectedHooks.includes(hook)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setConfig({
                                ...config,
                                selectedHooks: [...config.selectedHooks, hook],
                              })
                            } else {
                              setConfig({
                                ...config,
                                selectedHooks: config.selectedHooks.filter((h) => h !== hook),
                              })
                            }
                          }}
                        />
                        <Label htmlFor={hook} className="text-sm">
                          {hook}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {config.testVariable === "cta" && (
                <div className="space-y-3">
                  <Label>Select CTAs to Test ({config.selectedCtas.length} selected)</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableCtas.map((cta) => (
                      <div key={cta} className="flex items-center space-x-2">
                        <Checkbox
                          id={cta}
                          checked={config.selectedCtas.includes(cta)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setConfig({
                                ...config,
                                selectedCtas: [...config.selectedCtas, cta],
                              })
                            } else {
                              setConfig({
                                ...config,
                                selectedCtas: config.selectedCtas.filter((c) => c !== cta),
                              })
                            }
                          }}
                        />
                        <Label htmlFor={cta} className="text-sm">
                          {cta}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getVariableValidation() && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{getVariableValidation()}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Button className="w-full" onClick={generateVariants} disabled={!canGenerate() || isGenerating} size="lg">
            <Zap className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Variants"}
          </Button>
        </div>

        {/* Generation Progress & Results */}
        <div className="lg:col-span-2 space-y-6">
          {isGenerating && (
            <Card>
              <CardHeader>
                <CardTitle>Generation Progress</CardTitle>
                <CardDescription>Creating your video variants...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={generationProgress} className="w-full" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {variants.filter((v) => v.status === "ready").length} of {variants.length} variants completed
                    </span>
                    <span className="font-medium">{generationProgress}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {variants.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated Variants</CardTitle>
                    <CardDescription>
                      {variants.filter((v) => v.status === "ready").length} variants ready for testing
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview All
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="border border-border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors"
                    >
                      {/* Variant Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground">{variant.name}</h3>
                        <Badge
                          variant={
                            variant.status === "ready"
                              ? "default"
                              : variant.status === "generating"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {variant.status}
                        </Badge>
                      </div>

                      {/* Variant Preview */}
                      <div className="aspect-[9/16] max-w-[120px] bg-muted rounded-lg overflow-hidden">
                        {variant.thumbnail ? (
                          <img
                            src={variant.thumbnail || "/placeholder.svg"}
                            alt={variant.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {variant.status === "generating" ? (
                              <div className="text-center">
                                <Shuffle className="w-6 h-6 text-muted-foreground mx-auto mb-2 animate-spin" />
                                <Progress value={variant.progress} className="w-16" />
                              </div>
                            ) : (
                              <Play className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Variant Details */}
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Hook: </span>
                          <span className="font-medium">{variant.hook.substring(0, 30)}...</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">CTA: </span>
                          <span className="font-medium">{variant.cta}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration: </span>
                          <span className="font-medium">{variant.duration}s</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">UTM: </span>
                          <span className="font-mono text-xs">{variant.utmParams.content}</span>
                        </div>
                      </div>

                      {/* Variant Actions */}
                      {variant.status === "ready" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {variants.length > 0 && variants.every((v) => v.status === "ready") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-chart-2" />
                  Generation Complete
                </CardTitle>
                <CardDescription>Your variants are ready for A/B testing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{variants.length}</p>
                      <p className="text-sm text-muted-foreground">Variants Created</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {Math.round(variants.reduce((acc, v) => acc + v.duration, 0) / variants.length)}s
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Duration</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">1</p>
                      <p className="text-sm text-muted-foreground">Variable Tested</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Start A/B Test
                    </Button>
                    <Button variant="outline" className="flex-1 bg-transparent">
                      <Download className="w-4 h-4 mr-2" />
                      Export All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {variants.length === 0 && !isGenerating && (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Generate</h3>
                <p className="text-muted-foreground">
                  Configure your experiment settings and click "Generate Variants" to create your A/B test videos.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
