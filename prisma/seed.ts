import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wgp.com' },
    update: {},
    create: {
      email: 'admin@wgp.com',
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'ADMIN',
    },
  })

  // Create analyst user
  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@wgp.com' },
    update: {},
    create: {
      email: 'analyst@wgp.com',
      password_hash: hashedPassword,
      first_name: 'Jane',
      last_name: 'Analyst',
      role: 'ANALYST',
    },
  })

  // Create partner user
  const partner = await prisma.user.upsert({
    where: { email: 'partner@wgp.com' },
    update: {},
    create: {
      email: 'partner@wgp.com',
      password_hash: hashedPassword,
      first_name: 'John',
      last_name: 'Partner',
      role: 'PARTNER',
    },
  })

  // Create sample companies
  const company1 = await prisma.company.upsert({
    where: { id: 'company1' },
    update: {},
    create: {
      name: 'TechCorp Industries',
      company_type: 'FUND',
      region: 'North America',
      vertical: 'Technology',
      aum: 2500000000,
      ticket_size_range: '$1M - $10M',
    },
  })

  const company2 = await prisma.company.upsert({
    where: { id: 'company2' },
    update: {},
    create: {
      name: 'Green Energy Solutions',
      company_type: 'PROJECT',
      region: 'Europe',
      vertical: 'Renewable Energy',
      aum: 500000000,
      ticket_size_range: '$500K - $2M',
    },
  })

  // Create sample contacts
  const contact1 = await prisma.contact.upsert({
    where: { id: 'contact1' },
    update: {},
    create: {
      full_name: 'Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      phone_number: '+1-555-0123',
      investor_type: 'INDIVIDUAL',
      source: 'Conference',
      associated_company_id: company1.id,
    },
  })

  const contact2 = await prisma.contact.upsert({
    where: { id: 'contact2' },
    update: {},
    create: {
      full_name: 'Michael Chen',
      email: 'michael.chen@greenenergy.com',
      phone_number: '+1-555-0456',
      investor_type: 'INDIVIDUAL',
      source: 'Referral',
      associated_company_id: company2.id,
    },
  })

  const contact3 = await prisma.contact.upsert({
    where: { id: 'contact3' },
    update: {},
    create: {
      full_name: 'Emily Rodriguez',
      email: 'emily.rodriguez@example.com',
      phone_number: '+1-555-0789',
      investor_type: 'INDIVIDUAL',
      source: 'Website',
    },
  })

  // Create sample deals
  const deal1 = await prisma.deal.upsert({
    where: { id: 'deal1' },
    update: {},
    create: {
      deal_name: 'TechCorp Series A Investment',
      stage: 'NEW_LEAD',
      associated_contact_id: contact1.id,
      associated_company_id: company1.id,
      owner_user_id: admin.id,
      kyc_status: 'PENDING',
      due_diligence_notes: 'Initial interest expressed in our Series A round.',
    },
  })

  const deal2 = await prisma.deal.upsert({
    where: { id: 'deal2' },
    update: {},
    create: {
      deal_name: 'Green Energy Expansion',
      stage: 'KYC_IN_PROGRESS',
      associated_contact_id: contact2.id,
      associated_company_id: company2.id,
      owner_user_id: analyst.id,
      kyc_status: 'SUBMITTED',
      due_diligence_notes: 'KYC documents submitted, awaiting verification.',
    },
  })

  // Create sample booking availability
  const bookingAvailability1 = await prisma.bookingAvailability.upsert({
    where: { id: 'booking1' },
    update: {},
    create: {
      user_id: admin.id,
      name: '30-Minute Consultation',
      description: 'Discuss your investment needs and how we can help',
      duration_minutes: 30,
      buffer_minutes: 15,
      booking_link: 'consultation-30min',
      is_active: true,
      timezone: 'America/New_York',
    },
  })

  // Create availability rules for the booking
  await prisma.availabilityRule.createMany({
    data: [
      {
        availability_id: bookingAvailability1.id,
        day_of_week: 1, // Monday
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
      },
      {
        availability_id: bookingAvailability1.id,
        day_of_week: 2, // Tuesday
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
      },
      {
        availability_id: bookingAvailability1.id,
        day_of_week: 3, // Wednesday
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
      },
      {
        availability_id: bookingAvailability1.id,
        day_of_week: 4, // Thursday
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
      },
      {
        availability_id: bookingAvailability1.id,
        day_of_week: 5, // Friday
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
      },
    ],
  })

  // Create sample calendar events
  const calendarEvent1 = await prisma.calendarEvent.create({
    data: {
      user_id: admin.id,
      title: "Team Meeting",
      description: "Weekly team sync to discuss project progress",
      start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour duration
      location: "Conference Room A",
      event_type: "MEETING",
      attendees: JSON.stringify(["admin@wgp.com", "analyst@wgp.com", "partner@wgp.com"]),
      reminder_minutes: 15
    }
  })

  const calendarEvent2 = await prisma.calendarEvent.create({
    data: {
      user_id: analyst.id,
      title: "Client Call - TechCorp",
      description: "Follow up call with TechCorp regarding investment opportunity",
      start_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 minutes duration
      location: "Virtual",
      event_type: "MEETING",
      attendees: JSON.stringify(["analyst@wgp.com", "sarah.johnson@techcorp.com"]),
      reminder_minutes: 30
    }
  })

  const calendarEvent3 = await prisma.calendarEvent.create({
    data: {
      user_id: partner.id,
      title: "Due Diligence Review",
      description: "Review due diligence documents for Green Energy project",
      start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours duration
      location: "Office",
      event_type: "TASK",
      attendees: JSON.stringify(["partner@wgp.com", "analyst@wgp.com"]),
      reminder_minutes: 60
    }
  })

  console.log({ admin, analyst, partner, company1, company2, contact1, contact2, contact3, deal1, deal2, bookingAvailability1, calendarEvent1, calendarEvent2, calendarEvent3 })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })