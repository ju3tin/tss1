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
import { Plus, Users } from "lucide-react"
import { InvestorType } from "@prisma/client"

interface InlineContactFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (contact: { id: string; full_name: string; email: string }) => void
}

export function InlineContactForm({ isOpen, onClose, onSuccess }: InlineContactFormProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    investor_type: "INDIVIDUAL" as InvestorType,
    source: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newContact = await response.json()
        onSuccess({
          id: newContact.id,
          full_name: newContact.full_name,
          email: newContact.email,
        })
        onClose()
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to create contact: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to create contact:", error)
      alert("Failed to create contact. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone_number: "",
      investor_type: "INDIVIDUAL",
      source: "",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Add New Contact
            </DialogTitle>
            <DialogDescription>
              Create a new contact and associate it with this company
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Full Name *
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="col-span-3"
                required
                placeholder="Enter full name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                required
                placeholder="Enter email address"
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
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="investor_type" className="text-right">
                Investor Type *
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
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.full_name.trim() || !formData.email.trim()}>
              {isSubmitting ? "Creating..." : "Create Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}