"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Cloud, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  Loader2,
  Settings
} from "lucide-react"

interface GoogleDriveConfigProps {
  onConfigComplete?: () => void
}

interface DriveConfig {
  id: string
  is_enabled: boolean
  auto_upload: boolean
  sync_direction: string
  drive_folder_id?: string
  token_expired?: boolean
  created_at: string
  updated_at: string
}

export function GoogleDriveConfig({ onConfigComplete }: GoogleDriveConfigProps) {
  const [config, setConfig] = useState<DriveConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [configuring, setConfiguring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/google-drive/config")
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
      }
    } catch (err) {
      console.error("Error fetching Google Drive config:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    // In a real implementation, this would redirect to Google OAuth
    // For now, we'll simulate the process
    setConfiguring(true)
    setError(null)

    // Simulate OAuth flow
    setTimeout(() => {
      const mockAccessToken = "mock_access_token_" + Math.random().toString(36)
      const mockRefreshToken = "mock_refresh_token_" + Math.random().toString(36)
      
      saveConfig(mockAccessToken, mockRefreshToken, 3600)
    }, 2000)
  }

  const saveConfig = async (accessToken: string, refreshToken: string, expiresIn: number) => {
    try {
      const response = await fetch("/api/google-drive/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessToken,
          refreshToken,
          expiresIn,
          autoUpload: true,
          syncDirection: "TO_GOOGLE"
        })
      })

      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
        onConfigComplete?.()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to save configuration")
      }
    } catch (err) {
      setError("Network error during configuration")
    } finally {
      setConfiguring(false)
    }
  }

  const handleToggleEnabled = async (enabled: boolean) => {
    if (!config) return

    try {
      const response = await fetch("/api/google-drive/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessToken: "current_token", // In real app, get from current config
          refreshToken: "current_refresh",
          expiresIn: 3600,
          autoUpload: config.auto_upload,
          syncDirection: config.sync_direction
        })
      })

      if (response.ok) {
        await fetchConfig()
      }
    } catch (err) {
      console.error("Error updating config:", err)
    }
  }

  const handleToggleAutoUpload = async (autoUpload: boolean) => {
    if (!config) return

    try {
      const response = await fetch("/api/google-drive/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessToken: "current_token",
          refreshToken: "current_refresh",
          expiresIn: 3600,
          autoUpload,
          syncDirection: config.sync_direction
        })
      })

      if (response.ok) {
        await fetchConfig()
      }
    } catch (err) {
      console.error("Error updating auto-upload:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Google Drive Integration
          </CardTitle>
          <CardDescription>
            Connect your Google Drive account to store and sync documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Google Drive is not configured. Connect your account to enable automatic document storage and backup.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGoogleAuth}
            disabled={configuring}
            className="w-full"
          >
            {configuring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Cloud className="mr-2 h-4 w-4" />
                Connect Google Drive
              </>
            )}
          </Button>

          <div className="space-y-2 text-sm text-muted-foreground">
            <h4 className="font-medium">Features:</h4>
            <ul className="space-y-1">
              <li>• Automatic document upload to Google Drive</li>
              <li>• Organized folder structure by deal</li>
              <li>• Secure cloud storage with Google's infrastructure</li>
              <li>• Easy sharing and collaboration</li>
              <li>• Document backup and version control</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Google Drive Integration
        </CardTitle>
        <CardDescription>
          Manage your Google Drive connection and settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium">Connected to Google Drive</span>
            {config.token_expired && (
              <Badge variant="destructive" className="text-xs">
                Token Expired
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoogleAuth}
            disabled={configuring}
          >
            {configuring ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Enable Google Drive</label>
              <p className="text-xs text-muted-foreground">
                Enable or disable Google Drive integration
              </p>
            </div>
            <Switch
              checked={config.is_enabled}
              onCheckedChange={handleToggleEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Auto Upload</label>
              <p className="text-xs text-muted-foreground">
                Automatically upload new documents to Google Drive
              </p>
            </div>
            <Switch
              checked={config.auto_upload}
              onCheckedChange={handleToggleAutoUpload}
              disabled={!config.is_enabled}
            />
          </div>
        </div>

        {/* Configuration Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Configuration Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>
              <div className="font-medium">
                {config.is_enabled ? "Enabled" : "Disabled"}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Auto Upload:</span>
              <div className="font-medium">
                {config.auto_upload ? "Enabled" : "Disabled"}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Sync Direction:</span>
              <div className="font-medium capitalize">
                {config.sync_direction.toLowerCase()}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Connected:</span>
              <div className="font-medium">
                {new Date(config.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Google Drive Folder */}
        {config.drive_folder_id && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Google Drive Folder</h4>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">CRM Documents</p>
                  <p className="text-xs text-muted-foreground">
                    Documents will be organized in subfolders by deal
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://drive.google.com/drive/folders/${config.drive_folder_id}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open("https://drive.google.com", "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Google Drive
          </Button>
          <Button
            variant="outline"
            onClick={fetchConfig}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}