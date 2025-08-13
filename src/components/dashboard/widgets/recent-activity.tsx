"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  UserPlus, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  MoreHorizontal,
  ExternalLink
} from "lucide-react"

interface RecentActivityProps {
  config?: any
  className?: string
}

export function RecentActivity({ config, className }: RecentActivityProps) {
  // Mock data - in real implementation, this would come from API
  const activities = [
    {
      id: "1",
      type: "deal_created",
      title: "New deal created: TechCorp Acquisition",
      description: "Deal worth $500,000 created by John Doe",
      timestamp: "2 hours ago",
      user: {
        name: "John Doe",
        avatar: null
      }
    },
    {
      id: "2",
      type: "contact_added",
      title: "New contact added: Sarah Johnson",
      description: "Contact added to TechCorp deal",
      timestamp: "4 hours ago",
      user: {
        name: "Jane Smith", 
        avatar: null
      }
    },
    {
      id: "3",
      type: "task_completed",
      title: "Task completed: Review proposal",
      description: "Due diligence task marked as complete",
      timestamp: "6 hours ago",
      user: {
        name: "Mike Johnson",
        avatar: null
      }
    },
    {
      id: "4",
      type: "document_uploaded",
      title: "Document uploaded: Financial Statement",
      description: "Q2 financial statement uploaded to GrowthEquity deal",
      timestamp: "1 day ago",
      user: {
        name: "Sarah Williams",
        avatar: null
      }
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deal_created':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'contact_added':
        return <UserPlus className="h-4 w-4 text-green-600" />
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'document_uploaded':
        return <FileText className="h-4 w-4 text-purple-600" />
      case 'message_sent':
        return <MessageSquare className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'deal_created':
        return "bg-blue-50 border-blue-200"
      case 'contact_added':
        return "bg-green-50 border-green-200"
      case 'task_completed':
        return "bg-green-50 border-green-200"
      case 'document_uploaded':
        return "bg-purple-50 border-purple-200"
      case 'message_sent':
        return "bg-orange-50 border-orange-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  return (
    <Card className={`shadow-lg border-border/50 hover:shadow-xl transition-all duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          Recent Activity
        </CardTitle>
        <CardDescription className="text-base">
          Latest updates and activities across the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className={`p-4 rounded-xl border ${getActivityColor(activity.type)} hover:shadow-md transition-all duration-200 group`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="p-2 rounded-lg bg-background/50 backdrop-blur-sm">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors">{activity.title}</h4>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {activity.timestamp} • {activity.user.name}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border/50">
          <Button variant="outline" size="sm" className="w-full hover:bg-primary/5 hover:border-primary/30 transition-all duration-200">
            <ExternalLink className="mr-2 h-4 w-4" />
            View All Activity
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}