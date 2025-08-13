import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"
import { 
  MailOpen, 
  Users, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Smartphone,
  Monitor,
  Tablet
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
  associated_contact?: {
    id: string
    full_name: string
    email: string
  }
}

interface EmailAnalytics {
  summary: {
    total_emails: number
    opened_emails: number
    total_opens: number
    open_rate: number
    avg_opens_per_email: number
  }
  device_stats: Array<{
    device_type: string
    emails_opened: number
    total_opens: number
  }>
  location_stats: Array<{
    location: string
    emails_opened: number
    total_opens: number
  }>
  hourly_stats: Array<{
    hour: number
    opens: number
  }>
  top_emails: Array<{
    id: string
    subject: string
    recipient_email: string
    open_count: number
    opened_at?: string
    deal?: {
      id: string
      deal_name: string
    }
    contact?: {
      id: string
      full_name: string
      email: string
    }
  }>
}

interface EmailTrackingDashboardProps {
  dealId?: string
  contactId?: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function EmailTrackingDashboard({ dealId, contactId }: EmailTrackingDashboardProps) {
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null)
  const [emailTrackings, setEmailTrackings] = useState<EmailTracking[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")

  useEffect(() => {
    fetchAnalytics()
    fetchEmailTrackings()
  }, [dealId, contactId, timeRange])

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams()
      if (dealId) params.append('dealId', dealId)
      if (contactId) params.append('contactId', contactId)
      params.append('days', timeRange)

      const response = await fetch(`/api/email-tracking/analytics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    }
  }

  const fetchEmailTrackings = async () => {
    try {
      const params = new URLSearchParams()
      if (dealId) params.append('dealId', dealId)
      if (contactId) params.append('contactId', contactId)

      const response = await fetch(`/api/email-tracking?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEmailTrackings(data)
      }
    } catch (error) {
      console.error("Failed to fetch email trackings:", error)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading email tracking data...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">No analytics data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Tracking Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor email engagement and track customer interactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { fetchAnalytics(); fetchEmailTrackings(); }}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <MailOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.total_emails}</div>
            <p className="text-xs text-muted-foreground">
              Emails sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opened Emails</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.opened_emails}</div>
            <p className="text-xs text-muted-foreground">
              Unique opens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.open_rate}%</div>
            <p className="text-xs text-muted-foreground">
              Engagement rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Opens</CardTitle>
            <MailOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.total_opens}</div>
            <p className="text-xs text-muted-foreground">
              Including re-opens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Opens/Email</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.avg_opens_per_email}</div>
            <p className="text-xs text-muted-foreground">
              Per opened email
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Device Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Device Type Distribution</CardTitle>
            <CardDescription>Email opens by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.device_stats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ device_type, emails_opened }) => `${device_type}: ${emails_opened}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="emails_opened"
                >
                  {analytics.device_stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Open Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly Open Pattern</CardTitle>
            <CardDescription>Email opens by hour of day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.hourly_stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="opens" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Emails */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Emails</CardTitle>
          <CardDescription>Emails with the highest engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.top_emails.slice(0, 10).map((email, index) => (
              <div key={email.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <h4 className="font-medium">{email.subject}</h4>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    To: {email.recipient_email}
                    {email.deal && (
                      <span className="ml-2">• Deal: {email.deal.deal_name}</span>
                    )}
                  </div>
                  {email.opened_at && (
                    <div className="text-xs text-muted-foreground">
                      First opened: {formatDateTime(email.opened_at)}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{email.open_count}</div>
                  <div className="text-xs text-muted-foreground">opens</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Email Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Email Activity</CardTitle>
          <CardDescription>Latest email tracking events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emailTrackings.slice(0, 20).map((tracking) => (
              <div key={tracking.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{tracking.subject}</h4>
                    {tracking.opened_at ? (
                      <Badge variant="default" className="text-xs">
                        Opened
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Not Opened
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    To: {tracking.recipient_email}
                    {tracking.associated_deal && (
                      <span className="ml-2">• Deal: {tracking.associated_deal.deal_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>Sent: {formatDateTime(tracking.sent_at)}</span>
                    {tracking.opened_at && (
                      <span>Opened: {formatDateTime(tracking.opened_at)}</span>
                    )}
                    {tracking.device_type && (
                      <span className="flex items-center gap-1">
                        {getDeviceIcon(tracking.device_type)}
                        {tracking.device_type}
                      </span>
                    )}
                    {tracking.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {tracking.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{tracking.open_count}</div>
                  <div className="text-xs text-muted-foreground">total opens</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}