"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Download, ExternalLink, FileText, Link, CheckCircle, Copy, Settings, BarChart3, Globe } from "lucide-react"

interface ExportVariant {
  id: string
  name: string
  hook: string
  cta: string
  duration: number
  platform: string[]
  selected: boolean
  utmParams: {
    source: string
    medium: string
    campaign: string
    content: string
    term?: string
  }
  trackingUrl: string
  exportFormats: {
    mp4: boolean
    mov: boolean
    webm: boolean
  }
}

interface ExportConfig {
  baseUrl: string
  utmTemplate: {
    source: string
    medium: string
    campaign: string
    term: string
  }
  platforms: string[]
  formats: string[]
  includeSubtitles: boolean
  includeThumbnails: boolean
  exportType: "individual" | "batch" | "csv-only"
}

export function ExportManager() {
  const [variants, setVariants] = useState<ExportVariant[]>([
    {
      id: "var-1",
      name: "Variant 1: Stop scrolling if you...",
      hook: "Stop scrolling if you...",
      cta: "Shop now",
      duration: 15,
      platform: ["tiktok", "instagram"],
      selected: true,
      utmParams: {
        source: "tiktok",
        medium: "video",
        campaign: "summer-launch-2024",
        content: "variant-1",
      },
      trackingUrl: "",
      exportFormats: { mp4: true, mov: false, webm: false },
    },
    {
      id: "var-2",
      name: "Variant 2: This changed everything...",
      hook: "This changed everything for me",
      cta: "Shop now",
      duration: 18,
      platform: ["tiktok", "instagram"],
      selected: true,
      utmParams: {
        source: "tiktok",
        medium: "video",
        campaign: "summer-launch-2024",
        content: "variant-2",
      },
      trackingUrl: "",
      exportFormats: { mp4: true, mov: false, webm: false },
    },
    {
      id: "var-3",
      name: "Variant 3: POV: You finally found...",
      hook: "POV: You finally found...",
      cta: "Shop now",
      duration: 20,
      platform: ["tiktok", "instagram"],
      selected: false,
      utmParams: {
        source: "tiktok",
        medium: "video",
        campaign: "summer-launch-2024",
        content: "variant-3",
      },
      trackingUrl: "",
      exportFormats: { mp4: true, mov: false, webm: false },
    },
  ])

  const [config, setConfig] = useState<ExportConfig>({
    baseUrl: "https://yourstore.com",
    utmTemplate: {
      source: "tiktok",
      medium: "video",
      campaign: "summer-launch-2024",
      term: "",
    },
    platforms: ["tiktok", "instagram"],
    formats: ["mp4"],
    includeSubtitles: true,
    includeThumbnails: true,
    exportType: "batch",
  })

  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportComplete, setExportComplete] = useState(false)

  const generateTrackingUrl = (variant: ExportVariant) => {
    const params = new URLSearchParams({
      utm_source: variant.utmParams.source,
      utm_medium: variant.utmParams.medium,
      utm_campaign: variant.utmParams.campaign,
      utm_content: variant.utmParams.content,
      ...(variant.utmParams.term && { utm_term: variant.utmParams.term }),
    })

    return `${config.baseUrl}?${params.toString()}`
  }

  const updateVariantSelection = (variantId: string, selected: boolean) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              selected,
              trackingUrl: selected ? generateTrackingUrl(variant) : "",
            }
          : variant,
      ),
    )
  }

  const updateVariantUTM = (variantId: string, utmParams: Partial<ExportVariant["utmParams"]>) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id === variantId) {
          const updatedVariant = {
            ...variant,
            utmParams: { ...variant.utmParams, ...utmParams },
          }
          return {
            ...updatedVariant,
            trackingUrl: generateTrackingUrl(updatedVariant),
          }
        }
        return variant
      }),
    )
  }

  const selectAllVariants = (selected: boolean) => {
    setVariants((prev) =>
      prev.map((variant) => ({
        ...variant,
        selected,
        trackingUrl: selected ? generateTrackingUrl(variant) : "",
      })),
    )
  }

  const exportVariants = async () => {
    setIsExporting(true)
    setExportProgress(0)

    // Simulate export process
    const selectedVariants = variants.filter((v) => v.selected)
    const totalSteps = selectedVariants.length * 2 // Video + metadata

    let completed = 0
    const interval = setInterval(() => {
      completed++
      setExportProgress((completed / totalSteps) * 100)

      if (completed >= totalSteps) {
        setIsExporting(false)
        setExportComplete(true)
        clearInterval(interval)
      }
    }, 500)
  }

  const generateCSV = () => {
    const selectedVariants = variants.filter((v) => v.selected)
    const csvContent = [
      [
        "Variant ID",
        "Name",
        "Hook",
        "CTA",
        "Duration",
        "Platform",
        "UTM Source",
        "UTM Medium",
        "UTM Campaign",
        "UTM Content",
        "Tracking URL",
      ].join(","),
      ...selectedVariants.map((variant) =>
        [
          variant.id,
          `"${variant.name}"`,
          `"${variant.hook}"`,
          `"${variant.cta}"`,
          variant.duration,
          variant.platform.join(";"),
          variant.utmParams.source,
          variant.utmParams.medium,
          variant.utmParams.campaign,
          variant.utmParams.content,
          `"${variant.trackingUrl}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `variants-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyTrackingUrl = (url: string) => {
    navigator.clipboard.writeText(url)
  }

  const selectedCount = variants.filter((v) => v.selected).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
            Export & Tracking
          </h2>
          <p className="text-muted-foreground">Export variants with UTM tracking for performance analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateCSV} disabled={selectedCount === 0}>
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={exportVariants} disabled={selectedCount === 0 || isExporting}>
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export Selected"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Export Settings
              </CardTitle>
              <CardDescription>Configure export parameters and UTM tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                  placeholder="https://yourstore.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Default UTM Source</Label>
                <Select
                  value={config.utmTemplate.source}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      utmTemplate: { ...config.utmTemplate, source: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  value={config.utmTemplate.campaign}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      utmTemplate: { ...config.utmTemplate, campaign: e.target.value },
                    })
                  }
                  placeholder="summer-launch-2024"
                />
              </div>

              <div className="space-y-3">
                <Label>Export Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="subtitles"
                      checked={config.includeSubtitles}
                      onCheckedChange={(checked) => setConfig({ ...config, includeSubtitles: checked as boolean })}
                    />
                    <Label htmlFor="subtitles" className="text-sm">
                      Include subtitle files (.srt)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="thumbnails"
                      checked={config.includeThumbnails}
                      onCheckedChange={(checked) => setConfig({ ...config, includeThumbnails: checked as boolean })}
                    />
                    <Label htmlFor="thumbnails" className="text-sm">
                      Include thumbnail images
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Tracking Integration
              </CardTitle>
              <CardDescription>Analytics platform integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  UTM parameters are compatible with GA4, Shopify Analytics, and most marketing platforms for
                  comprehensive tracking.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Supported Platforms:</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Google Analytics 4</Badge>
                  <Badge variant="outline">Shopify Analytics</Badge>
                  <Badge variant="outline">Facebook Ads</Badge>
                  <Badge variant="outline">TikTok Ads</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Variant Selection & UTM Management */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Variant Selection</CardTitle>
                  <CardDescription>
                    {selectedCount} of {variants.length} variants selected
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => selectAllVariants(true)}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => selectAllVariants(false)}>
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      variant.selected ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={variant.selected}
                        onCheckedChange={(checked) => updateVariantSelection(variant.id, checked as boolean)}
                        className="mt-1"
                      />

                      <div className="flex-1 space-y-3">
                        {/* Variant Info */}
                        <div>
                          <h3 className="font-semibold text-foreground">{variant.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {variant.duration}s
                            </Badge>
                            {variant.platform.map((platform) => (
                              <Badge key={platform} variant="outline" className="text-xs">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {variant.selected && (
                          <>
                            {/* UTM Parameters */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">UTM Source</Label>
                                <Select
                                  value={variant.utmParams.source}
                                  onValueChange={(value) => updateVariantUTM(variant.id, { source: value })}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tiktok">TikTok</SelectItem>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                    <SelectItem value="facebook">Facebook</SelectItem>
                                    <SelectItem value="youtube">YouTube</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">UTM Content</Label>
                                <Input
                                  value={variant.utmParams.content}
                                  onChange={(e) => updateVariantUTM(variant.id, { content: e.target.value })}
                                  className="h-8"
                                  placeholder="variant-id"
                                />
                              </div>
                            </div>

                            {/* Generated Tracking URL */}
                            <div className="space-y-2">
                              <Label className="text-xs">Tracking URL</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={variant.trackingUrl || generateTrackingUrl(variant)}
                                  readOnly
                                  className="h-8 font-mono text-xs"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyTrackingUrl(variant.trackingUrl || generateTrackingUrl(variant))}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Progress */}
          {isExporting && (
            <Card>
              <CardHeader>
                <CardTitle>Export Progress</CardTitle>
                <CardDescription>Preparing your video variants and tracking data...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={exportProgress} className="w-full" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Exporting {selectedCount} variants</span>
                    <span className="font-medium">{Math.round(exportProgress)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Complete */}
          {exportComplete && (
            <Card className="border-chart-2 bg-chart-2/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-chart-2" />
                  Export Complete
                </CardTitle>
                <CardDescription>Your variants and tracking data are ready</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{selectedCount}</p>
                      <p className="text-sm text-muted-foreground">Videos Exported</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{selectedCount}</p>
                      <p className="text-sm text-muted-foreground">Tracking URLs</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">1</p>
                      <p className="text-sm text-muted-foreground">CSV Report</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={generateCSV}>
                      <FileText className="w-4 h-4 mr-2" />
                      Download CSV Report
                    </Button>
                    <Button variant="outline" className="flex-1 bg-transparent">
                      <Link className="w-4 h-4 mr-2" />
                      Copy All URLs
                    </Button>
                  </div>

                  <Alert>
                    <BarChart3 className="h-4 w-4" />
                    <AlertDescription>
                      Import the CSV into your ad platform or use the tracking URLs to monitor performance in GA4 and
                      Shopify Analytics.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
