import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's dashboard configuration
    let dashboard = await db.userDashboard.findUnique({
      where: { user_id: user.id },
      include: {
        dashboard_widgets: {
          orderBy: [
            { position_y: 'asc' },
            { position_x: 'asc' }
          ]
        }
      }
    })

    // If no dashboard exists, create default one
    if (!dashboard) {
      dashboard = await createDefaultDashboard(user.id)
    }

    return NextResponse.json({
      dashboard: {
        id: dashboard.id,
        layout_name: dashboard.layout_name,
        is_active: dashboard.is_active,
        widgets: dashboard.dashboard_widgets.map(widget => ({
          id: widget.id,
          widget_type: widget.widget_type,
          position_x: widget.position_x,
          position_y: widget.position_y,
          width: widget.width,
          height: widget.height,
          is_visible: widget.is_visible,
          widget_config: widget.widget_config ? JSON.parse(widget.widget_config) : null
        }))
      }
    })

  } catch (error) {
    console.error("Error fetching dashboard:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { widgets, layout_name } = await request.json()

    // Update or create dashboard
    const dashboard = await db.userDashboard.upsert({
      where: { user_id: user.id },
      update: {
        layout_name: layout_name || "My Dashboard",
        updated_at: new Date()
      },
      create: {
        user_id: user.id,
        layout_name: layout_name || "My Dashboard"
      }
    })

    // Clear existing widgets
    await db.dashboardWidget.deleteMany({
      where: { dashboard_id: dashboard.id }
    })

    // Create new widgets
    if (widgets && Array.isArray(widgets)) {
      for (const widget of widgets) {
        await db.dashboardWidget.create({
          data: {
            dashboard_id: dashboard.id,
            widget_type: widget.widget_type,
            position_x: widget.position_x || 0,
            position_y: widget.position_y || 0,
            width: widget.width || 4,
            height: widget.height || 3,
            is_visible: widget.is_visible !== false,
            widget_config: widget.widget_config ? JSON.stringify(widget.widget_config) : null
          }
        })
      }
    }

    return NextResponse.json({
      message: "Dashboard updated successfully",
      dashboard: {
        id: dashboard.id,
        layout_name: dashboard.layout_name,
        is_active: dashboard.is_active
      }
    })

  } catch (error) {
    console.error("Error updating dashboard:", error)
    return NextResponse.json(
      { error: "Failed to update dashboard" },
      { status: 500 }
    )
  }
}

async function createDefaultDashboard(userId: string) {
  const dashboard = await db.userDashboard.create({
    data: {
      user_id: userId,
      layout_name: "Default Dashboard"
    }
  })

  // Create default widgets
  const defaultWidgets = [
    { widget_type: "METRICS_OVERVIEW", position_x: 0, position_y: 0, width: 8, height: 3 },
    { widget_type: "RECENT_DEALS", position_x: 8, position_y: 0, width: 4, height: 4 },
    { widget_type: "UPCOMING_TASKS", position_x: 0, position_y: 3, width: 6, height: 4 },
    { widget_type: "CALENDAR_WIDGET", position_x: 6, position_y: 3, width: 6, height: 4 },
    { widget_type: "RECENT_ACTIVITY", position_x: 0, position_y: 7, width: 12, height: 3 }
  ]

  for (const widget of defaultWidgets) {
    await db.dashboardWidget.create({
      data: {
        dashboard_id: dashboard.id,
        ...widget
      }
    })
  }

  return db.userDashboard.findUnique({
    where: { id: dashboard.id },
    include: {
      dashboard_widgets: {
        orderBy: [
          { position_y: 'asc' },
          { position_x: 'asc' }
        ]
      }
    }
  })
}