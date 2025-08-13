'use client'

import { useState } from 'react'
import WebsiteForm from '@/components/forms/website-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Code, Copy, Check } from 'lucide-react'

export default function FormEmbedExample() {
  const [copied, setCopied] = useState('')

  const formExamples = [
    {
      type: 'CONTACT',
      name: 'Contact Form',
      description: 'Basic contact form for general inquiries',
      code: `<WebsiteForm
  formName="Contact Form"
  formType="CONTACT"
  title="Get in Touch"
  description="We'd love to hear from you. Send us a message and we'll respond as soon as possible."
  onSuccess={(data) => console.log('Form submitted:', data)}
/>`
    },
    {
      type: 'AML',
      name: 'AML Form',
      description: 'Anti-Money Laundering compliance form',
      code: `<WebsiteForm
  formName="AML Compliance Form"
  formType="AML"
  title="AML Compliance Form"
  description="Please complete this Anti-Money Laundering compliance form."
  showBranding={false}
/>`
    },
    {
      type: 'KYC',
      name: 'KYC Form',
      description: 'Know Your Customer verification form',
      code: `<WebsiteForm
  formName="KYC Verification"
  formType="KYC"
  title="KYC Verification"
  description="Complete this form to verify your identity for investment purposes."
/>`
    },
    {
      type: 'INVESTMENT_INQUIRY',
      name: 'Investment Inquiry',
      description: 'Investment opportunity inquiry form',
      code: `<WebsiteForm
  formName="Investment Inquiry"
  formType="INVESTMENT_INQUIRY"
  title="Investment Inquiry"
  description="Interested in our investment opportunities? Tell us about yourself."
/>`
    }
  ]

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Form Integration Examples</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Embed these forms in your website to collect submissions that automatically integrate with your form management system
        </p>
      </div>

      <Tabs defaultValue="contact" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          {formExamples.map((example) => (
            <TabsTrigger key={example.type} value={example.type.toLowerCase()}>
              {example.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {formExamples.map((example) => (
          <TabsContent key={example.type} value={example.type.toLowerCase()} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Form Preview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{example.name}</CardTitle>
                      <CardDescription>{example.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{example.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <WebsiteForm
                      formName={example.name}
                      formType={example.type as any}
                      title={example.name}
                      description={example.description}
                      showBranding={false}
                      onSuccess={(data) => {
                        console.log('Form submitted:', data)
                        alert('Form submitted successfully! Check the console for details.')
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Code Example */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Integration Code</CardTitle>
                      <CardDescription>
                        Copy this code to embed the form in your website
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(example.code, example.type)}
                    >
                      {copied === example.type ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{example.code}</code>
                    </pre>
                    {copied === example.type && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                        Copied!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Instructions</CardTitle>
          <CardDescription>
            Follow these steps to integrate the forms with your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <h3 className="font-medium">Install Component</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Import the WebsiteForm component in your React application
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <h3 className="font-medium">Configure Form</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Set the form type, name, and customize fields as needed
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <h3 className="font-medium">Embed & Test</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Add the form to your website and test the submission flow
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Reference</CardTitle>
          <CardDescription>
            Complete documentation for the WebsiteForm component props
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium">Required Props</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <code className="bg-gray-100 px-1 rounded">formName</code>
                    <p className="text-muted-foreground">string - Name of the form</p>
                  </div>
                  <div>
                    <code className="bg-gray-100 px-1 rounded">formType</code>
                    <p className="text-muted-foreground">FormType - Type of form (CONTACT, AML, KYC, etc.)</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Optional Props</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <code className="bg-gray-100 px-1 rounded">title</code>
                    <p className="text-muted-foreground">string - Form title</p>
                  </div>
                  <div>
                    <code className="bg-gray-100 px-1 rounded">description</code>
                    <p className="text-muted-foreground">string - Form description</p>
                  </div>
                  <div>
                    <code className="bg-gray-100 px-1 rounded">fields</code>
                    <p className="text-muted-foreground">FormField[] - Custom form fields</p>
                  </div>
                  <div>
                    <code className="bg-gray-100 px-1 rounded">showBranding</code>
                    <p className="text-muted-foreground">boolean - Show powered by branding</p>
                  </div>
                  <div>
                    <code className="bg-gray-100 px-1 rounded">onSuccess</code>
                    <p className="text-muted-foreground">function - Success callback</p>
                  </div>
                  <div>
                    <code className="bg-gray-100 px-1 rounded">onError</code>
                    <p className="text-muted-foreground">function - Error callback</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}