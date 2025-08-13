"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Video, MapPin, Plus } from "lucide-react"

interface CalendarWidgetProps {
  config?: any
  className?: string
}

export function CalendarWidget({ config, className }: CalendarWidgetProps) {
  // Mock data - in real implementation, this would come from API
  const events = [
    {
      id: "1",
      title: "Team Standup",
      time: "09:00 AM",
      duration: "30 min",
      type: "meeting",
      location: "Conference Room A"
    },
    {
      id: "2",
      title: "Client Call - TechCorp",
      time: "11:00 AM", 
      duration: "1 hour",
      type: "call",
      hasMeet: true
    },
    {
      id: "3",
      title: "Lunch with Sarah",
      time: "12:30 PM",
      duration: "1 hour",
      type: "personal"
    },
    {
      id: "4",
      title: "Product Demo",
      time: "2:00 PM",
      duration: "45 min", 
      type: "demo",
      location: "Virtual"
    }
  ]

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Calendar className="h-4 w-4" />
      case 'call':
        return <Video className="h-4 w-4" />
      case 'demo':
        return <MapPin className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return "bg-blue-50 border-blue-200"
      case 'call':
        return "bg-green-50 border-green-200"
      case 'demo':
        return "bg-purple-50 border-purple-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  return (
    <Card className={`shadow-lg border-border/50 hover:shadow-xl transition-all duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          Calendar
        </CardTitle>
        <CardDescription className="text-base">
          Today's schedule and upcoming events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event) => (
            <div 
              key={event.id} 
              className={`p-4 rounded-xl border ${getEventColor(event.type)} hover:shadow-md transition-all duration-200 group`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-background/50 backdrop-blur-sm">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{event.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-background/50 px-2 py-1 rounded-md">
                        <Clock className="h-3 w-3" />
                        <span>{event.time} ({event.duration})</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1 bg-background/50 px-2 py-1 rounded-md">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.hasMeet && (
                        <div className="flex items-center gap-1 bg-background/50 px-2 py-1 rounded-md">
                          <Video className="h-3 w-3" />
                          <span>Google Meet</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
          <Button variant="outline" size="sm" className="w-full hover:bg-primary/5 hover:border-primary/30 transition-all duration-200">
            <Calendar className="mr-2 h-4 w-4" />
            View Full Calendar
          </Button>
          <Button size="sm" className="w-full shadow-sm hover:shadow-md transition-all duration-200">
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}