"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"

interface DocumentUploadProps {
  dealId: string
  onUploadComplete?: (document: any) => void
}

export function DocumentUpload({ dealId, onUploadComplete }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState("")
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const documentTypes = [
    { value: "AML", label: "AML Form", description: "Anti-Money Laundering Declaration" },
    { value: "KYC", label: "KYC Form", description: "Know Your Customer Form" },
    { value: "ID", label: "ID Document", description: "Passport, Driver's License, etc." },
    { value: "PASSPORT", label: "Passport", description: "Passport copy" },
    { value: "COMPANY_CERT", label: "Company Certificate", description: "Business registration documents" },
    { value: "PITCH_DECK", label: "Pitch Deck", description: "Investment presentation" },
    { value: "CONTRACT", label: "Contract", description: "Legal agreements" },
    { value: "OTHER", label: "Other", description: "Other documents" }
  ]

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
      setError(null)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  })

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      setError("Please select a file and document type")
      return
    }

    setUploading(true)
    setUploadStatus("uploading")
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("dealId", dealId)
      formData.append("documentType", documentType)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const result = await response.json()
        setUploadStatus("success")
        onUploadComplete?.(result.document)
        
        // Reset form
        setSelectedFile(null)
        setDocumentType("")
        setUploadProgress(0)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Upload failed")
        setUploadStatus("error")
      }
    } catch (err) {
      setError("Network error during upload")
      setUploadStatus("error")
    } finally {
      setUploading(false)
    }
  }

  const getSelectedTypeInfo = () => {
    return documentTypes.find(type => type.value === documentType)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document
        </CardTitle>
        <CardDescription>
          Upload AML/KYC forms or other documents for deal processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="documentType">Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {getSelectedTypeInfo() && (
            <p className="text-sm text-muted-foreground">
              {getSelectedTypeInfo()?.description}
            </p>
          )}
        </div>

        {/* File Upload Area */}
        <div className="space-y-2">
          <Label>File</Label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm">Drop the file here...</p>
            ) : (
              <div>
                <p className="text-sm mb-1">
                  Drag & drop a file here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX, PNG, JPG up to 10MB
                </p>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                Remove
              </Button>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {uploadStatus === "success" && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Document uploaded successfully! Processing will begin shortly.
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !documentType || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}