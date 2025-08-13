"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"

interface GoogleSyncButtonProps {
  onSyncClick?: () => void
  isEnabled?: boolean
}

export function GoogleSyncButton({ onSyncClick, isEnabled = false }: GoogleSyncButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      if (onSyncClick) {
        await onSyncClick()
      } else {
        // Default behavior: redirect to Google OAuth
        window.location.href = "/api/calendar/auth/google"
      }
    } catch (error) {
      console.error("Failed to handle sync click:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      {isEnabled ? "Synced" : "Sync Google"}
    </Button>
  )
}