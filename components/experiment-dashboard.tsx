"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, TrendingDown, Play, Pause, Trophy } from "lucide-react"

interface ExperimentData {
  id: string
  name: string
  status: "running" | "completed" | "paused"
  startDate: string
  endDate?: string
  testVariable: string
  variants: {
    id: string
    name: string
    impressions: number
    clicks: number
    conversions: number
    revenue: number
    ctr: number
    cvr: number
    roas: number
  }[]
}

export function ExperimentDashboard() {
  const [selectedExperiment, setSelectedExperiment] = useState<string>("exp-1")

  // Mock experiment data
  const experiments: ExperimentData[] = [
    {
      id: "exp-1",
      name: "Hook Test - Summer Campaign",
      status: "running",
      startDate: "2024-01-15",
      testVariable: "hook",
      variants: [
        {
          id: "var-1",
          name: "Stop scrolling if you...",
          impressions: 12500,
          clicks: 425,
          conversions: 23,
          revenue: 1150,
          ctr: 3.4,
          cvr: 5.4,
          roas: 2.7,
        },
        {
          id: "var-2",
          name: "This changed everything...",
          impressions: 11800,
          clicks: 520,
          conversions: 31,
          revenue: 1550,
          ctr: 4.4,
          cvr: 6.0,
          roas: 3.0,
        },
        {
          id: "var-3",
          name: "POV: You finally found...",
          impressions: 13200,
          clicks: 380,
          conversions: 18,
          revenue: 900,
          ctr: 2.9,
          cvr: 4.7,
          roas: 2.4,
        },
        {
          id: "var-4",
          name: "Nobody talks about this...",
          impressions: 12000,
          clicks: 600,
          conversions: 42,
          revenue: 2100,
          ctr: 5.0,
          cvr: 7.0,
          roas: 3.5,
        },
      ],
    },
  ]

  const currentExperiment = experiments.find((exp) => exp.id === selectedExperiment)
  const winner = currentExperiment?.variants.reduce((prev, current) => (prev.roas > current.roas ? prev : current))

  const chartData = currentExperiment?.variants.map((variant) => ({
    name: variant.name.substring(0, 15) + "...",
    ctr: variant.ctr,
    cvr: variant.cvr,
    roas: variant.roas,
    revenue: variant.revenue,
  }))

  const pieData = currentExperiment?.variants.map((variant, index) => ({
    name: variant.name.substring(0, 20) + "...",
    value: variant.revenue,
    color: ["#164e63", "#ec4899", "#f59e0b", "#10b981"][index % 4],
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
            Experiment Results
          </h2>
          <p className="text-muted-foreground">Track performance of your A/B test variants</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Pause className="w-4 h-4 mr-2" />
            Pause Test
          </Button>
          <Button>
            <Trophy className="w-4 h-4 mr-2" />
            Declare Winner
          </Button>
        </div>
      </div>

      {currentExperiment && (
        <>
          {/* Experiment Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-[family-name:var(--font-work-sans)]">{currentExperiment.name}</CardTitle>
                  <CardDescription>
                    Testing {currentExperiment.testVariable} • Started {currentExperiment.startDate}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    currentExperiment.status === "running"
                      ? "default"
                      : currentExperiment.status === "completed"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {currentExperiment.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {currentExperiment.variants.reduce((acc, v) => acc + v.impressions, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Impressions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {currentExperiment.variants.reduce((acc, v) => acc + v.clicks, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {currentExperiment.variants.reduce((acc, v) => acc + v.conversions, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Conversions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    ${currentExperiment.variants.reduce((acc, v) => acc + v.revenue, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Winner Highlight */}
          {winner && (
            <Card className="border-chart-2 bg-chart-2/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-chart-2" />
                  Current Leader
                </CardTitle>
                <CardDescription>Best performing variant based on ROAS</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{winner.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {winner.impressions.toLocaleString()} impressions • {winner.clicks} clicks
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-chart-2">{winner.roas}x ROAS</p>
                    <p className="text-sm text-muted-foreground">${winner.revenue} revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>CTR, CVR, and ROAS by variant</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ctr" fill="#164e63" name="CTR %" />
                    <Bar dataKey="cvr" fill="#ec4899" name="CVR %" />
                    <Bar dataKey="roas" fill="#f59e0b" name="ROAS" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Revenue share by variant</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Variant Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Variant Performance Details</CardTitle>
              <CardDescription>Detailed metrics for each variant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentExperiment.variants.map((variant, index) => (
                  <div
                    key={variant.id}
                    className={`p-4 border rounded-lg ${
                      variant.id === winner?.id ? "border-chart-2 bg-chart-2/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Play className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{variant.name}</h3>
                          <p className="text-sm text-muted-foreground">Variant {index + 1}</p>
                        </div>
                      </div>
                      {variant.id === winner?.id && (
                        <Badge className="bg-chart-2 text-white">
                          <Trophy className="w-3 h-3 mr-1" />
                          Leader
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Impressions</p>
                        <p className="font-semibold">{variant.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Clicks</p>
                        <p className="font-semibold">{variant.clicks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CTR</p>
                        <p className="font-semibold flex items-center gap-1">
                          {variant.ctr}%
                          {variant.ctr > 3.5 ? (
                            <TrendingUp className="w-3 h-3 text-chart-2" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-chart-4" />
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CVR</p>
                        <p className="font-semibold flex items-center gap-1">
                          {variant.cvr}%
                          {variant.cvr > 5.5 ? (
                            <TrendingUp className="w-3 h-3 text-chart-2" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-chart-4" />
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-semibold">${variant.revenue}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ROAS</p>
                        <p className="font-semibold flex items-center gap-1">
                          {variant.roas}x
                          {variant.roas > 2.8 ? (
                            <TrendingUp className="w-3 h-3 text-chart-2" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-chart-4" />
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Performance Score</span>
                        <span>{Math.round((variant.roas / 4) * 100)}%</span>
                      </div>
                      <Progress value={(variant.roas / 4) * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
