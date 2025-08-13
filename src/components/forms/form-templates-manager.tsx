'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  FileText, 
  User as UserIcon,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Copy,
  Code,
  Wand2
} from 'lucide-react'
import { FormTemplate, User } from '@prisma/client'

interface FormTemplateWithDetails extends FormTemplate {
  created_by: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  auto_assign_to_user?: {
    id: string
    first_name: string
    last_name: string
    email: string
  } | null
}

interface FormTemplatesManagerProps {
  user: User
}

export default function FormTemplatesManager({ user }: FormTemplatesManagerProps) {
  const [templates, setTemplates] = useState<FormTemplateWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplateWithDetails | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [creatingTemplate, setCreatingTemplate] = useState(false)
  
  // AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGeneratedFields, setAiGeneratedFields] = useState('')
  const [aiGeneratedCode, setAiGeneratedCode] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    form_type: 'CONTACT',
    form_fields: JSON.stringify([
      {
        "name": "firstName",
        "label": "First Name",
        "type": "text",
        "required": true,
        "placeholder": "Enter your first name"
      },
      {
        "name": "lastName",
        "label": "Last Name",
        "type": "text",
        "required": true,
        "placeholder": "Enter your last name"
      },
      {
        "name": "email",
        "label": "Email Address",
        "type": "email",
        "required": true,
        "placeholder": "Enter your email address"
      },
      {
        "name": "phone",
        "label": "Phone Number",
        "type": "tel",
        "required": false,
        "placeholder": "Enter your phone number"
      },
      {
        "name": "message",
        "label": "Message",
        "type": "textarea",
        "required": true,
        "placeholder": "How can we help you?"
      }
    ], null, 2),
    validation_rules: '{}',
    auto_assign_to: 'none',
    priority: 'MEDIUM',
    is_active: true
  })

  useEffect(() => {
    fetchTemplates()
    fetchUsers()
  }, [])

  // AI Assistant Functions
  const generateFormFields = async () => {
    if (!aiPrompt.trim()) return

    setAiLoading(true)
    try {
      const response = await fetch('/api/ai/generate-form-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          formType: formData.form_type,
          formName: formData.name
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiGeneratedFields(data.fields)
        setAiGeneratedCode(data.code)
      } else {
        throw new Error('Failed to generate form fields')
      }
    } catch (error) {
      console.error('Error generating form fields:', error)
      setAiGeneratedFields('Error generating form fields. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const applyGeneratedFields = () => {
    if (aiGeneratedFields) {
      setFormData(prev => ({
        ...prev,
        form_fields: aiGeneratedFields
      }))
      setShowAIAssistant(false)
    }
  }

  const copyGeneratedCode = async () => {
    if (aiGeneratedCode) {
      try {
        await navigator.clipboard.writeText(aiGeneratedCode)
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      } catch (error) {
        console.error('Failed to copy code:', error)
      }
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/form-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCreateTemplate = async () => {
    setCreatingTemplate(true)
    try {
      // Validate form_fields is valid JSON
      let parsedFormFields
      try {
        parsedFormFields = JSON.parse(formData.form_fields)
        if (!Array.isArray(parsedFormFields)) {
          throw new Error('Form fields must be an array')
        }
      } catch (error) {
        alert('Form Fields must be valid JSON array. Please check your form fields configuration.')
        return
      }

      // Validate validation_rules if provided
      if (formData.validation_rules && formData.validation_rules !== '{}') {
        try {
          JSON.parse(formData.validation_rules)
        } catch (error) {
          alert('Validation Rules must be valid JSON. Please check your validation rules configuration.')
          return
        }
      }

      console.log('Creating template with data:', {
        ...formData,
        auto_assign_to: formData.auto_assign_to === 'none' ? null : formData.auto_assign_to
      })

      const response = await fetch('/api/form-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          auto_assign_to: formData.auto_assign_to === 'none' ? null : formData.auto_assign_to
        })
      })

      if (response.ok) {
        setShowCreateDialog(false)
        resetForm()
        fetchTemplates()
      } else {
        const errorData = await response.json()
        alert(`Failed to create template: ${errorData.error || 'Unknown error'}`)
        console.error('Template creation error:', errorData)
      }
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Failed to create template. Please try again.')
    } finally {
      setCreatingTemplate(false)
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return

    try {
      const response = await fetch(`/api/form-templates/${selectedTemplate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          auto_assign_to: formData.auto_assign_to === 'none' ? null : formData.auto_assign_to
        })
      })

      if (response.ok) {
        setShowEditDialog(false)
        resetForm()
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error updating template:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/form-templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      form_type: 'CONTACT',
      form_fields: JSON.stringify([
        {
          "name": "firstName",
          "label": "First Name",
          "type": "text",
          "required": true,
          "placeholder": "Enter your first name"
        },
        {
          "name": "lastName",
          "label": "Last Name",
          "type": "text",
          "required": true,
          "placeholder": "Enter your last name"
        },
        {
          "name": "email",
          "label": "Email Address",
          "type": "email",
          "required": true,
          "placeholder": "Enter your email address"
        },
        {
          "name": "phone",
          "label": "Phone Number",
          "type": "tel",
          "required": false,
          "placeholder": "Enter your phone number"
        },
        {
          "name": "message",
          "label": "Message",
          "type": "textarea",
          "required": true,
          "placeholder": "How can we help you?"
        }
      ], null, 2),
      validation_rules: '{}',
      auto_assign_to: 'none',
      priority: 'MEDIUM',
      is_active: true
    })
    setSelectedTemplate(null)
    // Reset AI assistant state
    setAiPrompt('')
    setAiGeneratedFields('')
    setAiGeneratedCode('')
    setShowAIAssistant(false)
  }

  const openEditDialog = (template: FormTemplateWithDetails) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      form_type: template.form_type,
      form_fields: template.form_fields,
      validation_rules: template.validation_rules || '{}',
      auto_assign_to: template.auto_assign_to || 'none',
      priority: template.priority,
      is_active: template.is_active
    })
    setShowEditDialog(true)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CONTACT': return 'bg-blue-100 text-blue-800'
      case 'AML': return 'bg-red-100 text-red-800'
      case 'KYC': return 'bg-orange-100 text-orange-800'
      case 'INVESTMENT_INQUIRY': return 'bg-green-100 text-green-800'
      case 'DOCUMENT_REQUEST': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form Templates</h1>
          <p className="text-muted-foreground">
            Manage form templates and auto-assignment rules
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Form Template</DialogTitle>
              <DialogDescription>
                Create a new form template with auto-assignment rules
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <Label htmlFor="form_type">Form Type</Label>
                  <Select value={formData.form_type} onValueChange={(value) => setFormData({ ...formData, form_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONTACT">Contact</SelectItem>
                      <SelectItem value="AML">AML</SelectItem>
                      <SelectItem value="KYC">KYC</SelectItem>
                      <SelectItem value="INVESTMENT_INQUIRY">Investment Inquiry</SelectItem>
                      <SelectItem value="DOCUMENT_REQUEST">Document Request</SelectItem>
                      <SelectItem value="GENERAL">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter template description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="auto_assign_to">Auto-assign To</Label>
                  <Select value={formData.auto_assign_to} onValueChange={(value) => setFormData({ ...formData, auto_assign_to: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No auto-assignment</SelectItem>
                      {users && users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* AI Assistant Section */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="form_fields">Form Fields (JSON)</Label>
                  <p className="text-sm text-muted-foreground">Define your form fields or use AI Assistant to generate them</p>
                </div>
                <Dialog open={showAIAssistant} onOpenChange={setShowAIAssistant}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Assistant
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5" />
                        AI Form Assistant
                      </DialogTitle>
                      <DialogDescription>
                        Describe what kind of form fields you need, and our AI will generate them for you along with ready-to-use website code.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="ai_prompt">Describe your form requirements</Label>
                        <Textarea
                          id="ai_prompt"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="e.g., I need a contact form for wealth management clients with fields for name, email, phone, investment amount, and risk tolerance..."
                          className="mt-2"
                          rows={4}
                        />
                      </div>
                      
                      <Button 
                        onClick={generateFormFields} 
                        disabled={!aiPrompt.trim() || aiLoading}
                        className="w-full"
                      >
                        {aiLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating Form Fields...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Form Fields & Code
                          </>
                        )}
                      </Button>
                      
                      {aiGeneratedFields && (
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label>Generated Form Fields (JSON)</Label>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={applyGeneratedFields}
                                className="flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Apply to Template
                              </Button>
                            </div>
                            <Textarea
                              value={aiGeneratedFields}
                              readOnly
                              className="font-mono text-sm"
                              rows={8}
                            />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label>Website Code (Copy & Paste)</Label>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={copyGeneratedCode}
                                className="flex items-center gap-2"
                              >
                                {copiedCode ? (
                                  <>
                                    <CheckCircle className="h-4 w-4" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4" />
                                    Copy Code
                                  </>
                                )}
                              </Button>
                            </div>
                            <Textarea
                              value={aiGeneratedCode}
                              readOnly
                              className="font-mono text-sm"
                              rows={12}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div>
                <Textarea
                  id="form_fields"
                  value={formData.form_fields}
                  onChange={(e) => setFormData({ ...formData, form_fields: e.target.value })}
                  placeholder="Enter form field definitions as JSON"
                  className="font-mono text-sm"
                  rows={6}
                />
              </div>
              
              <div>
                <Label htmlFor="validation_rules">Validation Rules (JSON)</Label>
                <Textarea
                  id="validation_rules"
                  value={formData.validation_rules}
                  onChange={(e) => setFormData({ ...formData, validation_rules: e.target.value })}
                  placeholder="Enter validation rules as JSON (optional)"
                  className="font-mono text-sm"
                  rows={4}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate} disabled={!formData.name || creatingTemplate}>
                  {creatingTemplate ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Template'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(template.form_type)}>
                      {template.form_type}
                    </Badge>
                    <Badge className={getPriorityColor(template.priority)}>
                      {template.priority}
                    </Badge>
                    {!template.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.description && (
                <p className="text-sm text-muted-foreground">{template.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="h-4 w-4" />
                  <span>Created by {template.created_by.first_name} {template.created_by.last_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(template.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              {template.auto_assign_to_user && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">Auto-assign to:</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {template.auto_assign_to_user.first_name[0]}{template.auto_assign_to_user.last_name[0]}
                      </span>
                    </div>
                    <span className="text-sm">
                      {template.auto_assign_to_user.first_name} {template.auto_assign_to_user.last_name}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{JSON.parse(template.form_fields).length || 0} fields defined</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No form templates yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first form template to start managing form submissions
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Form Template</DialogTitle>
            <DialogDescription>
              Update form template and auto-assignment rules
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_name">Template Name</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="edit_form_type">Form Type</Label>
                <Select value={formData.form_type} onValueChange={(value) => setFormData({ ...formData, form_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONTACT">Contact</SelectItem>
                    <SelectItem value="AML">AML</SelectItem>
                    <SelectItem value="KYC">KYC</SelectItem>
                    <SelectItem value="INVESTMENT_INQUIRY">Investment Inquiry</SelectItem>
                    <SelectItem value="DOCUMENT_REQUEST">Document Request</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter template description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_auto_assign_to">Auto-assign To</Label>
                <Select value={formData.auto_assign_to} onValueChange={(value) => setFormData({ ...formData, auto_assign_to: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No auto-assignment</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_form_fields">Form Fields (JSON)</Label>
              <Textarea
                id="edit_form_fields"
                value={formData.form_fields}
                onChange={(e) => setFormData({ ...formData, form_fields: e.target.value })}
                placeholder="Enter form field definitions as JSON"
                className="font-mono text-sm"
                rows={6}
              />
            </div>
            
            <div>
              <Label htmlFor="edit_validation_rules">Validation Rules (JSON)</Label>
              <Textarea
                id="edit_validation_rules"
                value={formData.validation_rules}
                onChange={(e) => setFormData({ ...formData, validation_rules: e.target.value })}
                placeholder="Enter validation rules as JSON (optional)"
                className="font-mono text-sm"
                rows={4}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit_is_active">Active</Label>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTemplate} disabled={!formData.name}>
                Update Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}