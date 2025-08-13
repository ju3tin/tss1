"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, AlertTriangle, Calendar, MoreHorizontal } from "lucide-react"

interface UpcomingTasksProps {
  config?: any
  className?: string
}

export function UpcomingTasks({ config, className }: UpcomingTasksProps) {
  // Mock data - in real implementation, this would come from API
  const tasks = [
    {
      id: "1",
      title: "Review TechCorp proposal",
      dueDate: "2025-08-11",
      priority: "HIGH",
      status: "PENDING",
      assignedTo: "You"
    },
    {
      id: "2",
      title: "Call with StartupSeed CEO",
      dueDate: "2025-08-12", 
      priority: "MEDIUM",
      status: "PENDING",
      assignedTo: "You"
    },
    {
      id: "3",
      title: "Due diligence documents",
      dueDate: "2025-08-15",
      priority: "HIGH", 
      status: "IN_PROGRESS",
      assignedTo: "You"
    }
  ]

  const priorityColors = {
    LOW: "bg-green-100 text-green-800 border-green-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200", 
    HIGH: "bg-red-100 text-red-800 border-red-200",
    URGENT: "bg-red-200 text-red-900 border-red-300"
  }

  const statusIcons = {
    PENDING: Clock,
    IN_PROGRESS: AlertTriangle,
    COMPLETED: CheckCircle,
    OVERDUE: AlertTriangle
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <Card className={`shadow-lg border-border/50 hover:shadow-xl transition-all duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          Upcoming Tasks
        </CardTitle>
        <CardDescription className="text-base">
          Tasks requiring your attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => {
            const StatusIcon = statusIcons[task.status as keyof typeof statusIcons]
            return (
              <div key={task.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 group">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-md bg-muted/50">
                      <StatusIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{task.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {task.priority}
                    </Badge>
                    <div className="text-xs font-medium text-muted-foreground">
                      Due {formatDate(task.dueDate)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Assigned to {task.assignedTo}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-border/50">
          <Button variant="outline" size="sm" className="w-full hover:bg-primary/5 hover:border-primary/30 transition-all duration-200">
            View All Tasks
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}