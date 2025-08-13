import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { emailId: string } }
) {
  try {
    const emailId = params.emailId
    
    // Get client information from request
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'Unknown'
    
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    
    // Parse user agent to get device information
    const deviceType = getDeviceType(userAgent)
    
    // Get location from IP (simplified - in production, use a proper geolocation service)
    const location = await getLocationFromIP(ipAddress)
    
    // Find and update the email tracking record
    const emailTracking = await db.emailTracking.findUnique({
      where: { email_id: emailId }
    })
    
    if (!emailTracking) {
      // Return 1x1 transparent pixel even if tracking record not found
      return getPixelResponse()
    }
    
    // Update tracking information
    const now = new Date()
    const updateData: any = {
      open_count: {
        increment: 1
      },
      last_opened_at: now,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_type: deviceType,
      location: location,
      updated_at: now
    }
    
    // Set opened_at if this is the first open
    if (!emailTracking.opened_at) {
      updateData.opened_at = now
    }
    
    await db.emailTracking.update({
      where: { email_id: emailId },
      data: updateData
    })
    
    // Return 1x1 transparent pixel
    return getPixelResponse()
    
  } catch (error) {
    console.error("Error tracking email open:", error)
    // Still return pixel even if there's an error
    return getPixelResponse()
  }
}

function getPixelResponse(): NextResponse {
  // Create a 1x1 transparent GIF pixel
  const pixelData = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
  
  return new NextResponse(pixelData, {
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': pixelData.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    status: 200
  })
}

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
    return 'Mobile'
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'Tablet'
  } else {
    return 'Desktop'
  }
}

async function getLocationFromIP(ipAddress: string): Promise<string> {
  // Simplified location detection
  // In production, use services like IPGeolocation, MaxMind, or similar
  try {
    if (ipAddress === 'Unknown' || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
      return 'Local Network'
    }
    
    // For demo purposes, return a generic location
    // In production, you would integrate with a real geolocation service
    return 'Unknown Location'
  } catch (error) {
    return 'Unknown Location'
  }
}