"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Edit, Trash2, Building2, Mail, Phone, Eye } from "lucide-react"
import { InvestorType } from "@prisma/client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { InlineCompanyForm } from "@/components/forms/inline-company-form"

interface Contact {
  id: string
  full_name: string
  email: string
  phone_number?: string
  investor_type: InvestorType
  source?: string
  associated_company_id?: string
  created_at: string
  associated_company?: {
    id: string
    name: string
  }
}

interface Company {
  id: string
  name: string
  company_type: string
}

export default function ContactsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [contacts, setContacts] = useState<Contact[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    investor_type: "INDIVIDUAL" as InvestorType,
    source: "",
    associated_company_id: "",
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    
    fetchContacts()
    fetchCompanies()
  }, [session, status, router])

  if (status === "loading") {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </MainLayout>
    )
  }

  if (!session) {
    return null
  }

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts")
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies")
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error)
    }
  }

  const handleCompanyCreated = (newCompany: { id: string; name: string; company_type: string }) => {
    // Add the new company to the companies list
    setCompanies(prev => [...prev, newCompany])
    // Automatically select the newly created company
    setFormData(prev => ({ ...prev, associated_company_id: newCompany.id }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = editingContact ? `/api/contacts/${editingContact.id}` : "/api/contacts"
    const method = editingContact ? "PUT" : "POST"
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchContacts()
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Failed to save contact:", error)
    }
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      full_name: contact.full_name,
      email: contact.email,
      phone_number: contact.phone_number || "",
      investor_type: contact.investor_type,
      source: contact.source || "",
      associated_company_id: contact.associated_company_id || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (contactId: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      try {
        const response = await fetch(`/api/contacts/${contactId}`, {
          method: "DELETE",
        })
        if (response.ok) {
          await fetchContacts()
        }
      } catch (error) {
        console.error("Failed to delete contact:", error)
      }
    }
  }

  const resetForm = () => {
    setEditingContact(null)
    setFormData({
      full_name: "",
      email: "",
      phone_number: "",
      investor_type: "INDIVIDUAL",
      source: "",
      associated_company_id: "",
    })
  }

  const getInvestorTypeBadgeColor = (type: InvestorType) => {
    switch (type) {
      case "INDIVIDUAL":
        return "default"
      case "FAMILY_OFFICE":
        return "secondary"
      case "INSTITUTIONAL":
        return "destructive"
      case "PROJECT_FUND":
        return "outline"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading contacts...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">
              Manage your investor contacts and relationships
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingContact ? "Edit Contact" : "Add New Contact"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingContact 
                      ? "Update the contact information below."
                      : "Create a new contact in your CRM."
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="full_name" className="text-right">
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone_number" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="investor_type" className="text-right">
                      Investor Type
                    </Label>
                    <Select value={formData.investor_type} onValueChange={(value) => setFormData({ ...formData, investor_type: value as InvestorType })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select investor type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                        <SelectItem value="FAMILY_OFFICE">Family Office</SelectItem>
                        <SelectItem value="INSTITUTIONAL">Institutional</SelectItem>
                        <SelectItem value="PROJECT_FUND">Project/Fund</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="source" className="text-right">
                      Source
                    </Label>
                    <Input
                      id="source"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="col-span-3"
                      placeholder="e.g., Referral, Conference, Website"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company" className="text-right">
                      Company
                    </Label>
                    <div className="col-span-3 flex gap-2">
                      <Select value={formData.associated_company_id || "none"} onValueChange={(value) => setFormData({ ...formData, associated_company_id: value === "none" ? "" : value })}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select company (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Company</SelectItem>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCompanyFormOpen(true)}
                        className="px-3"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    {editingContact ? "Update Contact" : "Create Contact"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Contacts</CardTitle>
            <CardDescription>
              A list of all contacts in your CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium"
                        onClick={() => router.push(`/contacts/${contact.id}`)}
                      >
                        {contact.full_name}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </div>
                        {contact.phone_number && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {contact.phone_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getInvestorTypeBadgeColor(contact.investor_type)}>
                        {contact.investor_type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contact.associated_company ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3" />
                          {contact.associated_company.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.source || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/contacts/${contact.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(contact.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <InlineCompanyForm
        isOpen={isCompanyFormOpen}
        onClose={() => setIsCompanyFormOpen(false)}
        onSuccess={handleCompanyCreated}
      />
    </MainLayout>
  )
}