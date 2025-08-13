"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Settings, 
  Plus, 
  Trash2, 
  GripVertical, 
  Eye, 
  EyeOff,
  LayoutGrid,
  Save,
  X
} from "lucide-react"

// Import widget components
import { MetricsOverview } from "./widgets/metrics-overview"
import { RecentDeals } from "./widgets/recent-deals"
import { UpcomingTasks } from "./widgets/upcoming-tasks"
import { CalendarWidget } from "./widgets/calendar-widget"
import { RecentActivity } from "./widgets/recent-activity"

interface DashboardWidget {
  id: string
  widget_type: string
  position_x: number
  position_y: number
  width: number
  height: number
  is_visible: boolean
  widget_config?: any
}

interface DashboardGridProps {
  dashboard: {
    id: string
    layout_name: string
    is_active: boolean
    widgets: DashboardWidget[]
  }
  onDashboardUpdate: (dashboard: any) => void
  isCustomizing?: boolean
}

const widgetComponents = {
  METRICS_OVERVIEW: MetricsOverview,
  RECENT_DEALS: RecentDeals,
  UPCOMING_TASKS: UpcomingTasks,
  CALENDAR_WIDGET: CalendarWidget,
  RECENT_ACTIVITY: RecentActivity,
}

const widgetInfo = {
  METRICS_OVERVIEW: {
    name: "Metrics Overview",
    description: "Key performance indicators and metrics",
    defaultWidth: 8,
    defaultHeight: 3
  },
  RECENT_DEALS: {
    name: "Recent Deals",
    description: "Latest deal updates and activities",
    defaultWidth: 4,
    defaultHeight: 4
  },
  UPCOMING_TASKS: {
    name: "Upcoming Tasks",
    description: "Tasks requiring your attention",
    defaultWidth: 6,
    defaultHeight: 4
  },
  CALENDAR_WIDGET: {
    name: "Calendar",
    description: "Today's schedule and upcoming events",
    defaultWidth: 6,
    defaultHeight: 4
  },
  RECENT_ACTIVITY: {
    name: "Recent Activity",
    description: "Latest updates and activities across the system",
    defaultWidth: 12,
    defaultHeight: 3
  }
}

export function DashboardGrid({ dashboard, onDashboardUpdate, isCustomizing = false }: DashboardGridProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(dashboard.widgets)
  const [layoutName, setLayoutName] = useState(dashboard.layout_name)
  const [availableWidgets, setAvailableWidgets] = useState(Object.keys(widgetInfo).filter(type => 
    !widgets.some(w => w.widget_type === type)
  ))

  useEffect(() => {
    setWidgets(dashboard.widgets)
    setLayoutName(dashboard.layout_name)
  }, [dashboard])

  const renderWidget = (widget: DashboardWidget) => {
    const WidgetComponent = widgetComponents[widget.widget_type as keyof typeof widgetComponents]
    if (!WidgetComponent) return null

    return (
      <div
        id={`widget-${widget.id}`}
        className={`
          relative transition-all duration-300 ease-in-out
          ${isCustomizing ? 'cursor-move hover:shadow-xl hover:-translate-y-1' : 'hover:shadow-lg'}
          ${!widget.is_visible ? 'opacity-50' : ''}
          animate-in fade-in-50 duration-500
        `}
        style={{
          gridColumn: `span ${widget.width}`,
          gridRow: `span ${widget.height}`
        }}
      >
        {isCustomizing && (
          <div className="absolute top-3 right-3 z-10 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 bg-background/90 backdrop-blur-sm hover:bg-background border border-border/50 shadow-sm"
              onClick={() => toggleWidgetVisibility(widget.id)}
            >
              {widget.is_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 bg-background/90 backdrop-blur-sm hover:bg-background border border-border/50 shadow-sm text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => removeWidget(widget.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        {isCustomizing && (
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-background/90 backdrop-blur-sm border border-border/50 rounded p-1 shadow-sm">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}
        
        <WidgetComponent config={widget.widget_config} />
      </div>
    )
  }

  const addWidget = (widgetType: string) => {
    const info = widgetInfo[widgetType as keyof typeof widgetInfo]
    const newWidget: DashboardWidget = {
      id: Date.now().toString(),
      widget_type: widgetType,
      position_x: 0,
      position_y: widgets.length,
      width: info.defaultWidth,
      height: info.defaultHeight,
      is_visible: true
    }

    const updatedWidgets = [...widgets, newWidget]
    setWidgets(updatedWidgets)
    setAvailableWidgets(availableWidgets.filter(w => w !== widgetType))
    
    // Add a subtle animation feedback
    setTimeout(() => {
      const element = document.getElementById(`widget-${newWidget.id}`)
      if (element) {
        element.classList.add('animate-pulse')
        setTimeout(() => {
          element.classList.remove('animate-pulse')
        }, 1000)
      }
    }, 100)
  }

  const removeWidget = (widgetId: string) => {
    const widgetToRemove = widgets.find(w => w.id === widgetId)
    const updatedWidgets = widgets.filter(w => w.id !== widgetId)
    setWidgets(updatedWidgets)
    
    if (widgetToRemove) {
      setAvailableWidgets([...availableWidgets, widgetToRemove.widget_type])
    }
  }

  const toggleWidgetVisibility = (widgetId: string) => {
    const updatedWidgets = widgets.map(w => 
      w.id === widgetId ? { ...w, is_visible: !w.is_visible } : w
    )
    setWidgets(updatedWidgets)
  }

  const saveDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          layout_name,
          widgets: widgets
        })
      })

      if (response.ok) {
        onDashboardUpdate({
          ...dashboard,
          layout_name,
          widgets
        })
        
        // Visual feedback for successful save
        const saveButton = document.querySelector('button:has(.save-icon)')
        if (saveButton) {
          saveButton.classList.add('bg-green-500', 'hover:bg-green-600')
          setTimeout(() => {
            saveButton.classList.remove('bg-green-500', 'hover:bg-green-600')
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Failed to save dashboard:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {layoutName}
          </h1>
          <p className="text-muted-foreground text-lg">
            Your personalized workspace with {widgets.filter(w => w.is_visible).length} active widgets
          </p>
        </div>
        
        {isCustomizing && (
          <div className="flex items-center gap-2">
            <Input
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="w-64 shadow-sm"
              placeholder="Dashboard name"
            />
            <Button 
              onClick={saveDashboard}
              className="shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Save className="mr-2 h-4 w-4 save-icon" />
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {widgets.filter(w => w.is_visible).map(widget => renderWidget(widget))}
      </div>

      {/* Customization Panel */}
      {isCustomizing && (
        <Card className="shadow-lg border-border/50 backdrop-blur-sm bg-card/95">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <LayoutGrid className="h-5 w-5 text-primary" />
              Customize Dashboard
            </CardTitle>
            <CardDescription className="text-base">
              Add, remove, or rearrange widgets to create your perfect workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Available Widgets */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">Available Widgets</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableWidgets.map(widgetType => {
                  const info = widgetInfo[widgetType as keyof typeof widgetInfo]
                  return (
                    <Card 
                      key={widgetType} 
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/30 group"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                            {info.name}
                          </h4>
                          <Button 
                            size="sm" 
                            onClick={() => addWidget(widgetType)}
                            className="h-8 w-8 p-0 shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {info.description}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Hidden Widgets */}
            {widgets.some(w => !w.is_visible) && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">Hidden Widgets</Label>
                <div className="flex flex-wrap gap-2">
                  {widgets.filter(w => !w.is_visible).map(widget => (
                    <Badge 
                      key={widget.id} 
                      variant="outline" 
                      className="flex items-center gap-1 px-3 py-1.5 bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {widgetInfo[widget.widget_type as keyof typeof widgetInfo].name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 ml-1 hover:bg-primary/10 hover:text-primary"
                        onClick={() => toggleWidgetVisibility(widget.id)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-medium text-sm text-foreground">Tips:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Drag widgets to rearrange them (coming soon)</li>
                <li>Use the eye icon to show/hide widgets</li>
                <li>Remove widgets you don't need</li>
                <li>Click "Save" to persist your changes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}