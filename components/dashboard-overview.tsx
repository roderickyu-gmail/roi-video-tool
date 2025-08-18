"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, TrendingUp, Users, MoreHorizontal, Eye, MousePointer, DollarSign } from "lucide-react"
import Link from "next/link"

interface DashboardOverviewProps {
  onCreateProject: () => void
}

export function DashboardOverview({ onCreateProject }: DashboardOverviewProps) {
  const projects = [
    {
      id: "proj_1",
      name: "Summer Collection Launch",
      platform: "TikTok",
      variants: 15,
      status: "Active",
      performance: { ctr: 3.2, cvr: 2.1, roas: 4.5 },
      lastUpdated: "2 hours ago",
    },
    {
      id: "proj_2",
      name: "Black Friday Campaign",
      platform: "Instagram",
      variants: 20,
      status: "Testing",
      performance: { ctr: 2.8, cvr: 1.9, roas: 3.8 },
      lastUpdated: "1 day ago",
    },
    {
      id: "proj_3",
      name: "Product Demo Series",
      platform: "YouTube",
      variants: 12,
      status: "Draft",
      performance: { ctr: 0, cvr: 0, roas: 0 },
      lastUpdated: "3 days ago",
    },
  ]

  const stats = [
    { label: "Total Projects", value: "24", change: "+12%", icon: Play },
    { label: "Active Variants", value: "156", change: "+8%", icon: Eye },
    { label: "Avg. CTR", value: "3.1%", change: "+0.3%", icon: MousePointer },
    { label: "Total ROAS", value: "4.2x", change: "+0.8x", icon: DollarSign },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
                    {stat.value}
                  </p>
                  <p className="text-sm text-chart-2 font-medium">{stat.change}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">Recent Projects</CardTitle>
              <CardDescription>Your latest video production projects and their performance</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                      <Play className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground font-[family-name:var(--font-work-sans)]">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {project.platform}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{project.variants} variants</span>
                        <Badge
                          variant={
                            project.status === "Active"
                              ? "default"
                              : project.status === "Testing"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {project.status !== "Draft" && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium text-foreground">{project.performance.ctr}%</p>
                          <p className="text-muted-foreground">CTR</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-foreground">{project.performance.cvr}%</p>
                          <p className="text-muted-foreground">CVR</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-chart-2">{project.performance.roas}x</p>
                          <p className="text-muted-foreground">ROAS</p>
                        </div>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{project.lastUpdated}</p>
                      <Button variant="ghost" size="sm" className="mt-1">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="border-dashed border-2 border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
          onClick={onCreateProject}
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Play className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground font-[family-name:var(--font-work-sans)] mb-2">
              Create New Project
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start a new video production project with brand kit and UTM tracking
            </p>
            <Button className="w-full">Get Started</Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground font-[family-name:var(--font-work-sans)] mb-2">
              View Analytics
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze performance across all your video variants and campaigns
            </p>
            <Button variant="outline" className="w-full bg-transparent">
              View Reports
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-chart-1/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-chart-1" />
            </div>
            <h3 className="font-semibold text-foreground font-[family-name:var(--font-work-sans)] mb-2">
              Team Settings
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Manage team members, integrations, and billing preferences
            </p>
            <Button variant="outline" className="w-full bg-transparent">
              Manage Team
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
