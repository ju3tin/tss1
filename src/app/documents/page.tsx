"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Pen, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  RefreshCw,
  Cloud,
  Settings,
  MoreVertical
} from "lucide-react"
import { DocumentUpload } from "@/components/documents/document-upload"
import { DocumentSigning } from "@/components/documents/document-signing"
import { GoogleDriveConfig } from "@/components/documents/google-drive-config"
import { DocumentWorkflow } from "@/components/documents/document-workflow"

interface Document {
  id: string
  file_name: string
  file_type: string
  workflow_status: string
  validation_status?: string
  e_signature_status?: string
  created_at: string
  uploaded_by: {
    first_name: string
    last_name: string
    email: string
  }
  associated_deal: {
    id: string
    deal_name: string
    stage: string
    associated_contact: {
      full_name: string
      email: string
    }
  }
  google_drive_link?: string
  extracted_data?: string
  acknowledgment_required: boolean
  acknowledged_at?: string
  signed_at?: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showSigning, setShowSigning] = useState(false)
  const [showDriveConfig, setShowDriveConfig] = useState(false)
  const [showWorkflow, setShowWorkflow] = useState(false)
  const [extracting, setExtracting] = useState<string | null>(null)
  const [uploadingToDrive, setUploadingToDrive] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/documents")
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExtractFields = async (documentId: string) => {
    setExtracting(documentId)
    try {
      const response = await fetch("/api/documents/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ documentId })
      })

      if (response.ok) {
        await fetchDocuments()
      }
    } catch (error) {
      console.error("Error extracting fields:", error)
    } finally {
      setExtracting(null)
    }
  }

  const handleUploadToDrive = async (documentId: string) => {
    setUploadingToDrive(documentId)
    try {
      const response = await fetch("/api/google-drive/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ documentId })
      })

      if (response.ok) {
        await fetchDocuments()
      }
    } catch (error) {
      console.error("Error uploading to Google Drive:", error)
    } finally {
      setUploadingToDrive(null)
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.associated_deal.deal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.associated_deal.associated_contact.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === "all" || doc.file_type === filterType
    const matchesStatus = filterStatus === "all" || doc.workflow_status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-800"
      case "SIGNED": return "bg-green-100 text-green-800"
      case "ACKNOWLEDGED": return "bg-blue-100 text-blue-800"
      case "READY_FOR_SIGNATURE": return "bg-yellow-100 text-yellow-800"
      case "READY_FOR_REVIEW": return "bg-orange-100 text-orange-800"
      case "PROCESSING": return "bg-purple-100 text-purple-800"
      case "PENDING": return "bg-gray-100 text-gray-800"
      case "REJECTED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "AML": return "AML Form"
      case "KYC": return "KYC Form"
      case "ID": return "ID Document"
      case "PASSPORT": return "Passport"
      case "COMPANY_CERT": return "Company Certificate"
      case "CONTRACT": return "Contract"
      case "PITCH_DECK": return "Pitch Deck"
      default: return "Other"
    }
  }

  const isReadyForSigning = (doc: Document) => {
    return doc.workflow_status === "READY_FOR_SIGNATURE" || 
           (doc.workflow_status === "ACKNOWLEDGED" && doc.acknowledgment_required)
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Document Management</h1>
            <p className="text-muted-foreground">
              Manage AML/KYC forms, documents, and signatures
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showDriveConfig} onOpenChange={setShowDriveConfig}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Cloud className="mr-2 h-4 w-4" />
                  Google Drive
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Google Drive Configuration</DialogTitle>
                  <DialogDescription>
                    Configure Google Drive integration for document storage
                  </DialogDescription>
                </DialogHeader>
                <GoogleDriveConfig onConfigComplete={() => setShowDriveConfig(false)} />
              </DialogContent>
            </Dialog>
            <Dialog open={showUpload} onOpenChange={setShowUpload}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Upload AML/KYC forms or other documents
                  </DialogDescription>
                </DialogHeader>
                <DocumentUpload 
                  dealId="" // This would be passed from deal context
                  onUploadComplete={() => {
                    setShowUpload(false)
                    fetchDocuments()
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                  <p className="text-2xl font-bold">{documents.length}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">
                    {documents.filter(d => d.workflow_status === "READY_FOR_REVIEW").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ready for Signature</p>
                  <p className="text-2xl font-bold">
                    {documents.filter(d => isReadyForSigning(d)).length}
                  </p>
                </div>
                <Pen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Signed</p>
                  <p className="text-2xl font-bold">
                    {documents.filter(d => d.workflow_status === "SIGNED").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents, deals, or contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="AML">AML Form</SelectItem>
                  <SelectItem value="KYC">KYC Form</SelectItem>
                  <SelectItem value="ID">ID Document</SelectItem>
                  <SelectItem value="PASSPORT">Passport</SelectItem>
                  <SelectItem value="COMPANY_CERT">Company Certificate</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="READY_FOR_REVIEW">Ready for Review</SelectItem>
                  <SelectItem value="READY_FOR_SIGNATURE">Ready for Signature</SelectItem>
                  <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                  <SelectItem value="SIGNED">Signed</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No documents found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{doc.file_name}</span>
                          <Badge variant="outline">
                            {getDocumentTypeLabel(doc.file_type)}
                          </Badge>
                          <Badge className={getStatusColor(doc.workflow_status)}>
                            {doc.workflow_status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Deal: {doc.associated_deal.deal_name}</p>
                          <p>Contact: {doc.associated_deal.associated_contact.full_name}</p>
                          <p>Uploaded by: {doc.uploaded_by.first_name} {doc.uploaded_by.last_name}</p>
                          <p>Created: {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>

                        {doc.extracted_data && (
                          <Alert className="mt-2">
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                              Form fields have been automatically extracted from this document.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.workflow_status === "READY_FOR_REVIEW" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExtractFields(doc.id)}
                            disabled={extracting === doc.id}
                          >
                            {extracting === doc.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        
                        {isReadyForSigning(doc) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(doc)
                              setShowSigning(true)
                            }}
                          >
                            <Pen className="h-4 w-4" />
                          </Button>
                        )}

                        {doc.google_drive_link ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.google_drive_link, "_blank")}
                          >
                            <Cloud className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUploadToDrive(doc.id)}
                            disabled={uploadingToDrive === doc.id}
                          >
                            {uploadingToDrive === doc.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Cloud className="h-4 w-4" />
                            )}
                          </Button>
                        )}

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(doc)
                            setShowWorkflow(true)
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>

                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Signing Dialog */}
      <Dialog open={showSigning} onOpenChange={setShowSigning}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sign Document</DialogTitle>
            <DialogDescription>
              Review and sign the document
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <DocumentSigning
              document={selectedDocument}
              onSignComplete={() => {
                setShowSigning(false)
                fetchDocuments()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Workflow Dialog */}
      <Dialog open={showWorkflow} onOpenChange={setShowWorkflow}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Workflow</DialogTitle>
            <DialogDescription>
              Track the progress of this document through the processing pipeline
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <DocumentWorkflow
              documentId={selectedDocument.id}
              onWorkflowUpdate={() => {
                fetchDocuments()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}