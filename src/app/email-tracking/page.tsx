"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmailTrackingDashboard } from "@/components/email-tracking/email-tracking-dashboard"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  MailOpen, 
  TrendingUp, 
  Filter,
  RefreshCw,
  BarChart3,
  Users,
  MapPin,
  Clock
} from "lucide-react"

interface Deal {
  id: string
  deal_name: string
  stage: string
}

interface Contact {
  id: string
  full_name: string
  email: string
}

export default function EmailTrackingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [deals, setDeals] = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedDeal, setSelectedDeal] = useState<string>("")
  const [selectedContact, setSelectedContact] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    
    fetchDeals()
    fetchContacts()
  }, [session, status, router])

  if (status === "loading") {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </MainLayout>
    )
  }

  if (!session) {
    return null
  }

  const fetchDeals = async () => {
    try {
      const response = await fetch("/api/deals")
      if (response.ok) {
        const data = await response.json()
        setDeals(data)
      }
    } catch (error) {
      console.error("Failed to fetch deals:", error)
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts")
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedDeal("")
    setSelectedContact("")
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Tracking</h1>
            <p className="text-muted-foreground">
              Monitor email engagement and track customer interactions across your CRM
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter email tracking data by specific deals or contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter by Deal</label>
                <Select value={selectedDeal} onValueChange={setSelectedDeal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a deal (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Deals</SelectItem>
                    {deals.map((deal) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.deal_name} ({deal.stage.replace('_', ' ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter by Contact</label>
                <Select value={selectedContact} onValueChange={setSelectedContact}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Contacts</SelectItem>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.full_name} ({contact.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {(selectedDeal || selectedContact) && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Active Filters:</span>
                  {selectedDeal && (
                    <Badge variant="secondary">
                      Deal: {deals.find(d => d.id === selectedDeal)?.deal_name}
                    </Badge>
                  )}
                  {selectedContact && (
                    <Badge variant="secondary">
                      Contact: {contacts.find(c => c.id === selectedContact)?.full_name}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Tracking Dashboard */}
        <EmailTrackingDashboard 
          dealId={selectedDeal || undefined} 
          contactId={selectedContact || undefined} 
        />

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tracked Emails</CardTitle>
              <MailOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deals.length}</div>
              <p className="text-xs text-muted-foreground">
                Active deals with tracking
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contacts.length}</div>
              <p className="text-xs text-muted-foreground">
                In email tracking system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tracking Coverage</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100%</div>
              <p className="text-xs text-muted-foreground">
                All emails tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Real-time Data</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Live</div>
              <p className="text-xs text-muted-foreground">
                Instant open tracking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Email Tracking Features</CardTitle>
            <CardDescription>
              Comprehensive email engagement tracking and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <MailOpen className="h-4 w-4" />
                  Open Tracking
                </h4>
                <p className="text-sm text-muted-foreground">
                  Track when emails are opened with invisible tracking pixels
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Engagement Analytics
                </h4>
                <p className="text-sm text-muted-foreground">
                  Detailed analytics on open rates, times, and patterns
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location Tracking
                </h4>
                <p className="text-sm text-muted-foreground">
                  Geographic data on where emails are being opened
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Device Detection
                </h4>
                <p className="text-sm text-muted-foreground">
                  Track which devices (mobile, desktop, tablet) are used
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Real-time Reports
                </h4>
                <p className="text-sm text-muted-foreground">
                  Live dashboards with up-to-the-minute data
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time-based Analysis
                </h4>
                <p className="text-sm text-muted-foreground">
                  Optimal sending times based on engagement patterns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}