"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Search, Filter, Plus, Star, Clock, Users } from "lucide-react"

interface Template {
  id: string
  name: string
  description: string
  category: "product-demo" | "testimonial" | "announcement" | "tutorial" | "ugc"
  duration: number
  popularity: number
  thumbnail: string
  placeholders: string[]
  platforms: string[]
  tags: string[]
}

interface TemplateLibraryProps {
  onSelectTemplate?: (template: Template) => void
}

export function TemplateLibrary({ onSelectTemplate }: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all")

  const templates: Template[] = [
    {
      id: "template-1",
      name: "Product Showcase",
      description: "Perfect for highlighting product features with dynamic transitions",
      category: "product-demo",
      duration: 15,
      popularity: 95,
      thumbnail: "/placeholder.svg?height=400&width=225",
      placeholders: ["{{PRODUCT_NAME}}", "{{HOOK}}", "{{CTA}}", "{{LOGO}}"],
      platforms: ["tiktok", "instagram", "youtube"],
      tags: ["product", "showcase", "dynamic", "modern"],
    },
    {
      id: "template-2",
      name: "Customer Testimonial",
      description: "Authentic testimonial format with social proof elements",
      category: "testimonial",
      duration: 20,
      popularity: 88,
      thumbnail: "/placeholder.svg?height=400&width=225",
      placeholders: ["{{CUSTOMER_NAME}}", "{{TESTIMONIAL}}", "{{RATING}}", "{{PRODUCT}}"],
      platforms: ["tiktok", "instagram"],
      tags: ["testimonial", "social-proof", "authentic", "trust"],
    },
    {
      id: "template-3",
      name: "Flash Sale Alert",
      description: "High-energy template for limited-time offers and promotions",
      category: "announcement",
      duration: 10,
      popularity: 92,
      thumbnail: "/placeholder.svg?height=400&width=225",
      placeholders: ["{{DISCOUNT}}", "{{TIMER}}", "{{PRODUCT}}", "{{URGENCY_TEXT}}"],
      platforms: ["tiktok", "instagram", "youtube"],
      tags: ["sale", "urgent", "promotion", "limited-time"],
    },
    {
      id: "template-4",
      name: "How-To Tutorial",
      description: "Step-by-step tutorial format with clear instructions",
      category: "tutorial",
      duration: 30,
      popularity: 85,
      thumbnail: "/placeholder.svg?height=400&width=225",
      placeholders: ["{{TITLE}}", "{{STEPS}}", "{{TIPS}}", "{{CONCLUSION}}"],
      platforms: ["youtube", "instagram"],
      tags: ["tutorial", "educational", "step-by-step", "helpful"],
    },
    {
      id: "template-5",
      name: "UGC Style Review",
      description: "Authentic user-generated content style for product reviews",
      category: "ugc",
      duration: 25,
      popularity: 90,
      thumbnail: "/placeholder.svg?height=400&width=225",
      placeholders: ["{{REVIEWER}}", "{{PRODUCT}}", "{{EXPERIENCE}}", "{{RECOMMENDATION}}"],
      platforms: ["tiktok", "instagram"],
      tags: ["ugc", "authentic", "review", "personal"],
    },
    {
      id: "template-6",
      name: "Before & After",
      description: "Transformation showcase with split-screen effects",
      category: "product-demo",
      duration: 18,
      popularity: 87,
      thumbnail: "/placeholder.svg?height=400&width=225",
      placeholders: ["{{BEFORE_IMAGE}}", "{{AFTER_IMAGE}}", "{{TRANSFORMATION}}", "{{RESULTS}}"],
      platforms: ["tiktok", "instagram", "youtube"],
      tags: ["transformation", "before-after", "results", "visual"],
    },
  ]

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "product-demo", label: "Product Demo" },
    { value: "testimonial", label: "Testimonial" },
    { value: "announcement", label: "Announcement" },
    { value: "tutorial", label: "Tutorial" },
    { value: "ugc", label: "UGC Style" },
  ]

  const platforms = [
    { value: "all", label: "All Platforms" },
    { value: "tiktok", label: "TikTok" },
    { value: "instagram", label: "Instagram" },
    { value: "youtube", label: "YouTube" },
  ]

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    const matchesPlatform = selectedPlatform === "all" || template.platforms.includes(selectedPlatform)

    return matchesSearch && matchesCategory && matchesPlatform
  })

  const getCategoryColor = (category: Template["category"]) => {
    const colors = {
      "product-demo": "bg-blue-100 text-blue-800",
      testimonial: "bg-green-100 text-green-800",
      announcement: "bg-red-100 text-red-800",
      tutorial: "bg-purple-100 text-purple-800",
      ugc: "bg-orange-100 text-orange-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
            Template Library
          </h2>
          <p className="text-muted-foreground">Choose from professionally designed video templates</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Custom Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((platform) => (
                  <SelectItem key={platform.value} value={platform.value}>
                    {platform.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-0">
              {/* Template Thumbnail */}
              <div className="relative aspect-[9/16] bg-muted rounded-t-lg overflow-hidden">
                <img
                  src={template.thumbnail || "/placeholder.svg"}
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button size="sm" className="gap-2">
                    <Play className="w-4 h-4" />
                    Preview
                  </Button>
                </div>

                {/* Popularity Badge */}
                <div className="absolute top-2 right-2">
                  <Badge className="gap-1 bg-black/70 text-white">
                    <Star className="w-3 h-3 fill-current" />
                    {template.popularity}%
                  </Badge>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground font-[family-name:var(--font-work-sans)]">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  </div>
                </div>

                {/* Template Meta */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{template.duration}s</span>
                  <Users className="w-4 h-4 ml-2" />
                  <span>{template.placeholders.length} variables</span>
                </div>

                {/* Category and Platform Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getCategoryColor(template.category)}>{template.category.replace("-", " ")}</Badge>
                  {template.platforms.map((platform) => (
                    <Badge key={platform} variant="outline" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>

                {/* Placeholders */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.placeholders.map((placeholder) => (
                      <Badge key={placeholder} variant="secondary" className="text-xs font-mono">
                        {placeholder}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Button className="w-full" onClick={() => onSelectTemplate?.(template)}>
                  Use This Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  )
}
