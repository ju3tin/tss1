"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Upload, Building2, User, FileText, CheckCircle } from "lucide-react"
import { InvestorType, CompanyType } from "@prisma/client"

interface OnboardingData {
  // Contact Information
  fullName: string
  email: string
  phoneNumber: string
  investorType: InvestorType
  
  // Company Information (if applicable)
  companyName: string
  companyType: CompanyType
  companyRegion: string
  companyVertical: string
  companyAUM: string
  ticketSizeRange: string
  
  // Deal Information
  dealName: string
  dealDescription: string
  
  // Documents
  idDocument: File | null
  passportDocument: File | null
  companyCertDocument: File | null
  amlDocument: File | null
  pitchDeckDocument: File | null
  
  // Terms
  acceptTerms: boolean
  acceptPrivacy: boolean
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<OnboardingData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    investorType: InvestorType.INDIVIDUAL,
    companyName: "",
    companyType: CompanyType.FAMILY_OFFICE,
    companyRegion: "",
    companyVertical: "",
    companyAUM: "",
    ticketSizeRange: "",
    dealName: "",
    dealDescription: "",
    idDocument: null,
    passportDocument: null,
    companyCertDocument: null,
    amlDocument: null,
    pitchDeckDocument: null,
    acceptTerms: false,
    acceptPrivacy: false,
  })

  const handleInputChange = (field: keyof OnboardingData, value: string | File | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (field: keyof OnboardingData, file: File) => {
    setFormData(prev => ({ ...prev, [field]: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Create FormData for file upload
      const submitData = new FormData()
      
      // Add contact and company information
      submitData.append('fullName', formData.fullName)
      submitData.append('email', formData.email)
      submitData.append('phoneNumber', formData.phoneNumber)
      submitData.append('investorType', formData.investorType)
      submitData.append('companyName', formData.companyName)
      submitData.append('companyType', formData.companyType)
      submitData.append('companyRegion', formData.companyRegion)
      submitData.append('companyVertical', formData.companyVertical)
      submitData.append('companyAUM', formData.companyAUM)
      submitData.append('ticketSizeRange', formData.ticketSizeRange)
      submitData.append('dealName', formData.dealName)
      submitData.append('dealDescription', formData.dealDescription)

      // Add documents
      if (formData.idDocument) {
        submitData.append('idDocument', formData.idDocument)
      }
      if (formData.passportDocument) {
        submitData.append('passportDocument', formData.passportDocument)
      }
      if (formData.companyCertDocument) {
        submitData.append('companyCertDocument', formData.companyCertDocument)
      }
      if (formData.amlDocument) {
        submitData.append('amlDocument', formData.amlDocument)
      }
      if (formData.pitchDeckDocument) {
        submitData.append('pitchDeckDocument', formData.pitchDeckDocument)
      }

      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        body: submitData,
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        alert('There was an error submitting your application. Please try again.')
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert('There was an error submitting your application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)

  const isStepComplete = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return formData.fullName && formData.email && formData.phoneNumber
      case 2:
        if (formData.investorType === InvestorType.INDIVIDUAL) return true
        return formData.companyName && formData.companyType
      case 3:
        return formData.dealName
      case 4:
        return formData.acceptTerms && formData.acceptPrivacy
      default:
        return false
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Application Submitted!</CardTitle>
            <CardDescription>
              Thank you for your interest in partnering with WGP. We have received your application and will review it shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              You will receive a confirmation email shortly. Our team will reach out to you within 2-3 business days.
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Investor Onboarding</CardTitle>
          <CardDescription className="text-lg">
            Partner with Wealth Generation Partners - Complete your application in {4} simple steps
          </CardDescription>
          
          {/* Progress Steps */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === stepNumber
                        ? "bg-primary text-primary-foreground"
                        : step > stepNumber
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step > stepNumber ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                  </div>
                  {stepNumber < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        step > stepNumber ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Contact Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="investorType">Investor Type *</Label>
                    <Select value={formData.investorType} onValueChange={(value) => handleInputChange('investorType', value as InvestorType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select investor type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={InvestorType.INDIVIDUAL}>Individual Investor</SelectItem>
                        <SelectItem value={InvestorType.FAMILY_OFFICE}>Family Office</SelectItem>
                        <SelectItem value={InvestorType.INSTITUTIONAL}>Institutional Investor</SelectItem>
                        <SelectItem value={InvestorType.PROJECT_FUND}>Project/Fund</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Company Information */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Company Information</h3>
                </div>
                
                {formData.investorType !== InvestorType.INDIVIDUAL && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="companyType">Company Type *</Label>
                      <Select value={formData.companyType} onValueChange={(value) => handleInputChange('companyType', value as CompanyType)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CompanyType.FAMILY_OFFICE}>Family Office</SelectItem>
                          <SelectItem value={CompanyType.PROJECT}>Project</SelectItem>
                          <SelectItem value={CompanyType.FUND}>Fund</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="companyRegion">Region/Country</Label>
                      <Input
                        id="companyRegion"
                        value={formData.companyRegion}
                        onChange={(e) => handleInputChange('companyRegion', e.target.value)}
                        placeholder="e.g., United States, Europe, Asia"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="companyVertical">Industry Vertical</Label>
                      <Input
                        id="companyVertical"
                        value={formData.companyVertical}
                        onChange={(e) => handleInputChange('companyVertical', e.target.value)}
                        placeholder="e.g., Technology, Healthcare, Real Estate"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="companyAUM">Assets Under Management (USD)</Label>
                      <Input
                        id="companyAUM"
                        value={formData.companyAUM}
                        onChange={(e) => handleInputChange('companyAUM', e.target.value)}
                        placeholder="e.g., 100000000"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="ticketSizeRange">Typical Investment Range</Label>
                      <Input
                        id="ticketSizeRange"
                        value={formData.ticketSizeRange}
                        onChange={(e) => handleInputChange('ticketSizeRange', e.target.value)}
                        placeholder="e.g., $1M - $5M"
                      />
                    </div>
                  </div>
                )}
                
                {formData.investorType === InvestorType.INDIVIDUAL && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      As an individual investor, company information is not required.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Deal Information */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Investment Opportunity</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dealName">Deal/Project Name *</Label>
                    <Input
                      id="dealName"
                      value={formData.dealName}
                      onChange={(e) => handleInputChange('dealName', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dealDescription">Project Description</Label>
                    <Textarea
                      id="dealDescription"
                      value={formData.dealDescription}
                      onChange={(e) => handleInputChange('dealDescription', e.target.value)}
                      placeholder="Please provide a brief description of your investment opportunity..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Required Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="idDocument">ID Document</Label>
                      <Input
                        id="idDocument"
                        type="file"
                        onChange={(e) => e.target.files?.[0] && handleInputChange('idDocument', e.target.files[0])}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="passportDocument">Passport (if applicable)</Label>
                      <Input
                        id="passportDocument"
                        type="file"
                        onChange={(e) => e.target.files?.[0] && handleInputChange('passportDocument', e.target.files[0])}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </div>
                    
                    {formData.investorType !== InvestorType.INDIVIDUAL && (
                      <>
                        <div>
                          <Label htmlFor="companyCertDocument">Company Certificate</Label>
                          <Input
                            id="companyCertDocument"
                            type="file"
                            onChange={(e) => e.target.files?.[0] && handleInputChange('companyCertDocument', e.target.files[0])}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="amlDocument">AML Documentation</Label>
                          <Input
                            id="amlDocument"
                            type="file"
                            onChange={(e) => e.target.files?.[0] && handleInputChange('amlDocument', e.target.files[0])}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                        </div>
                      </>
                    )}
                    
                    <div>
                      <Label htmlFor="pitchDeckDocument">Pitch Deck</Label>
                      <Input
                        id="pitchDeckDocument"
                        type="file"
                        onChange={(e) => e.target.files?.[0] && handleInputChange('pitchDeckDocument', e.target.files[0])}
                        accept=".pdf,.ppt,.pptx"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Terms and Conditions */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Terms and Conditions</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Terms of Service</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      By submitting this application, you agree to our terms of service and understand that:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• All information provided is accurate and complete</li>
                      <li>• You authorize WGP to conduct necessary due diligence</li>
                      <li>• All documents submitted are authentic and valid</li>
                      <li>• You understand that investment decisions are subject to WGP's review process</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Privacy Policy</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      We respect your privacy and are committed to protecting your personal information:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Your information will be used solely for investment evaluation purposes</li>
                      <li>• We will not share your information with third parties without consent</li>
                      <li>• All data is stored securely and in compliance with regulations</li>
                      <li>• You may request deletion of your information at any time</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="acceptTerms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                      />
                      <Label htmlFor="acceptTerms" className="text-sm">
                        I accept the Terms of Service *
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="acceptPrivacy"
                        checked={formData.acceptPrivacy}
                        onCheckedChange={(checked) => handleInputChange('acceptPrivacy', checked as boolean)}
                      />
                      <Label htmlFor="acceptPrivacy" className="text-sm">
                        I accept the Privacy Policy *
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
              >
                Previous
              </Button>
              
              <div className="flex space-x-2">
                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepComplete(step)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitting || !isStepComplete(step)}
                  >
                    {submitting ? "Submitting..." : "Submit Application"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}