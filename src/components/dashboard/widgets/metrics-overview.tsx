"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Users, FileText, Calendar, DollarSign } from "lucide-react"

interface MetricsOverviewProps {
  config?: any
  className?: string
}

export function MetricsOverview({ config, className }: MetricsOverviewProps) {
  // Mock data - in real implementation, this would come from API
  const metrics = [
    {
      title: "Total Deals",
      value: "24",
      change: "+12%",
      trend: "up",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Active Contacts",
      value: "156",
      change: "+8%",
      trend: "up", 
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Upcoming Tasks",
      value: "18",
      change: "-5%",
      trend: "down",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    {
      title: "Deal Value",
      value: "$2.4M",
      change: "+23%",
      trend: "up",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    }
  ]

  return (
    <Card className={`shadow-lg border-border/50 hover:shadow-xl transition-all duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          Metrics Overview
        </CardTitle>
        <CardDescription className="text-base">
          Key performance indicators and metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div key={index} className="text-center group">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${metric.bgColor} border ${metric.borderColor} mb-3 transition-all duration-300 group-hover:scale-110`}>
                  <Icon className={`h-7 w-7 ${metric.color}`} />
                </div>
                <div className="text-2xl font-bold tracking-tight">{metric.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{metric.title}</div>
                <Badge 
                  variant={metric.trend === "up" ? "default" : "destructive"}
                  className="text-xs mt-2 px-2 py-1"
                >
                  {metric.change}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}