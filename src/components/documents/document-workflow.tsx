"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  FileText,
  User,
  Calendar,
  MessageSquare
} from "lucide-react"

interface WorkflowStep {
  id: string
  step_type: string
  status: string
  step_data?: string
  completed_at?: string
  completed_by?: string
  notes?: string
  error_message?: string
  created_at: string
}

interface DocumentWorkflowProps {
  documentId: string
  onWorkflowUpdate?: () => void
}

export function DocumentWorkflow({ documentId, onWorkflowUpdate }: DocumentWorkflowProps) {
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkflowSteps()
  }, [documentId])

  const fetchWorkflowSteps = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/documents/${documentId}/workflow`)
      if (response.ok) {
        const data = await response.json()
        setWorkflowSteps(data.workflowSteps)
      }
    } catch (error) {
      console.error("Error fetching workflow steps:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStepIcon = (stepType: string, status: string) => {
    if (status === "COMPLETED") {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (status === "PROCESSING") {
      return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
    } else if (status === "REJECTED") {
      return <AlertCircle className="h-5 w-5 text-red-600" />
    } else {
      return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStepLabel = (stepType: string) => {
    switch (stepType) {
      case "UPLOAD": return "Document Upload"
      case "EXTRACTION": return "Form Field Extraction"
      case "VALIDATION": return "Data Validation"
      case "REVIEW": return "Human Review"
      case "ACKNOWLEDGMENT": return "Document Acknowledgment"
      case "SIGNATURE": return "Digital Signature"
      case "COMPLETION": return "Process Completion"
      default: return stepType.replace(/_/g, ' ')
    }
  }

  const getStepDescription = (stepType: string) => {
    switch (stepType) {
      case "UPLOAD": return "Document has been uploaded to the system"
      case "EXTRACTION": return "AI-powered extraction of form fields and data"
      case "VALIDATION": return "Validation of extracted data against business rules"
      case "REVIEW": return "Human review of extracted data and document content"
      case "ACKNOWLEDGMENT": return "User acknowledgment of document terms and conditions"
      case "SIGNATURE": return "Digital signature collection and verification"
      case "COMPLETION": return "Final processing and archival of completed document"
      default: return "Processing step"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-800"
      case "PROCESSING": return "bg-blue-100 text-blue-800"
      case "PENDING": return "bg-gray-100 text-gray-800"
      case "REJECTED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressPercentage = () => {
    if (workflowSteps.length === 0) return 0
    const completedSteps = workflowSteps.filter(step => step.status === "COMPLETED").length
    return Math.round((completedSteps / workflowSteps.length) * 100)
  }

  const handleRetryStep = async (stepId: string) => {
    setProcessing(stepId)
    try {
      const response = await fetch(`/api/documents/${documentId}/workflow/${stepId}/retry`, {
        method: "POST"
      })
      if (response.ok) {
        await fetchWorkflowSteps()
        onWorkflowUpdate?.()
      }
    } catch (error) {
      console.error("Error retrying step:", error)
    } finally {
      setProcessing(null)
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Not completed"
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading workflow...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Workflow
        </CardTitle>
        <CardDescription>
          Track the progress of your document through the processing pipeline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{getProgressPercentage()}%</span>
          </div>
          <Progress value={getProgressPercentage()} className="w-full" />
        </div>

        {/* Workflow Steps */}
        <div className="space-y-4">
          {workflowSteps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Timeline Line */}
              {index < workflowSteps.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-border" />
              )}

              <div className="flex gap-4">
                {/* Step Icon */}
                <div className="flex-shrink-0">
                  {getStepIcon(step.step_type, step.status)}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{getStepLabel(step.step_type)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {getStepDescription(step.step_type)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(step.status)}>
                      {step.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {/* Step Details */}
                  <div className="space-y-2 text-sm">
                    {step.completed_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Completed: {formatDateTime(step.completed_at)}</span>
                      </div>
                    )}
                    
                    {step.completed_by && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>By: {step.completed_by}</span>
                      </div>
                    )}

                    {step.notes && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{step.notes}</span>
                      </div>
                    )}

                    {step.error_message && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{step.error_message}</AlertDescription>
                      </Alert>
                    )}

                    {/* Retry Button for Failed Steps */}
                    {step.status === "REJECTED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetryStep(step.id)}
                        disabled={processing === step.id}
                        className="mt-2"
                      >
                        {processing === step.id ? (
                          <>
                            <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Retry Step
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Workflow Summary */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {workflowSteps.filter(s => s.status === "COMPLETED").length}
              </div>
              <div className="text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {workflowSteps.filter(s => s.status === "PROCESSING").length}
              </div>
              <div className="text-muted-foreground">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {workflowSteps.filter(s => s.status === "PENDING").length}
              </div>
              <div className="text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {workflowSteps.filter(s => s.status === "REJECTED").length}
              </div>
              <div className="text-muted-foreground">Failed</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}