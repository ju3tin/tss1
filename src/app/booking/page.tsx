"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { 
  Calendar, 
  Clock, 
  Link, 
  Plus, 
  Copy, 
  ExternalLink,
  Loader2,
  Trash2,
  Edit
} from "lucide-react"

interface BookingAvailability {
  id: string
  name: string
  description?: string
  duration_minutes: number
  buffer_minutes: number
  booking_link: string
  is_active: boolean
  timezone: string
  created_at: string
  availability_rules: AvailabilityRule[]
  bookings: Booking[]
}

interface AvailabilityRule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

interface Booking {
  id: string
  guest_name: string
  guest_email: string
  start_time: string
  end_time: string
  status: string
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function BookingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [availabilities, setAvailabilities] = useState<BookingAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAvailability, setEditingAvailability] = useState<BookingAvailability | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 30,
    buffer_minutes: 15,
    timezone: "UTC",
    rules: [
      { day_of_week: 1, start_time: "09:00", end_time: "17:00", is_available: true },
      { day_of_week: 2, start_time: "09:00", end_time: "17:00", is_available: true },
      { day_of_week: 3, start_time: "09:00", end_time: "17:00", is_available: true },
      { day_of_week: 4, start_time: "09:00", end_time: "17:00", is_available: true },
      { day_of_week: 5, start_time: "09:00", end_time: "17:00", is_available: true },
    ]
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    
    fetchAvailabilities()
  }, [session, status, router])

  const fetchAvailabilities = async () => {
    try {
      const response = await fetch("/api/booking/availability")
      if (response.ok) {
        const data = await response.json()
        setAvailabilities(data)
      }
    } catch (error) {
      console.error("Failed to fetch availabilities:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log("Submitting form data:", formData)
    
    try {
      const url = editingAvailability 
        ? `/api/booking/availability/${editingAvailability.id}`
        : "/api/booking/availability"
      
      const method = editingAvailability ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      console.log("Response status:", response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        alert(`Error: ${errorData.error || 'Failed to save availability'}`)
        return
      }

      if (response.ok) {
        await fetchAvailabilities()
        setShowCreateForm(false)
        setEditingAvailability(null)
        setFormData({
          name: "",
          description: "",
          duration_minutes: 30,
          buffer_minutes: 15,
          timezone: "UTC",
          rules: [
            { day_of_week: 1, start_time: "09:00", end_time: "17:00", is_available: true },
            { day_of_week: 2, start_time: "09:00", end_time: "17:00", is_available: true },
            { day_of_week: 3, start_time: "09:00", end_time: "17:00", is_available: true },
            { day_of_week: 4, start_time: "09:00", end_time: "17:00", is_available: true },
            { day_of_week: 5, start_time: "09:00", end_time: "17:00", is_available: true },
          ]
        })
      }
    } catch (error) {
      console.error("Failed to save availability:", error)
      alert("Failed to save availability. Please try again.")
    }
  }

  const handleEdit = (availability: BookingAvailability) => {
    setEditingAvailability(availability)
    setFormData({
      name: availability.name,
      description: availability.description || "",
      duration_minutes: availability.duration_minutes,
      buffer_minutes: availability.buffer_minutes,
      timezone: availability.timezone,
      rules: availability.availability_rules
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this availability?")) return
    
    try {
      const response = await fetch(`/api/booking/availability/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchAvailabilities()
      }
    } catch (error) {
      console.error("Failed to delete availability:", error)
    }
  }

  const copyBookingLink = (link: string) => {
    const fullUrl = `${window.location.origin}/book/${link}`
    navigator.clipboard.writeText(fullUrl)
    alert("Booking link copied to clipboard!")
  }

  const toggleAvailability = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/booking/availability/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (response.ok) {
        await fetchAvailabilities()
      }
    } catch (error) {
      console.error("Failed to toggle availability:", error)
    }
  }

  const formatDayRules = (rules: AvailabilityRule[]) => {
    const availableDays = rules
      .filter(rule => rule.is_available)
      .map(rule => dayNames[rule.day_of_week])
    
    if (availableDays.length === 0) return "No availability set"
    
    return availableDays.join(", ")
  }

  if (status === "loading" || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading booking system...</span>
        </div>
      </MainLayout>
    )
  }

  if (!session) {
    return null
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Booking System</h1>
            <p className="text-muted-foreground">
              Manage your availability and let others book time with you.
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Availability
          </Button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingAvailability ? "Edit Availability" : "Create New Availability"}
              </CardTitle>
              <CardDescription>
                Set up your availability settings for booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., 30-minute consultation"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={formData.timezone} 
                      onValueChange={(value) => {
                        console.log("Timezone changed to:", value)
                        setFormData({ ...formData, timezone: value })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this booking is for..."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      min="15"
                      max="240"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="buffer">Buffer time (minutes)</Label>
                    <Input
                      id="buffer"
                      type="number"
                      value={formData.buffer_minutes}
                      onChange={(e) => setFormData({ ...formData, buffer_minutes: parseInt(e.target.value) })}
                      min="0"
                      max="120"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Availability Rules</Label>
                  <div className="space-y-4 mt-2">
                    {formData.rules.map((rule, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.is_available}
                            onCheckedChange={(checked) => {
                              const newRules = [...formData.rules]
                              newRules[index].is_available = checked
                              console.log("Rule availability changed:", newRules)
                              setFormData({ ...formData, rules: newRules })
                            }}
                          />
                          <span className="font-medium">{dayNames[rule.day_of_week]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={rule.start_time}
                            onChange={(e) => {
                              const newRules = [...formData.rules]
                              newRules[index].start_time = e.target.value
                              console.log("Start time changed:", newRules)
                              setFormData({ ...formData, rules: newRules })
                            }}
                            disabled={!rule.is_available}
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={rule.end_time}
                            onChange={(e) => {
                              const newRules = [...formData.rules]
                              newRules[index].end_time = e.target.value
                              console.log("End time changed:", newRules)
                              setFormData({ ...formData, rules: newRules })
                            }}
                            disabled={!rule.is_available}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingAvailability ? "Update Availability" : "Create Availability"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingAvailability(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Availability List */}
        <div className="grid gap-6">
          {availabilities.length > 0 ? (
            availabilities.map((availability) => (
              <Card key={availability.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {availability.name}
                        <Badge variant={availability.is_active ? "default" : "secondary"}>
                          {availability.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      {availability.description && (
                        <CardDescription>{availability.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={availability.is_active}
                        onCheckedChange={(checked) => toggleAvailability(availability.id, checked)}
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(availability)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDelete(availability.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Duration
                      </div>
                      <p className="font-medium">{availability.duration_minutes} minutes</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Available Days
                      </div>
                      <p className="font-medium">{formatDayRules(availability.availability_rules)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link className="h-4 w-4" />
                        Booking Link
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {window.location.origin}/book/{availability.booking_link}
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyBookingLink(availability.booking_link)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`/book/${availability.booking_link}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {availability.bookings.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-2">Recent Bookings</div>
                      <div className="space-y-2">
                        {availability.bookings.slice(0, 3).map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div>
                              <p className="font-medium">{booking.guest_name}</p>
                              <p className="text-sm text-muted-foreground">{booking.guest_email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">{new Date(booking.start_time).toLocaleString()}</p>
                              <Badge variant="secondary">{booking.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No availability set up</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first availability to start accepting bookings.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Availability
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  )
}