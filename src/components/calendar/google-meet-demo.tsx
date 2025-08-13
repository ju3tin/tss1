"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, ExternalLink, Copy, Check } from "lucide-react"

interface GoogleMeetDemoProps {
  eventId?: string
  meetLink?: string
  onGenerateMeet?: () => void
}

export function GoogleMeetDemo({ eventId, meetLink, onGenerateMeet }: GoogleMeetDemoProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    if (meetLink) {
      try {
        await navigator.clipboard.writeText(meetLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy link:", error)
      }
    }
  }

  const handleJoinMeet = () => {
    if (meetLink) {
      window.open(meetLink, '_blank')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Google Meet Integration
        </CardTitle>
        <CardDescription>
          Generate and manage Google Meet links for your calendar events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {meetLink ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" />
                Meet Link Generated
              </Badge>
              <span className="text-sm text-muted-foreground">Event ID: {eventId}</span>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-mono break-all">{meetLink}</div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleJoinMeet} className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                Join Meeting
              </Button>
              <Button variant="outline" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center py-6">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No Google Meet link generated yet for this event
              </p>
            </div>
            
            <Button onClick={onGenerateMeet} className="w-full">
              <Video className="mr-2 h-4 w-4" />
              Generate Google Meet Link
            </Button>
          </div>
        )}
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Features:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Generate unique Google Meet links for each event</li>
            <li>• One-click join meeting functionality</li>
            <li>• Copy meeting link to clipboard</li>
            <li>• Automatic link generation during event creation</li>
            <li>• Integration with Google Calendar sync</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}