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
import { Plus, Edit, Trash2, Building2, Users, MapPin, DollarSign } from "lucide-react"
import { CompanyType } from "@prisma/client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { InlineContactForm } from "@/components/forms/inline-contact-form"

interface Company {
  id: string
  name: string
  company_type: CompanyType
  region?: string
  vertical?: string
  aum?: number
  ticket_size_range?: string
  primary_contact_id?: string
  created_at: string
  primary_contact?: {
    id: string
    full_name: string
    email: string
  }
}

interface Contact {
  id: string
  full_name: string
  email: string
}

export default function CompaniesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isContactFormOpen, setIsContactFormOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    company_type: "FAMILY_OFFICE" as CompanyType,
    region: "",
    vertical: "",
    aum: "",
    ticket_size_range: "",
    primary_contact_id: "",
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    
    fetchCompanies()
    fetchContacts()
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

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies")
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error)
    } finally {
      setLoading(false)
    }
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
    }
  }

  const handleContactCreated = (newContact: { id: string; full_name: string; email: string }) => {
    // Add the new contact to the contacts list
    setContacts(prev => [...prev, newContact])
    // Automatically select the newly created contact
    setFormData(prev => ({ ...prev, primary_contact_id: newContact.id }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = editingCompany ? `/api/companies/${editingCompany.id}` : "/api/companies"
    const method = editingCompany ? "PUT" : "POST"
    
    const payload = {
      ...formData,
      aum: formData.aum ? parseFloat(formData.aum) : null,
    }
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await fetchCompanies()
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Failed to save company:", error)
    }
  }

  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      company_type: company.company_type,
      region: company.region || "",
      vertical: company.vertical || "",
      aum: company.aum?.toString() || "",
      ticket_size_range: company.ticket_size_range || "",
      primary_contact_id: company.primary_contact_id || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (companyId: string) => {
    if (confirm("Are you sure you want to delete this company?")) {
      try {
        const response = await fetch(`/api/companies/${companyId}`, {
          method: "DELETE",
        })
        if (response.ok) {
          await fetchCompanies()
        }
      } catch (error) {
        console.error("Failed to delete company:", error)
      }
    }
  }

  const resetForm = () => {
    setEditingCompany(null)
    setFormData({
      name: "",
      company_type: "FAMILY_OFFICE",
      region: "",
      vertical: "",
      aum: "",
      ticket_size_range: "",
      primary_contact_id: "",
    })
  }

  const getCompanyTypeBadgeColor = (type: CompanyType) => {
    switch (type) {
      case "FAMILY_OFFICE":
        return "default"
      case "PROJECT":
        return "secondary"
      case "FUND":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatAUM = (aum?: number) => {
    if (!aum) return "-"
    if (aum >= 1000000000) return `$${(aum / 1000000000).toFixed(1)}B`
    if (aum >= 1000000) return `$${(aum / 1000000).toFixed(1)}M`
    return `$${aum.toLocaleString()}`
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading companies...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground">
              Manage companies, family offices, and investment funds
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingCompany ? "Edit Company" : "Add New Company"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCompany 
                      ? "Update the company information below."
                      : "Create a new company in your CRM."
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Company Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company_type" className="text-right">
                      Type
                    </Label>
                    <Select value={formData.company_type} onValueChange={(value) => setFormData({ ...formData, company_type: value as CompanyType })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select company type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FAMILY_OFFICE">Family Office</SelectItem>
                        <SelectItem value="PROJECT">Project</SelectItem>
                        <SelectItem value="FUND">Fund</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="region" className="text-right">
                      Region
                    </Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="col-span-3"
                      placeholder="e.g., North America, Europe, Asia"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="vertical" className="text-right">
                      Vertical
                    </Label>
                    <Input
                      id="vertical"
                      value={formData.vertical}
                      onChange={(e) => setFormData({ ...formData, vertical: e.target.value })}
                      className="col-span-3"
                      placeholder="e.g., Technology, Healthcare, Real Estate"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="aum" className="text-right">
                      AUM (USD)
                    </Label>
                    <Input
                      id="aum"
                      type="number"
                      value={formData.aum}
                      onChange={(e) => setFormData({ ...formData, aum: e.target.value })}
                      className="col-span-3"
                      placeholder="e.g., 100000000"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="ticket_size_range" className="text-right">
                      Ticket Size
                    </Label>
                    <Input
                      id="ticket_size_range"
                      value={formData.ticket_size_range}
                      onChange={(e) => setFormData({ ...formData, ticket_size_range: e.target.value })}
                      className="col-span-3"
                      placeholder="e.g., $1M - $5M"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="primary_contact" className="text-right">
                      Primary Contact
                    </Label>
                    <div className="col-span-3 flex gap-2">
                      <Select value={formData.primary_contact_id || "none"} onValueChange={(value) => setFormData({ ...formData, primary_contact_id: value === "none" ? "" : value })}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select primary contact (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Primary Contact</SelectItem>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsContactFormOpen(true)}
                        className="px-3"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    {editingCompany ? "Update Company" : "Create Company"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Companies</CardTitle>
            <CardDescription>
              A list of all companies in your CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>AUM</TableHead>
                  <TableHead>Ticket Size</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {company.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCompanyTypeBadgeColor(company.company_type)}>
                        {company.company_type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {company.region ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {company.region}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.aum ? (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3" />
                          {formatAUM(company.aum)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.ticket_size_range || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {company.primary_contact ? (
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {company.primary_contact.full_name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(company)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(company.id)}
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

      <InlineContactForm
        isOpen={isContactFormOpen}
        onClose={() => setIsContactFormOpen(false)}
        onSuccess={handleContactCreated}
      />
    </MainLayout>
  )
}