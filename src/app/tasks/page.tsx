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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, CheckSquare, Calendar, User, AlertTriangle } from "lucide-react"
import { TaskStatus, ParentDocumentType } from "@prisma/client"

interface Task {
  id: string
  title: string
  description?: string
  due_date?: string
  status: TaskStatus
  assigned_to_user_id: string
  parent_document_id: string
  parent_document_type: ParentDocumentType
  created_at: string
  updated_at: string
  assigned_to: {
    id: string
    first_name: string
    last_name: string
  }
}

interface User {
  id: string
  first_name: string
  last_name: string
}

interface Document {
  id: string
  title: string
  type: ParentDocumentType
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL")
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    status: TaskStatus.PENDING,
    assigned_to_user_id: "",
    parent_document_id: "",
    parent_document_type: ParentDocumentType.DEAL,
  })

  useEffect(() => {
    fetchTasks()
    fetchUsers()
    fetchDocuments()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks")
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    } finally {
      setLoading(false)
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

  const fetchDocuments = async () => {
    try {
      // Fetch deals, contacts, and companies as potential parent documents
      const [dealsRes, contactsRes, companiesRes] = await Promise.all([
        fetch("/api/deals"),
        fetch("/api/contacts"),
        fetch("/api/companies"),
      ])

      const documents: Document[] = []

      if (dealsRes.ok) {
        const deals = await dealsRes.json()
        deals.forEach((deal: any) => {
          documents.push({
            id: deal.id,
            title: deal.deal_name,
            type: ParentDocumentType.DEAL,
          })
        })
      }

      if (contactsRes.ok) {
        const contacts = await contactsRes.json()
        contacts.forEach((contact: any) => {
          documents.push({
            id: contact.id,
            title: contact.full_name,
            type: ParentDocumentType.CONTACT,
          })
        })
      }

      if (companiesRes.ok) {
        const companies = await companiesRes.json()
        companies.forEach((company: any) => {
          documents.push({
            id: company.id,
            title: company.name,
            type: ParentDocumentType.COMPANY,
          })
        })
      }

      setDocuments(documents)
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks"
    const method = editingTask ? "PUT" : "POST"
    
    const payload = {
      ...formData,
      due_date: formData.due_date || null,
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
        await fetchTasks()
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Failed to save task:", error)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || "",
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "",
      status: task.status,
      assigned_to_user_id: task.assigned_to_user_id,
      parent_document_id: task.parent_document_id,
      parent_document_type: task.parent_document_type,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "DELETE",
        })
        if (response.ok) {
          await fetchTasks()
        }
      } catch (error) {
        console.error("Failed to delete task:", error)
      }
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchTasks()
      }
    } catch (error) {
      console.error("Failed to update task status:", error)
    }
  }

  const resetForm = () => {
    setEditingTask(null)
    setFormData({
      title: "",
      description: "",
      due_date: "",
      status: TaskStatus.PENDING,
      assigned_to_user_id: "",
      parent_document_id: "",
      parent_document_type: ParentDocumentType.DEAL,
    })
  }

  const getStatusBadgeColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return "secondary"
      case TaskStatus.IN_PROGRESS:
        return "default"
      case TaskStatus.COMPLETED:
        return "destructive"
      case TaskStatus.OVERDUE:
        return "destructive"
      default:
        return "outline"
    }
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const filteredTasks = tasks.filter(task => {
    const statusMatch = statusFilter === "ALL" || task.status === statusFilter
    const assigneeMatch = assigneeFilter === "ALL" || task.assigned_to_user_id === assigneeFilter
    return statusMatch && assigneeMatch
  })

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading tasks...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track tasks across your organization
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingTask ? "Edit Task" : "Create New Task"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTask 
                      ? "Update the task information below."
                      : "Create a new task and assign it to a team member."
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="col-span-3"
                      placeholder="Task description..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="due_date" className="text-right">
                      Due Date
                    </Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TaskStatus.PENDING}>Pending</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                        <SelectItem value={TaskStatus.OVERDUE}>Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="assigned_to" className="text-right">
                      Assigned To
                    </Label>
                    <Select value={formData.assigned_to_user_id} onValueChange={(value) => setFormData({ ...formData, assigned_to_user_id: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select assignee" />
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
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="document_type" className="text-right">
                      Document Type
                    </Label>
                    <Select value={formData.parent_document_type} onValueChange={(value) => setFormData({ ...formData, parent_document_type: value as ParentDocumentType })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ParentDocumentType.DEAL}>Deal</SelectItem>
                        <SelectItem value={ParentDocumentType.CONTACT}>Contact</SelectItem>
                        <SelectItem value={ParentDocumentType.COMPANY}>Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="document" className="text-right">
                      Related Document
                    </Label>
                    <Select value={formData.parent_document_id} onValueChange={(value) => setFormData({ ...formData, parent_document_id: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select related document" />
                      </SelectTrigger>
                      <SelectContent>
                        {documents
                          .filter(doc => doc.type === formData.parent_document_type)
                          .map((document) => (
                            <SelectItem key={document.id} value={document.id}>
                              {document.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    {editingTask ? "Update Task" : "Create Task"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="status_filter">Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | "ALL")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value={TaskStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={TaskStatus.OVERDUE}>Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="assignee_filter">Assignee</Label>
                <Select value={assigneeFilter} onValueChange={(value) => setAssigneeFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Assignees</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Related To</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4" />
                          <span className="font-medium">{task.title}</span>
                          {isOverdue(task.due_date) && task.status !== TaskStatus.COMPLETED && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {task.assigned_to.first_name} {task.assigned_to.last_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {task.parent_document_type}: {task.parent_document_id.substring(0, 8)}...
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.due_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span className={isOverdue(task.due_date) && task.status !== TaskStatus.COMPLETED ? "text-red-500" : ""}>
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={task.status} 
                        onValueChange={(value) => handleStatusChange(task.id, value as TaskStatus)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TaskStatus.PENDING}>Pending</SelectItem>
                          <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                          <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                          <SelectItem value={TaskStatus.OVERDUE}>Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(task.id)}
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
    </MainLayout>
  )
}