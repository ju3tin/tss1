"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  CheckCircle,
  Loader2,
  CalendarDays
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
  availability_rules: AvailabilityRule[]
}

interface AvailabilityRule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

interface TimeSlot {
  start: Date
  end: Date
  available: boolean
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function PublicBookingPage() {
  const router = useRouter()
  const params = useParams()
  const bookingLink = params.bookingLink as string
  
  const [availability, setAvailability] = useState<BookingAvailability | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingSubmitted, setBookingSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    notes: ""
  })

  useEffect(() => {
    if (bookingLink) {
      fetchAvailability()
    }
  }, [bookingLink])

  const fetchAvailability = async () => {
    try {
      const response = await fetch(`/api/booking/public/${bookingLink}`)
      if (response.ok) {
        const data = await response.json()
        setAvailability(data)
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Failed to fetch availability:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSlots = (date: Date) => {
    if (!availability) return []
    
    const dayOfWeek = date.getDay()
    const rules = availability.availability_rules.filter(rule => 
      rule.day_of_week === dayOfWeek && rule.is_available
    )
    
    if (rules.length === 0) return []
    
    const slots: TimeSlot[] = []
    const now = new Date()
    
    rules.forEach(rule => {
      const [startHour, startMinute] = rule.start_time.split(':').map(Number)
      const [endHour, endMinute] = rule.end_time.split(':').map(Number)
      
      let currentSlot = new Date(date)
      currentSlot.setHours(startHour, startMinute, 0, 0)
      
      const endSlot = new Date(date)
      endSlot.setHours(endHour, endMinute, 0, 0)
      
      while (currentSlot < endSlot) {
        const slotEnd = new Date(currentSlot.getTime() + availability.duration_minutes * 60000)
        
        if (slotEnd <= endSlot) {
          slots.push({
            start: new Date(currentSlot),
            end: slotEnd,
            available: currentSlot > now
          })
        }
        
        currentSlot = new Date(currentSlot.getTime() + (availability.duration_minutes + availability.buffer_minutes) * 60000)
      }
    })
    
    return slots.sort((a, b) => a.start.getTime() - b.start.getTime())
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    const slots = generateTimeSlots(date)
    setTimeSlots(slots)
    setSelectedTimeSlot(null)
    setShowBookingForm(false)
  }

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot)
    setShowBookingForm(true)
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!availability || !selectedTimeSlot) return
    
    try {
      const response = await fetch(`/api/booking/public/${bookingLink}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          start_time: selectedTimeSlot.start.toISOString(),
          end_time: selectedTimeSlot.end.toISOString()
        }),
      })

      if (response.ok) {
        setBookingSubmitted(true)
      }
    } catch (error) {
      console.error("Failed to submit booking:", error)
    }
  }

  const getAvailableDates = () => {
    if (!availability) return []
    
    const dates: Date[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Show next 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      
      const dayOfWeek = date.getDay()
      const hasAvailability = availability.availability_rules.some(rule => 
        rule.day_of_week === dayOfWeek && rule.is_available
      )
      
      if (hasAvailability) {
        dates.push(date)
      }
    }
    
    return dates
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading booking page...</span>
        </div>
      </div>
    )
  }

  if (!availability) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Booking Not Found</h3>
            <p className="text-muted-foreground">
              This booking link is invalid or no longer active.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (bookingSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Booking Confirmed!</h3>
            <p className="text-muted-foreground mb-4">
              Your meeting has been scheduled successfully. You'll receive a confirmation email shortly.
            </p>
            <div className="text-left space-y-2 text-sm">
              <p><strong>Meeting:</strong> {availability.name}</p>
              <p><strong>Date:</strong> {selectedTimeSlot ? formatDate(selectedTimeSlot.start) : ''}</p>
              <p><strong>Time:</strong> {selectedTimeSlot ? formatTime(selectedTimeSlot.start) : ''}</p>
              <p><strong>Duration:</strong> {availability.duration_minutes} minutes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">{availability.name}</h1>
            {availability.description && (
              <p className="text-muted-foreground text-lg">{availability.description}</p>
            )}
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {availability.duration_minutes} minutes
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {availability.timezone}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Date Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select a Date</CardTitle>
                <CardDescription>
                  Choose an available date for your meeting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {getAvailableDates().map((date) => (
                    <Button
                      key={date.toISOString()}
                      variant={selectedDate?.toDateString() === date.toDateString() ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleDateSelect(date)}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDate(date)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Time Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select a Time</CardTitle>
                <CardDescription>
                  {selectedDate 
                    ? `Available times for ${formatDate(selectedDate)}`
                    : "Select a date first"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {timeSlots.length > 0 ? (
                      timeSlots.map((slot, index) => (
                        <Button
                          key={index}
                          variant={selectedTimeSlot?.start.getTime() === slot.start.getTime() ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => handleTimeSlotSelect(slot)}
                          disabled={!slot.available}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {formatTime(slot.start)} - {formatTime(slot.end)}
                          {!slot.available && (
                            <span className="ml-auto text-xs text-muted-foreground">Unavailable</span>
                          )}
                        </Button>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No available time slots for this date
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Please select a date to see available times
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          {showBookingForm && selectedTimeSlot && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Complete Your Booking</CardTitle>
                <CardDescription>
                  Fill in your details to confirm the meeting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitBooking} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.guest_name}
                        onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.guest_email}
                        onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.guest_phone}
                      onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any specific topics you'd like to discuss..."
                      rows={3}
                    />
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Meeting Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Date:</strong> {formatDate(selectedTimeSlot.start)}</p>
                      <p><strong>Time:</strong> {formatTime(selectedTimeSlot.start)} - {formatTime(selectedTimeSlot.end)}</p>
                      <p><strong>Duration:</strong> {availability.duration_minutes} minutes</p>
                      <p><strong>Timezone:</strong> {availability.timezone}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Confirm Booking
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowBookingForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}