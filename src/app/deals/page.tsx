"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Handshake, Building2, User, Calendar, Brain, Mail, Archive, Play } from "lucide-react"
import { DealStage, KYCStatus } from "@prisma/client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DealWorkflowActions } from "@/components/deals/deal-workflow-actions"
import { EmailTrackingSummary } from "@/components/email-tracking/email-tracking-summary"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Deal {
  id: string
  deal_name: string
  stage: DealStage
  owner_user_id: string
  associated_contact_id: string
  associated_company_id?: string
  kyc_status: KYCStatus
  due_diligence_notes?: string
  created_at: string
  updated_at: string
  owner: {
    id: string
    first_name: string
    last_name: string
  }
  associated_contact: {
    id: string
    full_name: string
    email: string
  }
  associated_company?: {
    id: string
    name: string
  }
}

interface Contact {
  id: string
  full_name: string
  email: string
}

interface Company {
  id: string
  name: string
}

interface User {
  id: string
  first_name: string
  last_name: string
}

const columns = [
  { id: DealStage.NEW_LEAD, title: "New Lead", color: "bg-gray-100" },
  { id: DealStage.KYC_IN_PROGRESS, title: "KYC In Progress", color: "bg-blue-100" },
  { id: DealStage.DUE_DILIGENCE, title: "Due Diligence", color: "bg-yellow-100" },
  { id: DealStage.CONTRACT_SIGNING, title: "Contract Signing", color: "bg-orange-100" },
  { id: DealStage.ONBOARDED, title: "Onboarded", color: "bg-green-100" },
  { id: DealStage.REJECTED, title: "Rejected", color: "bg-red-100" },
]

function DealCard({ deal, onEdit, onDelete, onAIAnalysis, onSendKYC, onArchiveToDrive, onAutoProgress, onShowEmailTracking }: { 
  deal: Deal; 
  onEdit: (deal: Deal) => void; 
  onDelete: (dealId: string) => void;
  onAIAnalysis: (dealId: string) => void;
  onSendKYC: (dealId: string) => Promise<void>;
  onArchiveToDrive: (dealId: string) => Promise<void>;
  onAutoProgress: (dealId: string) => Promise<void>;
  onShowEmailTracking: (deal: Deal) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getStageBadgeColor = (stage: DealStage) => {
    switch (stage) {
      case DealStage.NEW_LEAD:
        return "secondary"
      case DealStage.KYC_IN_PROGRESS:
        return "default"
      case DealStage.DUE_DILIGENCE:
        return "outline"
      case DealStage.CONTRACT_SIGNING:
        return "default"
      case DealStage.ONBOARDED:
        return "destructive"
      case DealStage.REJECTED:
        return "destructive"
      default:
        return "outline"
    }
  }

  const getKYCStatusBadgeColor = (status: KYCStatus) => {
    switch (status) {
      case KYCStatus.PENDING:
        return "secondary"
      case KYCStatus.SUBMITTED:
        return "default"
      case KYCStatus.VERIFIED:
        return "destructive"
      case KYCStatus.REJECTED:
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-3 cursor-move hover:shadow-md transition-shadow"
      {...attributes}
      {...listeners}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium">{deal.deal_name}</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(deal)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(deal.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={getStageBadgeColor(deal.stage)} className="text-xs">
            {deal.stage.replace("_", " ")}
          </Badge>
          <Badge variant={getKYCStatusBadgeColor(deal.kyc_status)} className="text-xs">
            KYC: {deal.kyc_status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-3 w-3" />
            <span>{deal.associated_contact.full_name}</span>
          </div>
          {deal.associated_company && (
            <div className="flex items-center gap-2">
              <Building2 className="h-3 w-3" />
              <span>{deal.associated_company.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Owner: {deal.owner.first_name} {deal.owner.last_name}</span>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex gap-1">
            {deal.stage === DealStage.NEW_LEAD || deal.stage === DealStage.KYC_IN_PROGRESS ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onSendKYC(deal.id)}
                className="text-xs"
              >
                <Mail className="h-3 w-3 mr-1" />
                KYC
              </Button>
            ) : null}
            
            {deal.kyc_status === 'VERIFIED' && deal.stage === DealStage.KYC_IN_PROGRESS ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onArchiveToDrive(deal.id)}
                className="text-xs"
              >
                <Archive className="h-3 w-3 mr-1" />
                Archive
              </Button>
            ) : null}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onAIAnalysis(deal.id)}
              className="text-xs"
            >
              <Brain className="h-3 w-3 mr-1" />
              AI
            </Button>
            
            {deal.stage !== DealStage.ONBOARDED && deal.stage !== DealStage.REJECTED ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onAutoProgress(deal.id)}
                className="text-xs"
              >
                <Play className="h-3 w-3 mr-1" />
                Progress
              </Button>
            ) : null}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onShowEmailTracking(deal)}
              className="text-xs"
            >
              <Mail className="h-3 w-3 mr-1" />
              Email Tracking
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Column({ 
  column, 
  deals, 
  onEditDeal, 
  onDeleteDeal,
  onAIAnalysisDeal,
  onSendKYC,
  onArchiveToDrive,
  onAutoProgress,
  onShowEmailTracking
}: { 
  column: typeof columns[0]; 
  deals: Deal[]; 
  onEditDeal: (deal: Deal) => void; 
  onDeleteDeal: (dealId: string) => void;
  onAIAnalysisDeal: (dealId: string) => void;
  onSendKYC: (dealId: string) => Promise<void>;
  onArchiveToDrive: (dealId: string) => Promise<void>;
  onAutoProgress: (dealId: string) => Promise<void>;
  onShowEmailTracking: (deal: Deal) => void;
}) {
  return (
    <div className={`flex-1 min-w-[300px] p-4 rounded-lg ${column.color}`}>
      <h3 className="font-semibold mb-4 text-center">{column.title}</h3>
      <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onEdit={onEditDeal}
              onDelete={onDeleteDeal}
              onAIAnalysis={onAIAnalysisDeal}
              onSendKYC={onSendKYC}
              onArchiveToDrive={onArchiveToDrive}
              onAutoProgress={onAutoProgress}
              onShowEmailTracking={onShowEmailTracking}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export default function DealsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [deals, setDeals] = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [selectedDealForTracking, setSelectedDealForTracking] = useState<Deal | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    deal_name: "",
    stage: DealStage.NEW_LEAD,
    associated_contact_id: "",
    associated_company_id: "",
    owner_user_id: "",
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    
    fetchDeals()
    fetchContacts()
    fetchCompanies()
    fetchUsers()
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

  const fetchDeals = async () => {
    try {
      const response = await fetch("/api/deals")
      if (response.ok) {
        const data = await response.json()
        setDeals(data)
      }
    } catch (error) {
      console.error("Failed to fetch deals:", error)
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

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = editingDeal ? `/api/deals/${editingDeal.id}` : "/api/deals"
    const method = editingDeal ? "PUT" : "POST"
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchDeals()
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Failed to save deal:", error)
    }
  }

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal)
    setFormData({
      deal_name: deal.deal_name,
      stage: deal.stage,
      associated_contact_id: deal.associated_contact_id,
      associated_company_id: deal.associated_company_id || "",
      owner_user_id: deal.owner_user_id,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (dealId: string) => {
    if (confirm("Are you sure you want to delete this deal?")) {
      try {
        const response = await fetch(`/api/deals/${dealId}`, {
          method: "DELETE",
        })
        if (response.ok) {
          await fetchDeals()
        }
      } catch (error) {
        console.error("Failed to delete deal:", error)
      }
    }
  }

  const handleAIAnalysis = async (dealId: string) => {
    try {
      const response = await fetch(`/api/deals/${dealId}/analyze`, {
        method: "POST",
      })
      if (response.ok) {
        await fetchDeals()
        alert("AI analysis completed successfully! Check the deal's due diligence notes.")
      } else {
        const error = await response.json()
        alert(`AI analysis failed: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to perform AI analysis:", error)
      alert("Failed to perform AI analysis. Please try again.")
    }
  }

  const handleSendKYC = async (dealId: string) => {
    try {
      const response = await fetch(`/api/deals/${dealId}/send-kyc`, {
        method: "POST",
      })
      if (response.ok) {
        await fetchDeals()
        alert("KYC/AML email sent successfully! Deal moved to KYC In Progress stage.")
      } else {
        const error = await response.json()
        alert(`Failed to send KYC email: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to send KYC email:", error)
      alert("Failed to send KYC email. Please try again.")
    }
  }

  const handleArchiveToDrive = async (dealId: string) => {
    try {
      const response = await fetch(`/api/deals/${dealId}/archive-drive`, {
        method: "POST",
      })
      if (response.ok) {
        await fetchDeals()
        alert("Documents archived to Google Drive successfully! Deal moved to Due Diligence stage.")
      } else {
        const error = await response.json()
        alert(`Failed to archive to Google Drive: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to archive to Google Drive:", error)
      alert("Failed to archive to Google Drive. Please try again.")
    }
  }

  const handleAutoProgress = async (dealId: string) => {
    try {
      const response = await fetch(`/api/deals/${dealId}/auto-progress`, {
        method: "POST",
      })
      if (response.ok) {
        const result = await response.json()
        await fetchDeals()
        if (result.message === "Deal progressed successfully") {
          alert(`Deal progressed from ${result.previousStage.replace('_', ' ')} to ${result.newStage.replace('_', ' ')}!`)
        } else {
          alert(result.message)
        }
      } else {
        const error = await response.json()
        alert(`Failed to progress deal: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to progress deal:", error)
      alert("Failed to progress deal. Please try again.")
    }
  }

  const handleShowEmailTracking = (deal: Deal) => {
    setSelectedDealForTracking(deal)
  }

  const resetForm = () => {
    setEditingDeal(null)
    setFormData({
      deal_name: "",
      stage: DealStage.NEW_LEAD,
      associated_contact_id: "",
      associated_company_id: "",
      owner_user_id: "",
    })
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const dealId = active.id as string
      const newStage = over.id as DealStage

      try {
        const response = await fetch(`/api/deals/${dealId}/stage`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ stage: newStage }),
        })

        if (response.ok) {
          await fetchDeals()
        }
      } catch (error) {
        console.error("Failed to update deal stage:", error)
      }
    }

    setActiveId(null)
  }

  const getDealsByStage = (stage: DealStage) => {
    return deals.filter(deal => deal.stage === stage)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading deals...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deals Pipeline</h1>
            <p className="text-muted-foreground">
              Manage your investment deals and track their progress
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Deal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingDeal ? "Edit Deal" : "Create New Deal"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDeal 
                      ? "Update the deal information below."
                      : "Create a new deal in your pipeline."
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="deal_name" className="text-right">
                      Deal Name
                    </Label>
                    <Input
                      id="deal_name"
                      value={formData.deal_name}
                      onChange={(e) => setFormData({ ...formData, deal_name: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="stage" className="text-right">
                      Stage
                    </Label>
                    <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value as DealStage })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DealStage.NEW_LEAD}>New Lead</SelectItem>
                        <SelectItem value={DealStage.KYC_IN_PROGRESS}>KYC In Progress</SelectItem>
                        <SelectItem value={DealStage.DUE_DILIGENCE}>Due Diligence</SelectItem>
                        <SelectItem value={DealStage.CONTRACT_SIGNING}>Contract Signing</SelectItem>
                        <SelectItem value={DealStage.ONBOARDED}>Onboarded</SelectItem>
                        <SelectItem value={DealStage.REJECTED}>Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contact" className="text-right">
                      Contact
                    </Label>
                    <Select value={formData.associated_contact_id} onValueChange={(value) => setFormData({ ...formData, associated_contact_id: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company" className="text-right">
                      Company
                    </Label>
                    <Select value={formData.associated_company_id || "none"} onValueChange={(value) => setFormData({ ...formData, associated_company_id: value === "none" ? "" : value })}>
                      <SelectTrigger className="col-span-3">
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
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="owner" className="text-right">
                      Owner
                    </Label>
                    <Select value={formData.owner_user_id} onValueChange={(value) => setFormData({ ...formData, owner_user_id: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    {editingDeal ? "Update Deal" : "Create Deal"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Workflow Actions for Selected Deal */}
        {editingDeal && (
          <DealWorkflowActions
            deal={editingDeal}
            onSendKYC={handleSendKYC}
            onArchiveToDrive={handleArchiveToDrive}
            onAutoProgress={handleAutoProgress}
          />
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                deals={getDealsByStage(column.id)}
                onEditDeal={handleEdit}
                onDeleteDeal={handleDelete}
                onAIAnalysisDeal={handleAIAnalysis}
                onSendKYC={handleSendKYC}
                onArchiveToDrive={handleArchiveToDrive}
                onAutoProgress={handleAutoProgress}
                onShowEmailTracking={handleShowEmailTracking}
              />
            ))}
          </div>
          
          <DragOverlay>
            {activeId ? (
              <DealCard
                deal={deals.find(d => d.id === activeId)!}
                onEdit={() => {}}
                onDelete={() => {}}
                onAIAnalysis={() => {}}
                onSendKYC={() => {}}
                onArchiveToDrive={() => {}}
                onAutoProgress={() => {}}
                onShowEmailTracking={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Email Tracking Section */}
        {selectedDealForTracking && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Email Tracking for: {selectedDealForTracking.deal_name}
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedDealForTracking(null)}
              >
                Close
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <EmailTrackingSummary 
                dealId={selectedDealForTracking.id} 
                showDetails={true}
              />
              <Card>
                <CardHeader>
                  <CardTitle>Deal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">Deal Name:</span>
                    <span className="ml-2">{selectedDealForTracking.deal_name}</span>
                  </div>
                  <div>
                    <span className="font-medium">Stage:</span>
                    <span className="ml-2">{selectedDealForTracking.stage.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="font-medium">Contact:</span>
                    <span className="ml-2">{selectedDealForTracking.associated_contact.full_name}</span>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <span className="ml-2">{selectedDealForTracking.associated_contact.email}</span>
                  </div>
                  {selectedDealForTracking.associated_company && (
                    <div>
                      <span className="font-medium">Company:</span>
                      <span className="ml-2">{selectedDealForTracking.associated_company.name}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Owner:</span>
                    <span className="ml-2">{selectedDealForTracking.owner.first_name} {selectedDealForTracking.owner.last_name}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}