"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SignatureCanvas } from "react-signature-canvas"
import { Pen, FileText, CheckCircle, AlertCircle, Upload, Type, Loader2 } from "lucide-react"

interface DocumentSigningProps {
  document: any
  onSignComplete?: (signature: any) => void
}

export function DocumentSigning({ document, onSignComplete }: DocumentSigningProps) {
  const [signatureType, setSignatureType] = useState<"drawn" | "typed" | "uploaded">("drawn")
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [typedSignature, setTypedSignature] = useState("")
  const [signerName, setSignerName] = useState("")
  const [signerEmail, setSignerEmail] = useState("")
  const [acknowledgmentText, setAcknowledgmentText] = useState("")
  const [isAcknowledged, setIsAcknowledged] = useState(false)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const sigCanvasRef = useRef<SignatureCanvas | null>(null)

  const handleClearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear()
      setSignatureData(null)
    }
  }

  const handleSaveSignature = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      setSignatureData(sigCanvasRef.current.getTrimmedCanvas().toDataURL("image/png"))
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSignatureData(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSign = async () => {
    // Validate required fields
    if (!signerName || !signerEmail) {
      setError("Please provide signer name and email")
      return
    }

    if (signatureType === "drawn" && !signatureData) {
      setError("Please draw your signature")
      return
    }

    if (signatureType === "typed" && !typedSignature) {
      setError("Please type your signature")
      return
    }

    if (signatureType === "uploaded" && !signatureData) {
      setError("Please upload your signature")
      return
    }

    if (document.acknowledgment_required && !isAcknowledged) {
      setError("Please acknowledge the document before signing")
      return
    }

    setSigning(true)
    setError(null)

    try {
      const finalSignatureData = signatureType === "typed" 
        ? typedSignature 
        : signatureData

      const response = await fetch("/api/documents/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          documentId: document.id,
          signatureData: finalSignatureData,
          signatureType: signatureType.toUpperCase(),
          signerName,
          signerEmail,
          acknowledgmentText
        })
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(true)
        onSignComplete?.(result.signature)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Signing failed")
      }
    } catch (err) {
      setError("Network error during signing")
    } finally {
      setSigning(false)
    }
  }

  const getDocumentTypeLabel = () => {
    switch (document.file_type) {
      case "AML": return "AML Form"
      case "KYC": return "KYC Form"
      case "ID": return "ID Document"
      case "PASSPORT": return "Passport"
      case "COMPANY_CERT": return "Company Certificate"
      case "CONTRACT": return "Contract"
      default: return "Document"
    }
  }

  if (success) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Document Signed Successfully</h3>
              <p className="text-sm text-muted-foreground">
                Your signature has been recorded and the document has been processed.
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Signed
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pen className="h-5 w-5" />
          Sign Document
        </CardTitle>
        <CardDescription>
          Sign the {getDocumentTypeLabel()} for deal processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Info */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium">{document.file_name}</span>
            </div>
            <Badge variant="outline">
              {getDocumentTypeLabel()}
            </Badge>
          </div>
          {document.extracted_data && (
            <div className="mt-2 text-sm text-muted-foreground">
              Form fields have been automatically extracted and are ready for review.
            </div>
          )}
        </div>

        {/* Signer Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Signer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signerName">Full Name *</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signerEmail">Email Address *</Label>
              <Input
                id="signerEmail"
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="Enter your email address"
              />
            </div>
          </div>
        </div>

        {/* Signature Type Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Signature Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={signatureType === "drawn" ? "default" : "outline"}
              onClick={() => setSignatureType("drawn")}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Pen className="h-6 w-6" />
              <span className="text-sm">Draw Signature</span>
            </Button>
            <Button
              variant={signatureType === "typed" ? "default" : "outline"}
              onClick={() => setSignatureType("typed")}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Type className="h-6 w-6" />
              <span className="text-sm">Type Signature</span>
            </Button>
            <Button
              variant={signatureType === "uploaded" ? "default" : "outline"}
              onClick={() => setSignatureType("uploaded")}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Upload className="h-6 w-6" />
              <span className="text-sm">Upload Signature</span>
            </Button>
          </div>
        </div>

        {/* Signature Input */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Signature</h3>
          
          {signatureType === "drawn" && (
            <div className="space-y-2">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 bg-white">
                <SignatureCanvas
                  ref={(ref) => sigCanvasRef.current = ref}
                  canvasProps={{
                    className: "w-full h-32 border border-gray-300 rounded",
                    style: { touchAction: "none" }
                  }}
                  onEnd={handleSaveSignature}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleClearSignature}>
                  Clear
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveSignature}>
                  Save
                </Button>
              </div>
            </div>
          )}

          {signatureType === "typed" && (
            <div className="space-y-2">
              <Input
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Type your full name as signature"
                className="font-signature text-xl"
              />
              {typedSignature && (
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-lg font-signature">{typedSignature}</p>
                </div>
              )}
            </div>
          )}

          {signatureType === "uploaded" && (
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              {signatureData && (
                <div className="p-4 border rounded-lg bg-muted">
                  <img 
                    src={signatureData} 
                    alt="Signature" 
                    className="max-h-20 mx-auto"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Document Acknowledgment */}
        {document.acknowledgment_required && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Document Acknowledgment</h3>
            <div className="space-y-2">
              <Label htmlFor="acknowledgment">
                I acknowledge that I have read and understood this document
              </Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="acknowledgment"
                  checked={isAcknowledged}
                  onChange={(e) => setIsAcknowledged(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="acknowledgment" className="text-sm">
                  I confirm that I have read and understood the {getDocumentTypeLabel()} and agree to its terms
                </Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acknowledgmentText">Additional Comments (Optional)</Label>
              <Textarea
                id="acknowledgmentText"
                value={acknowledgmentText}
                onChange={(e) => setAcknowledgmentText(e.target.value)}
                placeholder="Add any additional comments or notes..."
                rows={3}
              />
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

        {/* Sign Button */}
        <Button
          onClick={handleSign}
          disabled={signing}
          className="w-full"
        >
          {signing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing Document...
            </>
          ) : (
            <>
              <Pen className="mr-2 h-4 w-4" />
              Sign Document
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}