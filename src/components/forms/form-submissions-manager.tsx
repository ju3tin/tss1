'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { 
  FileText, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Search,
  Filter
} from 'lucide-react'
import { FormSubmission, FormAssignment, User } from '@prisma/client'

interface FormSubmissionWithDetails extends FormSubmission {
  assigned_to?: {
    id: string
    first_name: string
    last_name: string
    email: string
  } | null
  form_assignments?: (FormAssignment & {
    assigned_to: {
      id: string
      first_name: string
      last_name: string
      email: string
    }
    assigned_by: {
      id: string
      first_name: string
      last_name: string
      email: string
    }
  })[]
}

interface FormSubmissionsManagerProps {
  user: User
}

export default function FormSubmissionsManager({ user }: FormSubmissionsManagerProps) {
  const [submissions, setSubmissions] = useState<FormSubmissionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmissionWithDetails | null>(null)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [assignmentNotes, setAssignmentNotes] = useState('')
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    fetchSubmissions()
    fetchUsers()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/form-submissions')
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
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

  const handleAssign = async () => {
    if (!selectedSubmission || !selectedUser) return

    try {
      const response = await fetch('/api/form-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          form_submission_id: selectedSubmission.id,
          assigned_to_user_id: selectedUser,
          due_date: dueDate?.toISOString(),
          notes: assignmentNotes
        })
      })

      if (response.ok) {
        setShowAssignDialog(false)
        setSelectedUser('')
        setAssignmentNotes('')
        setDueDate(undefined)
        fetchSubmissions()
      }
    } catch (error) {
      console.error('Error assigning submission:', error)
    }
  }

  const updateAssignmentStatus = async (assignmentId: string, status: string) => {
    try {
      const response = await fetch(`/api/form-assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchSubmissions()
      }
    } catch (error) {
      console.error('Error updating assignment status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.form_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter
    const matchesType = typeFilter === 'all' || submission.form_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const parseSubmissionData = (dataString: string) => {
    try {
      return JSON.parse(dataString)
    } catch {
      return {}
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
          <h1 className="text-3xl font-bold tracking-tight">Form Submissions</h1>
          <p className="text-muted-foreground">
            Manage and assign form submissions from your website
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CONTACT">Contact</SelectItem>
                <SelectItem value="AML">AML</SelectItem>
                <SelectItem value="KYC">KYC</SelectItem>
                <SelectItem value="INVESTMENT_INQUIRY">Investment Inquiry</SelectItem>
                <SelectItem value="DOCUMENT_REQUEST">Document Request</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Form Submissions</CardTitle>
          <CardDescription>
            {filteredSubmissions.length} submissions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.form_name}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(submission.form_type)}>
                        {submission.form_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {submission.contact_name && (
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span className="text-sm">{submission.contact_name}</span>
                          </div>
                        )}
                        {submission.contact_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="text-sm text-muted-foreground">{submission.contact_email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {submission.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {submission.assigned_to.first_name[0]}{submission.assigned_to.last_name[0]}
                            </span>
                          </div>
                          <span className="text-sm">
                            {submission.assigned_to.first_name} {submission.assigned_to.last_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span className="text-sm">
                          {format(new Date(submission.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{submission.form_name}</DialogTitle>
                              <DialogDescription>
                                Form submission details
                              </DialogDescription>
                            </DialogHeader>
                            {selectedSubmission && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Type</label>
                                    <Badge className={getTypeColor(selectedSubmission.form_type)}>
                                      {selectedSubmission.form_type}
                                    </Badge>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <Badge className={getStatusColor(selectedSubmission.status)}>
                                      {selectedSubmission.status.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Contact Name</label>
                                    <p className="text-sm">{selectedSubmission.contact_name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Contact Email</label>
                                    <p className="text-sm">{selectedSubmission.contact_email || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Created</label>
                                    <p className="text-sm">
                                      {format(new Date(selectedSubmission.created_at), 'MMM d, yyyy HH:mm')}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Source IP</label>
                                    <p className="text-sm">{selectedSubmission.source_ip}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Submission Data</label>
                                  <div className="mt-2 p-4 bg-gray-50 rounded-md">
                                    <pre className="text-sm overflow-x-auto">
                                      {JSON.stringify(parseSubmissionData(selectedSubmission.submission_data), null, 2)}
                                    </pre>
                                  </div>
                                </div>

                                {selectedSubmission.form_assignments && selectedSubmission.form_assignments.length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium">Assignments</label>
                                    <div className="mt-2 space-y-2">
                                      {selectedSubmission.form_assignments.map((assignment) => (
                                        <div key={assignment.id} className="p-3 border rounded-md">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-xs font-medium">
                                                  {assignment.assigned_to.first_name[0]}{assignment.assigned_to.last_name[0]}
                                                </span>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">
                                                  {assignment.assigned_to.first_name} {assignment.assigned_to.last_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  Assigned by {assignment.assigned_by.first_name} {assignment.assigned_by.last_name}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Badge className={getStatusColor(assignment.status)}>
                                                {assignment.status.replace('_', ' ')}
                                              </Badge>
                                              {assignment.status === 'PENDING' && (
                                                <Select
                                                  value={assignment.status}
                                                  onValueChange={(value) => updateAssignmentStatus(assignment.id, value)}
                                                >
                                                  <SelectTrigger className="w-[120px] h-8">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              )}
                                            </div>
                                          </div>
                                          {assignment.due_date && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                                            </p>
                                          )}
                                          {assignment.notes && (
                                            <p className="text-sm mt-2">{assignment.notes}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {!submission.assigned_to && (
                          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSubmission(submission)}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign Form Submission</DialogTitle>
                                <DialogDescription>
                                  Assign this form submission to a team member
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Assign To</label>
                                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {users && users.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                          {user.first_name} {user.last_name} ({user.email})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Due Date</label>
                                  <Calendar
                                    mode="single"
                                    selected={dueDate}
                                    onSelect={setDueDate}
                                    className="rounded-md border mt-2"
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Notes</label>
                                  <Textarea
                                    value={assignmentNotes}
                                    onChange={(e) => setAssignmentNotes(e.target.value)}
                                    placeholder="Add any notes about this assignment..."
                                    className="mt-2"
                                  />
                                </div>
                                
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleAssign} disabled={!selectedUser}>
                                    Assign
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}