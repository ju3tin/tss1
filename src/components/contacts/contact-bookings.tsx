"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  Clock3
} from "lucide-react"

interface Booking {
  id: string
  guest_name: string
  guest_email: string
  guest_phone?: string
  start_time: string
  end_time: string
  status: string
  notes?: string
  availability: {
    name: string
    duration_minutes: number
    user: {
      first_name: string
      last_name: string
    }
  }
}

interface ContactBookingsProps {
  contactId: string
}

export function ContactBookings({ contactId }: ContactBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContactBookings()
  }, [contactId])

  const fetchContactBookings = async () => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/bookings`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error("Failed to fetch contact bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary"><Clock3 className="w-3 h-3 mr-1" />Pending</Badge>
      case "CONFIRMED":
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>
      case "CANCELLED":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
      case "COMPLETED":
        return <Badge variant="outline"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case "NO_SHOW":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />No Show</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
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
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meeting History</CardTitle>
          <CardDescription>Loading booking history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Meeting History
        </CardTitle>
        <CardDescription>
          Scheduled meetings and appointments with this contact
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{booking.availability.name}</h4>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      with {booking.availability.user.first_name} {booking.availability.user.last_name}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {formatRelativeTime(booking.start_time)}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDateTime(booking.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.availability.duration_minutes} minutes</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.guest_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.guest_email}</span>
                    </div>
                    {booking.guest_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.guest_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {booking.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      <strong>Notes:</strong> {booking.notes}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {booking.status === "PENDING" && (
                    <Button size="sm" variant="outline">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Confirm
                    </Button>
                  )}
                  {booking.status === "CONFIRMED" && (
                    <>
                      <Button size="sm" variant="outline">
                        <Video className="w-4 h-4 mr-1" />
                        Join Meeting
                      </Button>
                      <Button size="sm" variant="outline">
                        <MapPin className="w-4 h-4 mr-1" />
                        Get Directions
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost">
                    Reschedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No meetings scheduled with this contact</p>
            <p className="text-sm mt-1">Book a meeting to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}