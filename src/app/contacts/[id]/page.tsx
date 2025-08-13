"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  MapPin,
  Edit,
  ArrowLeft,
  User,
  Briefcase
} from "lucide-react"
import { ContactEmailTracking } from "@/components/contacts/contact-email-tracking"
import { ContactBookings } from "@/components/contacts/contact-bookings"
import { useSession } from "next-auth/react"

interface Contact {
  id: string
  full_name: string
  email: string
  phone_number?: string
  investor_type: string
  source?: string
  created_at: string
  updated_at: string
  associated_company?: {
    id: string
    name: string
    company_type: string
  }
}

interface Deal {
  id: string
  deal_name: string
  stage: string
  created_at: string
  expected_close_date?: string
  deal_value?: number
}

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const contactId = params.id as string
  
  const [contact, setContact] = useState<Contact | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    
    if (contactId) {
      fetchContactDetails()
      fetchContactDeals()
    }
  }, [contactId, session, status, router])

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

  const fetchContactDetails = async () => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`)
      if (response.ok) {
        const data = await response.json()
        setContact(data)
      }
    } catch (error) {
      console.error("Failed to fetch contact details:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchContactDeals = async () => {
    try {
      const response = await fetch(`/api/deals?contactId=${contactId}`)
      if (response.ok) {
        const data = await response.json()
        setDeals(data)
      }
    } catch (error) {
      console.error("Failed to fetch contact deals:", error)
    }
  }

  const getInvestorTypeBadgeColor = (type: string) => {
    switch (type) {
      case "INDIVIDUAL":
        return "default"
      case "FAMILY_OFFICE":
        return "secondary"
      case "INSTITUTIONAL":
        return "destructive"
      case "PROJECT_FUND":
        return "outline"
      default:
        return "outline"
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading contact details...</div>
        </div>
      </MainLayout>
    )
  }

  if (!contact) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Contact not found</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/contacts")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contacts
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{contact.full_name}</h1>
              <p className="text-muted-foreground">
                Contact details and communications history
              </p>
            </div>
          </div>
          <Button onClick={() => router.push(`/contacts/${contactId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Contact
          </Button>
        </div>

        {/* Contact Information */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{contact.email}</p>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                </div>
              </div>
              
              {contact.phone_number && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{contact.phone_number}</p>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Badge variant={getInvestorTypeBadgeColor(contact.investor_type)}>
                    {contact.investor_type.replace("_", " ")}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">Investor Type</p>
                </div>
              </div>
              
              {contact.source && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{contact.source}</p>
                    <p className="text-sm text-muted-foreground">Source</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formatDateTime(contact.created_at)}</p>
                  <p className="text-sm text-muted-foreground">Added Date</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          {contact.associated_company && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{contact.associated_company.name}</p>
                    <p className="text-sm text-muted-foreground">Company Name</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Badge variant="outline">
                      {contact.associated_company.company_type.replace("_", " ")}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">Company Type</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Email Tracking */}
        <ContactEmailTracking contactId={contactId} />

        {/* Meeting History */}
        <ContactBookings contactId={contactId} />

        {/* Associated Deals */}
        <Card>
          <CardHeader>
            <CardTitle>Associated Deals</CardTitle>
            <CardDescription>
              Deals associated with this contact
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deals.length > 0 ? (
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{deal.deal_name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Stage: {deal.stage.replace('_', ' ')}</span>
                        {deal.expected_close_date && (
                          <span>Expected Close: {formatDateTime(deal.expected_close_date)}</span>
                        )}
                        {deal.deal_value && (
                          <span>Value: {formatCurrency(deal.deal_value)}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">{deal.stage.replace('_', ' ')}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No deals associated with this contact</p>
                <Button className="mt-2" onClick={() => router.push("/deals")}>
                  Create Deal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}