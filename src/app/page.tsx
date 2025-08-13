"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2, Settings } from "lucide-react"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"

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

interface DashboardData {
  id: string
  layout_name: string
  is_active: boolean
  widgets: DashboardWidget[]
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCustomizing, setIsCustomizing] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    
    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard")
      if (response.ok) {
        const data = await response.json()
        setDashboard(data.dashboard)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDashboardUpdate = (updatedDashboard: DashboardData) => {
    setDashboard(updatedDashboard)
    setIsCustomizing(false)
  }

  if (status === "loading" || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </MainLayout>
    )
  }

  if (!session) {
    return null
  }

  if (!dashboard) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Failed to load dashboard</p>
            <Button onClick={fetchDashboardData}>Retry</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Welcome back! Here's your personalized workspace.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={isCustomizing ? "default" : "outline"}
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Settings className="mr-2 h-4 w-4" />
              {isCustomizing ? "Done Customizing" : "Customize Dashboard"}
            </Button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="animate-in fade-in-50 duration-300">
          <DashboardGrid
            dashboard={dashboard}
            onDashboardUpdate={handleDashboardUpdate}
            isCustomizing={isCustomizing}
          />
        </div>
      </div>
    </MainLayout>
  )
}