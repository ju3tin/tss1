'use client'

import { useState } from 'react'
import WebsiteForm from '@/components/forms/website-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Code, Copy, ExternalLink, FileText, Settings, Globe } from 'lucide-react'

export default function WebsiteFormExamplePage() {
  const [copiedCode, setCopiedCode] = useState('')

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(type)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const contactFormCode = `<WebsiteForm
  formType="CONTACT"
  title="Contact Wealth Global Partners"
  description="Reach out to our expert team for personalized financial guidance"
  showCompanyField={true}
  showPhoneField={true}
/>`

  const investmentFormCode = `<WebsiteForm
  formType="INVESTMENT_INQUIRY"
  title="Investment Inquiry"
  description="Learn about our investment opportunities and portfolio management services"
  showCompanyField={true}
  showPhoneField={true}
  customFields={[
    {
      name: "investmentAmount",
      label: "Investment Amount Range",
      type: "select",
      required: true,
      options: ["Under $100,000", "$100,000 - $500,000", "$500,000 - $1M", "$1M - $5M", "Over $5M"]
    },
    {
      name: "investmentType",
      label: "Investment Type",
      type: "select",
      required: true,
      options: ["Stocks", "Bonds", "Real Estate", "Commodities", "Mutual Funds", "ETFs", "Alternative Investments"]
    },
    {
      name: "timeHorizon",
      label: "Investment Time Horizon",
      type: "select",
      required: true,
      options: ["Short-term (1-3 years)", "Medium-term (3-7 years)", "Long-term (7+ years)"]
    }
  ]}
/>`

  const iframeIntegrationCode = `<!-- Embed this iframe in your website -->
<iframe 
  src="https://your-domain.com/api/iframe-form?type=CONTACT"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 8px;"
></iframe>`

  const apiIntegrationCode = `// JavaScript integration for your website
async function submitForm(formData) {
  try {
    const response = await fetch('https://your-domain.com/api/form-submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        form_name: 'Website Contact Form',
        form_type: 'CONTACT',
        submission_data: formData,
        contact_email: formData.email,
        contact_name: \`\${formData.firstName} \${formData.lastName}\`,
        priority: 'MEDIUM'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Form submitted successfully:', result);
      // Show success message to user
    } else {
      throw new Error('Form submission failed');
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    // Show error message to user
  }
}

// Example usage:
const formData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  company: 'Example Corp',
  subject: 'Investment Inquiry',
  message: 'I would like to learn more about your services...'
};

submitForm(formData);`

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Website Form Integration Guide</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Connect Wealth Global Partners forms to your website with multiple integration options
        </p>
      </div>

      <Tabs defaultValue="preview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preview">Form Preview</TabsTrigger>
          <TabsTrigger value="react">React Component</TabsTrigger>
          <TabsTrigger value="iframe">iFrame Embed</TabsTrigger>
          <TabsTrigger value="api">API Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contact Form
              </h2>
              <WebsiteForm
                formType="CONTACT"
                title="Contact Wealth Global Partners"
                description="Reach out to our expert team for personalized financial guidance"
                showCompanyField={true}
                showPhoneField={true}
              />
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Investment Inquiry Form
              </h2>
              <WebsiteForm
                formType="INVESTMENT_INQUIRY"
                title="Investment Inquiry"
                description="Learn about our investment opportunities and portfolio management services"
                showCompanyField={true}
                showPhoneField={true}
                customFields={[
                  {
                    name: "investmentAmount",
                    label: "Investment Amount Range",
                    type: "select",
                    required: true,
                    options: ["Under $100,000", "$100,000 - $500,000", "$500,000 - $1M", "$1M - $5M", "Over $5M"]
                  },
                  {
                    name: "investmentType",
                    label: "Investment Type",
                    type: "select",
                    required: true,
                    options: ["Stocks", "Bonds", "Real Estate", "Commodities", "Mutual Funds", "ETFs", "Alternative Investments"]
                  },
                  {
                    name: "timeHorizon",
                    label: "Investment Time Horizon",
                    type: "select",
                    required: true,
                    options: ["Short-term (1-3 years)", "Medium-term (3-7 years)", "Long-term (7+ years)"]
                  }
                ]}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="react" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>React Component Integration</CardTitle>
              <CardDescription>
                Use our pre-built React component in your Next.js or React application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">1. Install Required Dependencies</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <code className="text-sm">npm install @radix-ui/react-select @radix-ui/react-label</code>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">2. Basic Contact Form</h3>
                  <div className="relative">
                    <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto">
                      <code>{contactFormCode}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(contactFormCode, 'contact')}
                    >
                      {copiedCode === 'contact' ? 'Copied!' : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">3. Investment Form with Custom Fields</h3>
                  <div className="relative">
                    <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto">
                      <code>{investmentFormCode}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(investmentFormCode, 'investment')}
                    >
                      {copiedCode === 'investment' ? 'Copied!' : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iframe" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>iFrame Embed Integration</CardTitle>
              <CardDescription>
                Embed forms directly into any website using iframe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">iFrame Code</h3>
                  <div className="relative">
                    <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto">
                      <code>{iframeIntegrationCode}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(iframeIntegrationCode, 'iframe')}
                    >
                      {copiedCode === 'iframe' ? 'Copied!' : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-semibold text-blue-900 mb-2">Available Form Types</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">CONTACT</Badge>
                    <Badge variant="secondary">INVESTMENT_INQUIRY</Badge>
                    <Badge variant="secondary">GENERAL</Badge>
                    <Badge variant="secondary">AML</Badge>
                    <Badge variant="secondary">KYC</Badge>
                    <Badge variant="secondary">DOCUMENT_REQUEST</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Direct API Integration</CardTitle>
              <CardDescription>
                Integrate with our REST API for custom form implementations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">JavaScript Integration</h3>
                  <div className="relative">
                    <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto">
                      <code>{apiIntegrationCode}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(apiIntegrationCode, 'api')}
                    >
                      {copiedCode === 'api' ? 'Copied!' : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-md">
                  <h4 className="font-semibold text-green-900 mb-2">API Endpoint</h4>
                  <p className="text-sm text-green-700 mb-2">
                    <code>POST https://your-domain.com/api/form-submissions</code>
                  </p>
                  <p className="text-sm text-green-700">
                    All submissions are automatically routed to your Wealth Global Partners dashboard for processing and assignment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">1. Choose Integration Method</h3>
              <p className="text-sm text-muted-foreground">
                Select the integration method that best fits your website technology stack.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">2. Customize Form Fields</h3>
              <p className="text-sm text-muted-foreground">
                Add custom fields specific to Wealth Global Partners services and requirements.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">3. Test & Deploy</h3>
              <p className="text-sm text-muted-foreground">
                Test the form integration and deploy it to your wealthglobalpartners.com website.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}