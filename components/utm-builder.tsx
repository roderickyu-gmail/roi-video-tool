"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink, Info, Link } from "lucide-react"

interface UTMParams {
  source: string
  medium: string
  campaign: string
  content: string
  term: string
}

export function UTMBuilder() {
  const [baseUrl, setBaseUrl] = useState("https://yourstore.com")
  const [utmParams, setUtmParams] = useState<UTMParams>({
    source: "",
    medium: "video",
    campaign: "",
    content: "",
    term: "",
  })

  const [previewUrl, setPreviewUrl] = useState("")

  const generateUrl = () => {
    const params = new URLSearchParams()
    if (utmParams.source) params.append("utm_source", utmParams.source)
    if (utmParams.medium) params.append("utm_medium", utmParams.medium)
    if (utmParams.campaign) params.append("utm_campaign", utmParams.campaign)
    if (utmParams.content) params.append("utm_content", utmParams.content)
    if (utmParams.term) params.append("utm_term", utmParams.term)

    const url = `${baseUrl}${params.toString() ? "?" + params.toString() : ""}`
    setPreviewUrl(url)
    return url
  }

  const copyUrl = () => {
    const url = generateUrl()
    navigator.clipboard.writeText(url)
  }

  const commonSources = [
    { value: "tiktok", label: "TikTok" },
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
    { value: "youtube", label: "YouTube" },
    { value: "twitter", label: "Twitter" },
    { value: "linkedin", label: "LinkedIn" },
  ]

  const commonMediums = [
    { value: "video", label: "Video" },
    { value: "social", label: "Social" },
    { value: "paid", label: "Paid" },
    { value: "organic", label: "Organic" },
    { value: "email", label: "Email" },
    { value: "referral", label: "Referral" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            UTM Link Builder
          </CardTitle>
          <CardDescription>Create trackable URLs for your video campaigns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base URL */}
          <div className="space-y-2">
            <Label>Website URL *</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://yourstore.com"
              className="font-mono"
            />
          </div>

          {/* UTM Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Campaign Source * (utm_source)</Label>
              <Select value={utmParams.source} onValueChange={(value) => setUtmParams({ ...utmParams, source: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {commonSources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">The platform where the ad will be shown</p>
            </div>

            <div className="space-y-2">
              <Label>Campaign Medium * (utm_medium)</Label>
              <Select value={utmParams.medium} onValueChange={(value) => setUtmParams({ ...utmParams, medium: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select medium" />
                </SelectTrigger>
                <SelectContent>
                  {commonMediums.map((medium) => (
                    <SelectItem key={medium.value} value={medium.value}>
                      {medium.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">The marketing medium (video, social, etc.)</p>
            </div>

            <div className="space-y-2">
              <Label>Campaign Name * (utm_campaign)</Label>
              <Input
                value={utmParams.campaign}
                onChange={(e) => setUtmParams({ ...utmParams, campaign: e.target.value })}
                placeholder="summer-launch-2024"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">The specific campaign identifier</p>
            </div>

            <div className="space-y-2">
              <Label>Campaign Content (utm_content)</Label>
              <Input
                value={utmParams.content}
                onChange={(e) => setUtmParams({ ...utmParams, content: e.target.value })}
                placeholder="variant-1"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">Differentiate similar content or links</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Campaign Term (utm_term)</Label>
              <Input
                value={utmParams.term}
                onChange={(e) => setUtmParams({ ...utmParams, term: e.target.value })}
                placeholder="summer-collection"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">Identify paid search keywords (optional)</p>
            </div>
          </div>

          {/* Generated URL */}
          <div className="space-y-2">
            <Label>Generated URL</Label>
            <div className="flex items-center gap-2">
              <Input
                value={generateUrl()}
                readOnly
                className="font-mono text-sm"
                placeholder="Configure parameters above to generate URL"
              />
              <Button variant="outline" onClick={copyUrl} disabled={!utmParams.source || !utmParams.campaign}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" disabled={!utmParams.source || !utmParams.campaign}>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* URL Breakdown */}
          {utmParams.source && utmParams.campaign && (
            <div className="space-y-3">
              <Label>URL Parameters Breakdown</Label>
              <div className="space-y-2">
                {Object.entries(utmParams).map(([key, value]) => {
                  if (!value) return null
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        utm_{key}
                      </Badge>
                      <span className="text-sm font-mono">{value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Best Practices */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Best Practices:</strong> Use consistent naming conventions, avoid spaces (use hyphens), and keep
              parameters descriptive but concise. These URLs will be tracked in GA4 and Shopify Analytics.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
