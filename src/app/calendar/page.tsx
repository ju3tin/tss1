"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { 
  Calendar, 
  Clock, 
  Users, 
  User, 
  Plus, 
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Loader2,
  CalendarDays,
  Video,
  MapPin,
  AlertCircle
} from "lucide-react"
import { GoogleCalendarSync } from "@/components/calendar/google-calendar-sync"
import { GoogleSyncButton } from "@/components/calendar/google-sync-button"
import { EventCreationModal } from "@/components/calendar/event-creation-modal"

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  location?: string
  event_type: "MEETING" | "TASK" | "BOOKING" | "REMINDER" | "PERSONAL" | "OTHER"
  user: {
    first_name: string
    last_name: string
    email: string
  }
  attendees?: string[]
  is_synced_with_google: boolean
  google_meet_link?: string
  include_google_meet: boolean
}

interface Task {
  id: string
  title: string
  description?: string
  due_date?: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE"
  assigned_to_user: {
    first_name: string
    last_name: string
  }
}

interface Booking {
  id: string
  guest_name: string
  guest_email: string
  start_time: string
  end_time: string
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
  availability: {
    name: string
    user: {
      first_name: string
      last_name: string
    }
  }
}

const eventColors = {
  MEETING: "bg-blue-100 text-blue-800 border-blue-200",
  TASK: "bg-green-100 text-green-800 border-green-200",
  BOOKING: "bg-purple-100 text-purple-800 border-purple-200",
  REMINDER: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PERSONAL: "bg-gray-100 text-gray-800 border-gray-200",
  OTHER: "bg-orange-100 text-orange-800 border-orange-200"
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800"
}

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"day" | "week" | "month">("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showTeamView, setShowTeamView] = useState(false)
  const [googleSyncEnabled, setGoogleSyncEnabled] = useState(false)
  
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    
    fetchCalendarData()
    fetchUsers()
  }, [session, status, router])

  const fetchCalendarData = async () => {
    try {
      const [eventsRes, tasksRes, bookingsRes, syncRes] = await Promise.all([
        fetch("/api/calendar/events"),
        fetch("/api/tasks"),
        fetch("/api/calendar/bookings"),
        fetch("/api/calendar/sync")
      ])

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData)
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData)
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        setBookings(bookingsData)
      }

      if (syncRes.ok) {
        const syncData = await syncRes.json()
        setGoogleSyncEnabled(syncData.googleSync?.isEnabled || false)
      }
    } catch (error) {
      console.error("Failed to fetch calendar data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const usersData = await response.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const handleEventCreated = () => {
    fetchCalendarData()
  }

  const handleGenerateMeetLink = async (eventId: string) => {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}/meet`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        fetchCalendarData()
        return data.meet_link
      }
    } catch (error) {
      console.error("Failed to generate Google Meet link:", error)
    }
  }

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (view === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else if (view === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false
      const taskDate = new Date(task.due_date)
      return taskDate.toDateString() === date.toDateString()
    })
  }

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.start_time)
      return bookingDate.toDateString() === date.toDateString()
    })
  }

  const getAllItemsForDate = (date: Date) => {
    const eventsForDate = getEventsForDate(date).map(event => ({
      ...event,
      type: "event" as const,
      time: formatTime(event.start_time)
    }))
    
    const tasksForDate = getTasksForDate(date).map(task => ({
      ...task,
      type: "task" as const,
      time: task.due_date ? formatTime(task.due_date) : "All day"
    }))
    
    const bookingsForDate = getBookingsForDate(date).map(booking => ({
      ...booking,
      type: "booking" as const,
      time: formatTime(booking.start_time)
    }))

    return [...eventsForDate, ...tasksForDate, ...bookingsForDate]
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  const generateWeekDates = () => {
    const dates = []
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const generateMonthDates = () => {
    const dates = []
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    const startDate = new Date(startOfMonth)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const endDate = new Date(endOfMonth)
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    const current = new Date(startDate)
    while (current <= endDate) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  if (status === "loading" || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading calendar...</span>
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
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">
              {showTeamView ? "Team Calendar" : "My Calendar"} - Manage your schedule and bookings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showTeamView ? "default" : "outline"}
              onClick={() => setShowTeamView(!showTeamView)}
            >
              <Users className="mr-2 h-4 w-4" />
              Team View
            </Button>
            <GoogleSyncButton isEnabled={googleSyncEnabled} />
            <EventCreationModal onEventCreated={handleEventCreated} />
          </div>
        </div>

        {/* Calendar Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-lg font-semibold min-w-[200px] text-center">
                  {currentDate.toLocaleDateString("en-US", { 
                    month: "long", 
                    year: "numeric",
                    ...(view === "day" && { day: "numeric" })
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={view} onValueChange={(value: any) => setView(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
                
                {showTeamView && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Select>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter users" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Calendar Sync */}
        <GoogleCalendarSync onSyncChange={setGoogleSyncEnabled} />

        {/* Calendar View */}
        <Card>
          <CardContent className="p-0">
            {view === "day" && (
              <div className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {currentDate.toLocaleDateString("en-US", { 
                      weekday: "long", 
                      month: "long", 
                      day: "numeric", 
                      year: "numeric" 
                    })}
                  </h3>
                  
                  <div className="space-y-2">
                    {getAllItemsForDate(currentDate).map((item, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          item.type === "event" ? eventColors[item.event_type] :
                          item.type === "task" ? statusColors[item.status] :
                          statusColors[item.status]
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{item.time}</span>
                              {item.type === "event" && item.is_synced_with_google && (
                                <RefreshCw className="h-3 w-3 text-green-600" />
                              )}
                            </div>
                            <h4 className="font-medium">
                              {item.type === "event" ? item.title :
                               item.type === "task" ? item.title :
                               `${item.guest_name} - ${item.availability.name}`}
                            </h4>
                            {item.description && (
                              <p className="text-sm opacity-75 mt-1">{item.description}</p>
                            )}
                            {item.type === "event" && item.location && (
                              <div className="flex items-center gap-1 text-sm opacity-75 mt-1">
                                <MapPin className="h-3 w-3" />
                                {item.location}
                              </div>
                            )}
                            {item.type === "event" && item.google_meet_link && (
                              <div className="flex items-center gap-1 text-sm opacity-75 mt-1">
                                <Video className="h-3 w-3" />
                                <a 
                                  href={item.google_meet_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Join Google Meet
                                </a>
                              </div>
                            )}
                            {item.type === "event" && !item.google_meet_link && (
                              <div className="flex items-center gap-1 text-sm opacity-75 mt-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleGenerateMeetLink(item.id)}
                                >
                                  <Video className="h-3 w-3 mr-1" />
                                  Generate Meet Link
                                </Button>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {item.type === "event" && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.event_type}
                                </Badge>
                              )}
                              {item.type === "task" && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.status}
                                </Badge>
                              )}
                              {item.type === "booking" && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.status}
                                </Badge>
                              )}
                              <span className="text-xs opacity-75">
                                {item.type === "event" ? `${item.user.first_name} ${item.user.last_name}` :
                                 item.type === "task" ? `${item.assigned_to_user.first_name} ${item.assigned_to_user.last_name}` :
                                 `${item.availability.user.first_name} ${item.availability.user.last_name}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {view === "week" && (
              <div className="grid grid-cols-7 gap-0 border-t">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                  <div key={day} className="border-r last:border-r-0">
                    <div className="p-3 border-b bg-muted/50">
                      <div className="text-center">
                        <div className="text-sm font-medium">{day}</div>
                        <div className="text-lg font-semibold">
                          {generateWeekDates()[index].getDate()}
                        </div>
                      </div>
                    </div>
                    <div className="p-2 min-h-[400px] space-y-1">
                      {getAllItemsForDate(generateWeekDates()[index]).map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className={`p-2 rounded text-xs ${
                            item.type === "event" ? eventColors[item.event_type] :
                            item.type === "task" ? statusColors[item.status] :
                            statusColors[item.status]
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium truncate">{item.time}</div>
                              <div className="truncate">
                                {item.type === "event" ? item.title :
                                 item.type === "task" ? item.title :
                                 item.guest_name}
                              </div>
                            </div>
                            {item.type === "event" && item.google_meet_link && (
                              <Video className="h-3 w-3 text-blue-600 flex-shrink-0 ml-1" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === "month" && (
              <div className="grid grid-cols-7 gap-0 border-t">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="p-3 border-b border-r bg-muted/50 text-center font-medium text-sm">
                    {day}
                  </div>
                ))}
                {generateMonthDates().map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                  const items = getAllItemsForDate(date)
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border-r border-b ${
                        !isCurrentMonth ? "bg-muted/20" : ""
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        !isCurrentMonth ? "text-muted-foreground" : ""
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {items.slice(0, 3).map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className={`p-1 rounded text-xs truncate ${
                              item.type === "event" ? eventColors[item.event_type] :
                              item.type === "task" ? statusColors[item.status] :
                              statusColors[item.status]
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="truncate">
                                {item.time} {item.type === "event" ? item.title : item.type === "task" ? item.title : item.guest_name}
                              </span>
                              {item.type === "event" && item.google_meet_link && (
                                <Video className="h-3 w-3 text-blue-600 flex-shrink-0 ml-1" />
                              )}
                            </div>
                          </div>
                        ))}
                        {items.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{items.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events
                  .filter(event => new Date(event.start_time) > new Date())
                  .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                  .slice(0, 5)
                  .map(event => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(event.start_time)}
                        </p>
                        {event.location && (
                          <p className="text-xs text-muted-foreground">
                            {event.location}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.event_type}
                      </Badge>
                    </div>
                  ))}
                {events.filter(event => new Date(event.start_time) > new Date()).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming events
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks
                  .filter(task => task.status !== "COMPLETED")
                  .sort((a, b) => {
                    if (!a.due_date) return 1
                    if (!b.due_date) return -1
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                  })
                  .slice(0, 5)
                  .map(task => (
                    <div key={task.id} className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        {task.due_date && (
                          <p className="text-xs text-muted-foreground">
                            Due: {formatDateTime(task.due_date)}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          task.status === "OVERDUE" ? "text-red-600 border-red-200" :
                          task.status === "IN_PROGRESS" ? "text-blue-600 border-blue-200" :
                          "text-yellow-600 border-yellow-200"
                        }`}
                      >
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                {tasks.filter(task => task.status !== "COMPLETED").length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending tasks
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Today's Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bookings
                  .filter(booking => {
                    const today = new Date()
                    const bookingDate = new Date(booking.start_time)
                    return bookingDate.toDateString() === today.toDateString()
                  })
                  .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                  .map(booking => (
                    <div key={booking.id} className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{booking.guest_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(booking.start_time)} - {booking.availability.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.guest_email}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          booking.status === "CONFIRMED" ? "text-green-600 border-green-200" :
                          booking.status === "PENDING" ? "text-yellow-600 border-yellow-200" :
                          "text-red-600 border-red-200"
                        }`}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                {bookings.filter(booking => {
                  const today = new Date()
                  const bookingDate = new Date(booking.start_time)
                  return bookingDate.toDateString() === today.toDateString()
                }).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No bookings today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}