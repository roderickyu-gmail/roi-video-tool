"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  Video,
  ImageIcon,
  Music,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Play,
  Download,
  Edit,
} from "lucide-react"

interface AssetFile {
  id: string
  file: File
  type: "video" | "image" | "audio" | "subtitle"
  status: "uploading" | "processing" | "ready" | "error"
  progress: number
  preview?: string
  duration?: number
  dimensions?: { width: number; height: number }
  compliance?: {
    aspectRatio: boolean
    fileSize: boolean
    codec: boolean
    duration: boolean
  }
  subtitles?: {
    generated: boolean
    language: string
    content: string
  }
}

interface AssetUploadProps {
  projectId?: string
  onAssetsChange?: (assets: AssetFile[]) => void
}

export function AssetUpload({ projectId, onAssetsChange }: AssetUploadProps) {
  const [assets, setAssets] = useState<AssetFile[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<string>("tiktok")

  const platformSpecs = {
    tiktok: {
      name: "TikTok",
      aspectRatio: "9:16",
      maxSize: 500 * 1024 * 1024, // 500MB
      maxDuration: 180, // 3 minutes
      codecs: ["H.264", "H.265"],
      minResolution: { width: 540, height: 960 },
    },
    instagram: {
      name: "Instagram Reels",
      aspectRatio: "9:16",
      maxSize: 4 * 1024 * 1024 * 1024, // 4GB
      maxDuration: 900, // 15 minutes
      codecs: ["H.264", "H.265"],
      minResolution: { width: 720, height: 1280 },
    },
    youtube: {
      name: "YouTube Shorts",
      aspectRatio: "9:16",
      maxSize: 15 * 1024 * 1024 * 1024, // 15GB
      maxDuration: 60, // 1 minute
      codecs: ["H.264", "H.265", "VP9"],
      minResolution: { width: 1080, height: 1920 },
    },
  }

  const checkCompliance = (file: File, type: string): AssetFile["compliance"] => {
    const specs = platformSpecs[selectedPlatform as keyof typeof platformSpecs]

    return {
      aspectRatio: true, // Would need video analysis
      fileSize: file.size <= specs.maxSize,
      codec: true, // Would need video analysis
      duration: true, // Would need video analysis
    }
  }

  const generateSubtitles = async (assetId: string) => {
    // Simulate subtitle generation
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              status: "processing",
              subtitles: { generated: false, language: "en", content: "" },
            }
          : asset,
      ),
    )

    // Simulate API call delay
    setTimeout(() => {
      setAssets((prev) =>
        prev.map((asset) =>
          asset.id === assetId
            ? {
                ...asset,
                status: "ready",
                subtitles: {
                  generated: true,
                  language: "en",
                  content: "This is a sample subtitle generated for your video content...",
                },
              }
            : asset,
        ),
      )
    }, 3000)
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newAssets: AssetFile[] = acceptedFiles.map((file) => {
        const type = file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("audio/")
              ? "audio"
              : "subtitle"

        const asset: AssetFile = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          type,
          status: "uploading",
          progress: 0,
          compliance: type === "video" ? checkCompliance(file, type) : undefined,
          preview: type === "image" ? URL.createObjectURL(file) : undefined,
        }

        // Simulate upload progress
        const interval = setInterval(() => {
          setAssets((prev) =>
            prev.map((a) =>
              a.id === asset.id && a.progress < 100 ? { ...a, progress: Math.min(a.progress + 10, 100) } : a,
            ),
          )
        }, 200)

        // Complete upload after progress reaches 100%
        setTimeout(() => {
          clearInterval(interval)
          setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, status: "ready", progress: 100 } : a)))
        }, 2000)

        return asset
      })

      setAssets((prev) => [...prev, ...newAssets])
      onAssetsChange?.([...assets, ...newAssets])
    },
    [assets, onAssetsChange, selectedPlatform],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
      "audio/*": [".mp3", ".wav", ".aac"],
      "text/*": [".srt", ".vtt"],
    },
    multiple: true,
  })

  const removeAsset = (id: string) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== id))
  }

  const getFileIcon = (type: AssetFile["type"]) => {
    switch (type) {
      case "video":
        return Video
      case "image":
        return ImageIcon
      case "audio":
        return Music
      case "subtitle":
        return FileText
      default:
        return FileText
    }
  }

  const getStatusColor = (status: AssetFile["status"]) => {
    switch (status) {
      case "ready":
        return "text-chart-2"
      case "processing":
        return "text-chart-1"
      case "error":
        return "text-destructive"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-work-sans)]">Platform Specifications</CardTitle>
          <CardDescription>Select target platform for compliance validation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(platformSpecs).map(([key, spec]) => (
              <div
                key={key}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPlatform === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedPlatform(key)}
              >
                <h3 className="font-semibold mb-2">{spec.name}</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Ratio: {spec.aspectRatio}</p>
                  <p>Max: {spec.maxSize / (1024 * 1024)}MB</p>
                  <p>Duration: {spec.maxDuration}s</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-work-sans)]">Upload Assets</CardTitle>
          <CardDescription>Drag and drop your video files, images, audio, and subtitle files</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium text-primary">Drop files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium text-foreground mb-2">Drop files here or click to browse</p>
                <p className="text-sm text-muted-foreground">Supports MP4, MOV, PNG, JPG, MP3, SRT files</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Asset List */}
      {assets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-work-sans)]">Uploaded Assets</CardTitle>
            <CardDescription>Manage your project assets and generate subtitles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assets.map((asset) => {
                const FileIcon = getFileIcon(asset.type)
                return (
                  <div key={asset.id} className="flex items-center gap-4 p-4 border border-border/50 rounded-lg">
                    {/* File Icon/Preview */}
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {asset.preview ? (
                        <img src={asset.preview || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{asset.file.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {asset.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {(asset.file.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                        <span className={`text-sm font-medium ${getStatusColor(asset.status)}`}>{asset.status}</span>
                      </div>

                      {/* Progress Bar */}
                      {asset.status === "uploading" && <Progress value={asset.progress} className="mt-2" />}

                      {/* Compliance Status */}
                      {asset.compliance && asset.status === "ready" && (
                        <div className="flex items-center gap-2 mt-2">
                          {asset.compliance.fileSize ? (
                            <CheckCircle className="w-4 h-4 text-chart-2" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-chart-4" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            Platform compliance:{" "}
                            {Object.values(asset.compliance).every(Boolean) ? "Passed" : "Issues found"}
                          </span>
                        </div>
                      )}

                      {/* Subtitle Status */}
                      {asset.type === "video" && asset.status === "ready" && (
                        <div className="flex items-center gap-2 mt-2">
                          {asset.subtitles?.generated ? (
                            <Badge variant="default" className="text-xs">
                              Subtitles Ready
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateSubtitles(asset.id)}
                              disabled={asset.status === "processing"}
                            >
                              Generate Subtitles
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {asset.status === "ready" && (
                        <>
                          <Button size="sm" variant="ghost">
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => removeAsset(asset.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Warnings */}
      {assets.some((asset) => asset.compliance && !Object.values(asset.compliance).every(Boolean)) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some files don't meet platform specifications. They may be automatically converted or may not perform
            optimally when published.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
