"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Calendar,
  Loader2
} from "lucide-react"

interface GoogleCalendarSyncProps {
  onSyncChange?: (isEnabled: boolean) => void
}

interface SyncStatus {
  isEnabled: boolean
  lastSyncAt?: string
  syncDirection?: string
}

export function GoogleCalendarSync({ onSyncChange }: GoogleCalendarSyncProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isEnabled: false })
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchSyncStatus()
  }, [])

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch("/api/calendar/sync")
      if (response.ok) {
        const data = await response.json()
        setSyncStatus(data.googleSync)
      }
    } catch (error) {
      console.error("Failed to fetch sync status:", error)
    }
  }

  const handleToggleSync = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "toggle_sync", 
          enable: !syncStatus.isEnabled 
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSyncStatus(prev => ({ ...prev, isEnabled: !prev.isEnabled }))
        onSyncChange?.(!syncStatus.isEnabled)
        
        // If enabling, redirect to Google OAuth
        if (!syncStatus.isEnabled) {
          window.location.href = "/api/calendar/auth/google"
        }
      }
    } catch (error) {
      console.error("Failed to toggle sync:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "sync_events"
        }),
      })

      if (response.ok) {
        await fetchSyncStatus()
      }
    } catch (error) {
      console.error("Failed to sync events:", error)
    } finally {
      setSyncing(false)
    }
  }

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Sync
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to sync events and bookings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={syncStatus.isEnabled}
              onCheckedChange={handleToggleSync}
              disabled={loading}
            />
            <span className="font-medium">
              {syncStatus.isEnabled ? "Sync Enabled" : "Sync Disabled"}
            </span>
            {syncStatus.isEnabled && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
        </div>

        {/* Sync Details */}
        {syncStatus.isEnabled && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Last Sync:</span>
                <div className="font-medium">{formatLastSync(syncStatus.lastSyncAt)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Direction:</span>
                <div className="font-medium capitalize">
                  {syncStatus.syncDirection?.toLowerCase() || "bidirectional"}
                </div>
              </div>
            </div>

            {/* Sync Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncNow}
                disabled={syncing}
              >
                {syncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://calendar.google.com", "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Google Calendar
              </Button>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        {!syncStatus.isEnabled && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To enable Google Calendar sync, you'll need to authorize access to your Google account. 
              This will allow two-way synchronization between your CRM calendar and Google Calendar.
            </AlertDescription>
          </Alert>
        )}

        {/* Feature List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Sync Features:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Two-way event synchronization</li>
            <li>• Automatic booking imports</li>
            <li>• Real-time updates</li>
            <li>• Conflict detection</li>
            <li>• Multiple calendar support</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}