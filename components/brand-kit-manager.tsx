"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Upload, Palette, Type, ImageIcon, Settings, Eye, Save } from "lucide-react"

interface BrandKit {
  id: string
  name: string
  logo: {
    primary?: string
    secondary?: string
    watermark?: string
  }
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  typography: {
    headingFont: string
    bodyFont: string
    headingWeight: number
    bodyWeight: number
  }
  subtitles: {
    fontSize: number
    fontWeight: number
    strokeWidth: number
    strokeColor: string
    backgroundColor: string
    backgroundOpacity: number
    position: "top" | "center" | "bottom"
  }
  safeArea: {
    top: number
    bottom: number
    left: number
    right: number
  }
  watermark: {
    enabled: boolean
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    opacity: number
    size: number
  }
}

interface BrandKitManagerProps {
  projectId?: string
  onBrandKitChange?: (brandKit: BrandKit) => void
}

export function BrandKitManager({ projectId, onBrandKitChange }: BrandKitManagerProps) {
  const [brandKit, setBrandKit] = useState<BrandKit>({
    id: "default",
    name: "Default Brand Kit",
    logo: {},
    colors: {
      primary: "#164e63",
      secondary: "#ec4899",
      accent: "#f59e0b",
      background: "#ffffff",
      text: "#1f2937",
    },
    typography: {
      headingFont: "Work Sans",
      bodyFont: "Open Sans",
      headingWeight: 700,
      bodyWeight: 400,
    },
    subtitles: {
      fontSize: 24,
      fontWeight: 600,
      strokeWidth: 2,
      strokeColor: "#000000",
      backgroundColor: "#000000",
      backgroundOpacity: 0.7,
      position: "bottom",
    },
    safeArea: {
      top: 10,
      bottom: 10,
      left: 5,
      right: 5,
    },
    watermark: {
      enabled: true,
      position: "bottom-right",
      opacity: 0.8,
      size: 15,
    },
  })

  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile")

  const fonts = ["Work Sans", "Open Sans", "Inter", "Roboto", "Poppins", "Montserrat", "Lato", "Source Sans Pro"]

  const updateBrandKit = (updates: Partial<BrandKit>) => {
    const updated = { ...brandKit, ...updates }
    setBrandKit(updated)
    onBrandKitChange?.(updated)
  }

  const handleLogoUpload = (type: "primary" | "secondary" | "watermark") => {
    // Simulate file upload
    const mockUrl = `/placeholder.svg?height=100&width=200&query=logo`
    updateBrandKit({
      logo: {
        ...brandKit.logo,
        [type]: mockUrl,
      },
    })
  }

  const ColorPicker = ({
    label,
    value,
    onChange,
  }: { label: string; value: string; onChange: (color: string) => void }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded-lg border border-border cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => {
            const input = document.createElement("input")
            input.type = "color"
            input.value = value
            input.onchange = (e) => onChange((e.target as HTMLInputElement).value)
            input.click()
          }}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#000000" className="font-mono" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">Brand Kit</h2>
          <p className="text-muted-foreground">Define your brand's visual identity for consistent video styling</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Brand Kit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brand Kit Editor */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="logos" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="logos">Logos</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="subtitles">Subtitles</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <TabsContent value="logos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Logo Assets
                  </CardTitle>
                  <CardDescription>Upload your brand logos in different formats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Primary Logo */}
                  <div className="space-y-3">
                    <Label>Primary Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30">
                        {brandKit.logo.primary ? (
                          <img
                            src={brandKit.logo.primary || "/placeholder.svg"}
                            alt="Primary logo"
                            className="max-w-full max-h-full"
                          />
                        ) : (
                          <Upload className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Button variant="outline" onClick={() => handleLogoUpload("primary")}>
                          Upload Logo
                        </Button>
                        <p className="text-xs text-muted-foreground">SVG or PNG, transparent background recommended</p>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Logo */}
                  <div className="space-y-3">
                    <Label>Secondary Logo (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30">
                        {brandKit.logo.secondary ? (
                          <img
                            src={brandKit.logo.secondary || "/placeholder.svg"}
                            alt="Secondary logo"
                            className="max-w-full max-h-full"
                          />
                        ) : (
                          <Upload className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Button variant="outline" onClick={() => handleLogoUpload("secondary")}>
                          Upload Logo
                        </Button>
                        <p className="text-xs text-muted-foreground">Alternative version for different contexts</p>
                      </div>
                    </div>
                  </div>

                  {/* Watermark */}
                  <div className="space-y-3">
                    <Label>Watermark Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30">
                        {brandKit.logo.watermark ? (
                          <img
                            src={brandKit.logo.watermark || "/placeholder.svg"}
                            alt="Watermark logo"
                            className="max-w-full max-h-full"
                          />
                        ) : (
                          <Upload className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Button variant="outline" onClick={() => handleLogoUpload("watermark")}>
                          Upload Watermark
                        </Button>
                        <p className="text-xs text-muted-foreground">Small logo for video watermarking</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Color Palette
                  </CardTitle>
                  <CardDescription>Define your brand colors for consistent styling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <ColorPicker
                      label="Primary Color"
                      value={brandKit.colors.primary}
                      onChange={(color) =>
                        updateBrandKit({
                          colors: { ...brandKit.colors, primary: color },
                        })
                      }
                    />
                    <ColorPicker
                      label="Secondary Color"
                      value={brandKit.colors.secondary}
                      onChange={(color) =>
                        updateBrandKit({
                          colors: { ...brandKit.colors, secondary: color },
                        })
                      }
                    />
                    <ColorPicker
                      label="Accent Color"
                      value={brandKit.colors.accent}
                      onChange={(color) =>
                        updateBrandKit({
                          colors: { ...brandKit.colors, accent: color },
                        })
                      }
                    />
                    <ColorPicker
                      label="Background Color"
                      value={brandKit.colors.background}
                      onChange={(color) =>
                        updateBrandKit({
                          colors: { ...brandKit.colors, background: color },
                        })
                      }
                    />
                  </div>

                  {/* Color Palette Preview */}
                  <div className="space-y-2">
                    <Label>Color Palette Preview</Label>
                    <div className="flex gap-2">
                      {Object.entries(brandKit.colors).map(([name, color]) => (
                        <div key={name} className="text-center">
                          <div
                            className="w-16 h-16 rounded-lg border border-border"
                            style={{ backgroundColor: color }}
                          />
                          <p className="text-xs text-muted-foreground mt-1 capitalize">{name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Typography
                  </CardTitle>
                  <CardDescription>Configure fonts and text styling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Heading Font</Label>
                      <Select
                        value={brandKit.typography.headingFont}
                        onValueChange={(value) =>
                          updateBrandKit({
                            typography: { ...brandKit.typography, headingFont: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fonts.map((font) => (
                            <SelectItem key={font} value={font}>
                              {font}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Body Font</Label>
                      <Select
                        value={brandKit.typography.bodyFont}
                        onValueChange={(value) =>
                          updateBrandKit({
                            typography: { ...brandKit.typography, bodyFont: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fonts.map((font) => (
                            <SelectItem key={font} value={font}>
                              {font}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Typography Preview */}
                  <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                    <h3
                      className="text-2xl font-bold"
                      style={{
                        fontFamily: brandKit.typography.headingFont,
                        fontWeight: brandKit.typography.headingWeight,
                        color: brandKit.colors.primary,
                      }}
                    >
                      Your Brand Heading
                    </h3>
                    <p
                      className="text-base"
                      style={{
                        fontFamily: brandKit.typography.bodyFont,
                        fontWeight: brandKit.typography.bodyWeight,
                        color: brandKit.colors.text,
                      }}
                    >
                      This is how your body text will appear in videos. It should be clear and readable across all
                      devices.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subtitles" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Subtitle Styling
                  </CardTitle>
                  <CardDescription>Configure how subtitles appear in your videos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Font Size: {brandKit.subtitles.fontSize}px</Label>
                      <Slider
                        value={[brandKit.subtitles.fontSize]}
                        onValueChange={([value]) =>
                          updateBrandKit({
                            subtitles: { ...brandKit.subtitles, fontSize: value },
                          })
                        }
                        min={16}
                        max={48}
                        step={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Font Weight: {brandKit.subtitles.fontWeight}</Label>
                      <Slider
                        value={[brandKit.subtitles.fontWeight]}
                        onValueChange={([value]) =>
                          updateBrandKit({
                            subtitles: { ...brandKit.subtitles, fontWeight: value },
                          })
                        }
                        min={400}
                        max={900}
                        step={100}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <ColorPicker
                      label="Stroke Color"
                      value={brandKit.subtitles.strokeColor}
                      onChange={(color) =>
                        updateBrandKit({
                          subtitles: { ...brandKit.subtitles, strokeColor: color },
                        })
                      }
                    />
                    <ColorPicker
                      label="Background Color"
                      value={brandKit.subtitles.backgroundColor}
                      onChange={(color) =>
                        updateBrandKit({
                          subtitles: { ...brandKit.subtitles, backgroundColor: color },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select
                      value={brandKit.subtitles.position}
                      onValueChange={(value: "top" | "center" | "bottom") =>
                        updateBrandKit({
                          subtitles: { ...brandKit.subtitles, position: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subtitle Preview */}
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="aspect-[9/16] max-w-[200px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg relative overflow-hidden">
                      <div
                        className={`absolute left-4 right-4 ${
                          brandKit.subtitles.position === "top"
                            ? "top-4"
                            : brandKit.subtitles.position === "center"
                              ? "top-1/2 -translate-y-1/2"
                              : "bottom-4"
                        }`}
                      >
                        <div
                          className="text-center px-2 py-1 rounded"
                          style={{
                            fontSize: `${brandKit.subtitles.fontSize * 0.5}px`,
                            fontWeight: brandKit.subtitles.fontWeight,
                            color: "white",
                            backgroundColor: brandKit.subtitles.backgroundColor,
                            opacity: brandKit.subtitles.backgroundOpacity,
                            textShadow: `1px 1px 0 ${brandKit.subtitles.strokeColor}`,
                          }}
                        >
                          Sample subtitle text
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Layout & Watermark
                  </CardTitle>
                  <CardDescription>Configure safe areas and watermark placement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Safe Area */}
                  <div className="space-y-4">
                    <Label>Safe Area (% from edges)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Top: {brandKit.safeArea.top}%</Label>
                        <Slider
                          value={[brandKit.safeArea.top]}
                          onValueChange={([value]) =>
                            updateBrandKit({
                              safeArea: { ...brandKit.safeArea, top: value },
                            })
                          }
                          min={0}
                          max={20}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Bottom: {brandKit.safeArea.bottom}%</Label>
                        <Slider
                          value={[brandKit.safeArea.bottom]}
                          onValueChange={([value]) =>
                            updateBrandKit({
                              safeArea: { ...brandKit.safeArea, bottom: value },
                            })
                          }
                          min={0}
                          max={20}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Watermark Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Watermark</Label>
                      <Switch
                        checked={brandKit.watermark.enabled}
                        onCheckedChange={(enabled) =>
                          updateBrandKit({
                            watermark: { ...brandKit.watermark, enabled },
                          })
                        }
                      />
                    </div>

                    {brandKit.watermark.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Position</Label>
                          <Select
                            value={brandKit.watermark.position}
                            onValueChange={(value: any) =>
                              updateBrandKit({
                                watermark: { ...brandKit.watermark, position: value },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top-left">Top Left</SelectItem>
                              <SelectItem value="top-right">Top Right</SelectItem>
                              <SelectItem value="bottom-left">Bottom Left</SelectItem>
                              <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Size: {brandKit.watermark.size}%</Label>
                          <Slider
                            value={[brandKit.watermark.size]}
                            onValueChange={([value]) =>
                              updateBrandKit({
                                watermark: { ...brandKit.watermark, size: value },
                              })
                            }
                            min={5}
                            max={30}
                            step={1}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>See how your brand kit will look in videos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-[9/16] bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg relative overflow-hidden">
                {/* Background */}
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: brandKit.colors.background, opacity: 0.1 }}
                />

                {/* Logo */}
                {brandKit.logo.primary && (
                  <div className="absolute top-4 left-4 right-4">
                    <img src={brandKit.logo.primary || "/placeholder.svg"} alt="Logo" className="h-8 mx-auto" />
                  </div>
                )}

                {/* Content Area */}
                <div className="absolute inset-4 flex flex-col justify-center items-center text-center">
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{
                      fontFamily: brandKit.typography.headingFont,
                      color: brandKit.colors.primary,
                    }}
                  >
                    Your Brand
                  </h3>
                  <p
                    className="text-sm"
                    style={{
                      fontFamily: brandKit.typography.bodyFont,
                      color: "white",
                    }}
                  >
                    Sample content with your styling
                  </p>
                </div>

                {/* Subtitles */}
                <div
                  className={`absolute left-4 right-4 ${
                    brandKit.subtitles.position === "top"
                      ? "top-16"
                      : brandKit.subtitles.position === "center"
                        ? "top-1/2 -translate-y-1/2"
                        : "bottom-4"
                  }`}
                >
                  <div
                    className="text-center px-2 py-1 rounded text-xs"
                    style={{
                      fontWeight: brandKit.subtitles.fontWeight,
                      color: "white",
                      backgroundColor: brandKit.subtitles.backgroundColor,
                      opacity: brandKit.subtitles.backgroundOpacity,
                    }}
                  >
                    Sample subtitle
                  </div>
                </div>

                {/* Watermark */}
                {brandKit.watermark.enabled && brandKit.logo.watermark && (
                  <div
                    className={`absolute ${
                      brandKit.watermark.position === "top-left"
                        ? "top-2 left-2"
                        : brandKit.watermark.position === "top-right"
                          ? "top-2 right-2"
                          : brandKit.watermark.position === "bottom-left"
                            ? "bottom-2 left-2"
                            : "bottom-2 right-2"
                    }`}
                  >
                    <img
                      src={brandKit.logo.watermark || "/placeholder.svg"}
                      alt="Watermark"
                      className="h-4"
                      style={{ opacity: brandKit.watermark.opacity }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Brand Kit Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Kit Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Primary Color</span>
                <Badge style={{ backgroundColor: brandKit.colors.primary, color: "white" }}>
                  {brandKit.colors.primary}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Heading Font</span>
                <Badge variant="outline">{brandKit.typography.headingFont}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtitle Size</span>
                <Badge variant="outline">{brandKit.subtitles.fontSize}px</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Watermark</span>
                <Badge variant={brandKit.watermark.enabled ? "default" : "secondary"}>
                  {brandKit.watermark.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
