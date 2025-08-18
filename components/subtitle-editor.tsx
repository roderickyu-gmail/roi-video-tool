"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, Download, Save } from "lucide-react"

interface SubtitleEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetName: string
  initialSubtitles?: string
}

export function SubtitleEditor({ open, onOpenChange, assetName, initialSubtitles }: SubtitleEditorProps) {
  const [subtitles, setSubtitles] = useState(
    initialSubtitles ||
      `1
00:00:00,000 --> 00:00:03,000
Welcome to our amazing product demo

2
00:00:03,000 --> 00:00:06,000
This will change how you think about...

3
00:00:06,000 --> 00:00:09,000
Don't miss out on this limited offer`,
  )

  const [isPlaying, setIsPlaying] = useState(false)

  const handleSave = () => {
    // Save subtitle logic here
    console.log("Saving subtitles:", subtitles)
    onOpenChange(false)
  }

  const handleExport = (format: "srt" | "vtt") => {
    const blob = new Blob([subtitles], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${assetName}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-work-sans)]">Edit Subtitles</DialogTitle>
          <DialogDescription>Edit and preview subtitles for {assetName}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Video Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Video Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <Play className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Video preview would appear here</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Badge variant="secondary">00:00 / 00:30</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Subtitle Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subtitle Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={subtitles}
                onChange={(e) => setSubtitles(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Enter subtitle content in SRT format..."
              />
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExport("srt")}>
                    <Download className="w-4 h-4 mr-1" />
                    Export SRT
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport("vtt")}>
                    <Download className="w-4 h-4 mr-1" />
                    Export VTT
                  </Button>
                </div>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
