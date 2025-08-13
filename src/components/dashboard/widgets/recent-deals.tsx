"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, DollarSign, ExternalLink, MoreHorizontal } from "lucide-react"

interface RecentDealsProps {
  config?: any
  className?: string
}

export function RecentDeals({ config, className }: RecentDealsProps) {
  // Mock data - in real implementation, this would come from API
  const deals = [
    {
      id: "1",
      name: "TechCorp Acquisition",
      stage: "NEGOTIATION",
      value: "$500,000",
      company: "TechCorp Inc.",
      lastUpdated: "2 hours ago"
    },
    {
      id: "2", 
      name: "StartupSeed Round",
      stage: "PROPOSAL_SENT",
      value: "$250,000",
      company: "StartupSeed LLC",
      lastUpdated: "1 day ago"
    },
    {
      id: "3",
      name: "GrowthEquity Deal",
      stage: "DUE_DILIGENCE", 
      value: "$1,200,000",
      company: "GrowthEquity Partners",
      lastUpdated: "3 days ago"
    }
  ]

  const stageColors = {
    NEW_LEAD: "bg-gray-100 text-gray-800 border-gray-200",
    QUALIFIED: "bg-blue-100 text-blue-800 border-blue-200",
    PROPOSAL_SENT: "bg-yellow-100 text-yellow-800 border-yellow-200",
    NEGOTIATION: "bg-orange-100 text-orange-800 border-orange-200",
    DUE_DILIGENCE: "bg-purple-100 text-purple-800 border-purple-200",
    CLOSED_WON: "bg-green-100 text-green-800 border-green-200",
    CLOSED_LOST: "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <Card className={`shadow-lg border-border/50 hover:shadow-xl transition-all duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          Recent Deals
        </CardTitle>
        <CardDescription className="text-base">
          Latest deal updates and activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deals.map((deal) => (
            <div key={deal.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 group">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{deal.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {deal.company}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${stageColors[deal.stage as keyof typeof stageColors] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {deal.stage.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    {deal.value}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Updated {deal.lastUpdated}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border/50">
          <Button variant="outline" size="sm" className="w-full hover:bg-primary/5 hover:border-primary/30 transition-all duration-200">
            <ExternalLink className="mr-2 h-4 w-4" />
            View All Deals
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}