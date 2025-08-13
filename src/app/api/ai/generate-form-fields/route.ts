import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { prompt, formType, formName } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    const systemPrompt = `You are an expert form builder for Wealth Global Partners, a financial services company. Based on the user's request, generate:

1. Form fields in JSON format with the following structure:
[
  {
    "name": "field_name",
    "label": "Field Label",
    "type": "text|email|tel|select|textarea|number|date",
    "required": true|false,
    "placeholder": "Placeholder text",
    "options": ["option1", "option2"] // only for select type
  }
]

2. Ready-to-use React component code using the WebsiteForm component.

The form should be professional, user-friendly, and appropriate for financial services. Include fields that are commonly needed for ${formType} forms.

Form name: ${formName || 'Contact Form'}
Form type: ${formType || 'CONTACT'}

User request: ${prompt}

Respond with JSON format:
{
  "fields": "JSON string of fields array",
  "code": "React component code string"
}`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const responseContent = completion.choices[0]?.message?.content

    if (!responseContent) {
      throw new Error('No response from AI')
    }

    try {
      const parsedResponse = JSON.parse(responseContent)
      return NextResponse.json({
        fields: parsedResponse.fields,
        code: parsedResponse.code
      })
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      // Fallback response if JSON parsing fails
      return NextResponse.json({
        fields: JSON.stringify([
          {
            name: "name",
            label: "Full Name",
            type: "text",
            required: true,
            placeholder: "Enter your full name"
          },
          {
            name: "email",
            label: "Email Address",
            type: "email",
            required: true,
            placeholder: "Enter your email address"
          },
          {
            name: "message",
            label: "Message",
            type: "textarea",
            required: true,
            placeholder: "How can we help you?"
          }
        ]),
        code: `<WebsiteForm
  formType="${formType}"
  title="${formName || 'Contact Form'}"
  description="Get in touch with our team"
  showCompanyField={true}
  showPhoneField={true}
/>`
      })
    }

  } catch (error) {
    console.error('Error generating form fields:', error)
    return NextResponse.json(
      { error: 'Failed to generate form fields' },
      { status: 500 }
    )
  }
}