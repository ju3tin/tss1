import { db } from "@/lib/db"

interface BookingEmailData {
  booking: {
    id: string
    guest_name: string
    guest_email: string
    guest_phone?: string
    start_time: Date
    end_time: Date
    status: string
    notes?: string
    timezone: string
  }
  availability: {
    name: string
    description?: string
    duration_minutes: number
    user: {
      first_name: string
      last_name: string
      email: string
    }
  }
  contact?: {
    full_name: string
    email: string
    phone_number?: string
  }
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const { booking, availability, contact } = data
  
  // Generate calendar invite
  const calendarInvite = generateCalendarInvite(booking, availability)
  
  // Email to guest
  const guestEmailContent = {
    to: booking.guest_email,
    subject: `Meeting Confirmed: ${availability.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; margin-bottom: 20px;">Meeting Confirmed</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${availability.name}</h3>
          <p style="margin: 5px 0; color: #666;">with ${availability.user.first_name} ${availability.user.last_name}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">Meeting Details</h4>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${booking.start_time.toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.start_time.toLocaleTimeString()} - ${booking.end_time.toLocaleTimeString()}</p>
          <p style="margin: 5px 0;"><strong>Duration:</strong> ${availability.duration_minutes} minutes</p>
          <p style="margin: 5px 0;"><strong>Timezone:</strong> ${booking.timezone}</p>
        </div>
        
        ${booking.notes ? `
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">Notes</h4>
          <p style="margin: 5px 0; color: #666;">${booking.notes}</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${calendarInvite}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Add to Calendar
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This is an automated confirmation for your meeting. If you need to reschedule or cancel, please reply to this email.</p>
        </div>
      </div>
    `
  }
  
  // Email to host
  const hostEmailContent = {
    to: availability.user.email,
    subject: `New Booking: ${availability.name} with ${booking.guest_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; margin-bottom: 20px;">New Meeting Booking</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${availability.name}</h3>
          <p style="margin: 5px 0; color: #666;">with ${booking.guest_name}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">Guest Information</h4>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${booking.guest_name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${booking.guest_email}</p>
          ${booking.guest_phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${booking.guest_phone}</p>` : ''}
          ${contact ? `<p style="margin: 5px 0;"><strong>CRM Contact:</strong> ${contact.full_name}</p>` : ''}
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">Meeting Details</h4>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${booking.start_time.toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.start_time.toLocaleTimeString()} - ${booking.end_time.toLocaleTimeString()}</p>
          <p style="margin: 5px 0;"><strong>Duration:</strong> ${availability.duration_minutes} minutes</p>
          <p style="margin: 5px 0;"><strong>Timezone:</strong> ${booking.timezone}</p>
        </div>
        
        ${booking.notes ? `
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">Guest Notes</h4>
          <p style="margin: 5px 0; color: #666;">${booking.notes}</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${calendarInvite}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Add to Calendar
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This meeting has been automatically added to your booking system. Please make sure to attend or reschedule if needed.</p>
        </div>
      </div>
    `
  }
  
  // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
  // For now, we'll just log the emails
  console.log("Guest Email:", guestEmailContent)
  console.log("Host Email:", hostEmailContent)
  
  return {
    guestEmail: guestEmailContent,
    hostEmail: hostEmailContent,
    calendarInvite
  }
}

function generateCalendarInvite(booking: any, availability: any): string {
  const startDate = booking.start_time.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const endDate = booking.end_time.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  
  const uid = `booking-${booking.id}@${process.env.NEXT_PUBLIC_APP_URL || 'localhost'}`
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  
  const calendarContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Booking System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${availability.name}`,
    `DESCRIPTION:${availability.description || 'Meeting scheduled via booking system'}`,
    `LOCATION:Online Meeting`,
    `ORGANIZER;CN=${availability.user.first_name} ${availability.user.last_name}:mailto:${availability.user.email}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${booking.guest_name}:mailto:${booking.guest_email}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
  
  return `data:text/calendar;charset=utf8,${encodeURIComponent(calendarContent)}`
}

export async function sendBookingReminderEmail(bookingId: string) {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        availability: {
          include: {
            user: true
          }
        },
        contact: true
      }
    })
    
    if (!booking) {
      throw new Error("Booking not found")
    }
    
    const reminderContent = {
      to: booking.guest_email,
      subject: `Reminder: ${booking.availability.name} tomorrow`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; margin-bottom: 20px;">Meeting Reminder</h2>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ffeaa7;">
            <p style="margin: 0; color: #856404;"><strong>This meeting is scheduled for tomorrow!</strong></p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${booking.availability.name}</h3>
            <p style="margin: 5px 0; color: #666;">with ${booking.availability.user.first_name} ${booking.availability.user.last_name}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Meeting Details</h4>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${booking.start_time.toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.start_time.toLocaleTimeString()} - ${booking.end_time.toLocaleTimeString()}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${booking.availability.duration_minutes} minutes</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="margin-bottom: 10px; color: #666;">We look forward to speaking with you!</p>
          </div>
        </div>
      `
    }
    
    // TODO: Send actual email
    console.log("Reminder Email:", reminderContent)
    
    return reminderContent
  } catch (error) {
    console.error("Error sending booking reminder:", error)
    throw error
  }
}