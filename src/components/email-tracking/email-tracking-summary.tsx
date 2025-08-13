import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MailOpen, 
  TrendingUp, 
  Eye,
  Clock,
  MapPin,
  Smartphone,
  Monitor,
  Tablet
} from "lucide-react"

interface EmailTrackingSummary {
  total_emails: number
  opened_emails: number
  total_opens: number
  open_rate: number
  recent_activity?: Array<{
    subject: string
    recipient_email: string
    opened_at?: string
    open_count: number
    device_type?: string
    location?: string
  }>
}

interface EmailTrackingSummaryProps {
  dealId?: string
  contactId?: string
  showDetails?: boolean
}

export function EmailTrackingSummary({ dealId, contactId, showDetails = false }: EmailTrackingSummaryProps) {
  const [summary, setSummary] = useState<EmailTrackingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetchEmailTrackingSummary()
  }, [dealId, contactId])

  const fetchEmailTrackingSummary = async () => {
    try {
      const params = new URLSearchParams()
      if (dealId) params.append('dealId', dealId)
      if (contactId) params.append('contactId', contactId)

      const response = await fetch(`/api/email-tracking/analytics?${params}&days=30`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("Failed to fetch email tracking summary:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-3 w-3" />
      case 'tablet':
        return <Tablet className="h-3 w-3" />
      default:
        return <Monitor className="h-3 w-3" />
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailOpen className="h-4 w-4" />
            Email Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailOpen className="h-4 w-4" />
            Email Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">No email tracking data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MailOpen className="h-4 w-4" />
          Email Tracking
        </CardTitle>
        <CardDescription>
          Email engagement metrics and activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.total_emails}</div>
            <div className="text-xs text-muted-foreground">Total Emails</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.open_rate}%</div>
            <div className="text-xs text-muted-foreground">Open Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold">{summary.opened_emails}</div>
            <div className="text-xs text-muted-foreground">Opened</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{summary.total_opens}</div>
            <div className="text-xs text-muted-foreground">Total Opens</div>
          </div>
        </div>

        {showDetails && summary.recent_activity && (
          <>
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Recent Activity</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Show Less" : "Show More"}
              </Button>
            </div>
            
            <div className="space-y-2">
              {summary.recent_activity.slice(0, expanded ? 10 : 3).map((activity, index) => (
                <div key={index} className="p-2 border rounded text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{activity.subject}</span>
                    <Badge variant={activity.opened_at ? "default" : "secondary"} className="text-xs">
                      {activity.opened_at ? "Opened" : "Sent"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    To: {activity.recipient_email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    {activity.opened_at && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatDateTime(activity.opened_at)}
                      </span>
                    )}
                    {activity.device_type && (
                      <span className="flex items-center gap-1">
                        {getDeviceIcon(activity.device_type)}
                        {activity.device_type}
                      </span>
                    )}
                    {activity.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activity.location}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Opens: {activity.open_count}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="pt-2 border-t">
          <Button variant="outline" size="sm" className="w-full" onClick={fetchEmailTrackingSummary}>
            <TrendingUp className="h-3 w-3 mr-2" />
            Refresh Data
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}