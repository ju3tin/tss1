import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MailOpen, 
  Clock, 
  MapPin, 
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  Eye,
  Calendar
} from "lucide-react"

interface EmailTracking {
  id: string
  email_id: string
  recipient_email: string
  subject: string
  sent_at: string
  opened_at?: string
  open_count: number
  last_opened_at?: string
  ip_address?: string
  user_agent?: string
  device_type?: string
  location?: string
  associated_deal?: {
    id: string
    deal_name: string
    stage: string
  }
}

interface EmailTrackingStats {
  total_emails: number
  opened_emails: number
  total_opens: number
  open_rate: number
  avg_opens_per_email: number
  recent_activity: EmailTracking[]
}

interface ContactEmailTrackingProps {
  contactId: string
}

export function ContactEmailTracking({ contactId }: ContactEmailTrackingProps) {
  const [stats, setStats] = useState<EmailTrackingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetchEmailTrackingStats()
  }, [contactId])

  const fetchEmailTrackingStats = async () => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/email-tracking`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch email tracking stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailOpen className="h-5 w-5" />
            Email Communications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading email tracking data...</div>
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.total_emails === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailOpen className="h-5 w-5" />
            Email Communications
          </CardTitle>
          <CardDescription>
            Track email engagement and communications with this contact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MailOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No email communications tracked yet</p>
            <p className="text-sm">Email tracking will automatically appear when emails are sent to this contact.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MailOpen className="h-5 w-5" />
          Email Communications
        </CardTitle>
        <CardDescription>
          Email engagement tracking and communication history
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_emails}</div>
            <div className="text-sm text-muted-foreground">Emails Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.opened_emails}</div>
            <div className="text-sm text-muted-foreground">Opened</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.open_rate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Open Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.avg_opens_per_email.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Avg Opens</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Recent Email Activity</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show Less" : "Show All"}
            </Button>
          </div>

          <div className="space-y-3">
            {stats.recent_activity
              .slice(0, expanded ? undefined : 3)
              .map((email) => (
                <div key={email.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{email.subject}</h4>
                      {email.opened_at ? (
                        <Badge variant="default" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Opened
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Sent
                        </Badge>
                      )}
                    </div>
                    
                    {email.associated_deal && (
                      <div className="text-sm text-muted-foreground mb-1">
                        Deal: {email.associated_deal.deal_name}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatRelativeTime(email.sent_at)}
                      </span>
                      
                      {email.opened_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Opened {formatRelativeTime(email.opened_at)}
                        </span>
                      )}
                      
                      {email.device_type && (
                        <span className="flex items-center gap-1">
                          {getDeviceIcon(email.device_type)}
                          {email.device_type}
                        </span>
                      )}
                      
                      {email.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {email.location}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold">{email.open_count}</div>
                    <div className="text-xs text-muted-foreground">opens</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}