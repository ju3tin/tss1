"use client"

import { useState } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Building2 } from "lucide-react"
import { CompanyType } from "@prisma/client"

interface InlineCompanyFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (company: { id: string; name: string; company_type: string }) => void
}

export function InlineCompanyForm({ isOpen, onClose, onSuccess }: InlineCompanyFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    company_type: "FAMILY_OFFICE" as CompanyType,
    region: "",
    vertical: "",
    aum: "",
    ticket_size_range: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        ...formData,
        aum: formData.aum ? parseFloat(formData.aum) : null,
      }

      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const newCompany = await response.json()
        onSuccess({
          id: newCompany.id,
          name: newCompany.name,
          company_type: newCompany.company_type,
        })
        onClose()
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to create company: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to create company:", error)
      alert("Failed to create company. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      company_type: "FAMILY_OFFICE",
      region: "",
      vertical: "",
      aum: "",
      ticket_size_range: "",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Add New Company
            </DialogTitle>
            <DialogDescription>
              Create a new company and associate it with this contact
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Company Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
                placeholder="Enter company name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company_type" className="text-right">
                Type *
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
                placeholder="e.g., North America, Europe"
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
                placeholder="e.g., Technology, Healthcare"
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
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? "Creating..." : "Create Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}