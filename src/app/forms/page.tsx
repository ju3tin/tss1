'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import FormSubmissionsManager from '@/components/forms/form-submissions-manager'
import FormTemplatesManager from '@/components/forms/form-templates-manager'
import { 
  FileText, 
  Settings, 
  Inbox, 
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react'

interface FormStats {
  total_submissions: number
  pending_submissions: number
  assigned_submissions: number
  completed_submissions: number
  total_templates: number
  active_templates: number
}

export default function FormsPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<FormStats>({
    total_submissions: 0,
    pending_submissions: 0,
    assigned_submissions: 0,
    completed_submissions: 0,
    total_templates: 0,
    active_templates: 0
  })

  useEffect(() => {
    if (session) {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      const [submissionsRes, templatesRes] = await Promise.all([
        fetch('/api/form-submissions'),
        fetch('/api/form-templates')
      ])

      if (submissionsRes.ok && templatesRes.ok) {
        const submissionsData = await submissionsRes.json()
        const templatesData = await templatesRes.json()

        const submissions = submissionsData.submissions || []
        const templates = templatesData.templates || []

        setStats({
          total_submissions: submissions.length,
          pending_submissions: submissions.filter((s: any) => s.status === 'PENDING').length,
          assigned_submissions: submissions.filter((s: any) => s.status === 'ASSIGNED').length,
          completed_submissions: submissions.filter((s: any) => s.status === 'COMPLETED').length,
          total_templates: templates.length,
          active_templates: templates.filter((t: any) => t.is_active).length
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to access the forms management system.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Forms Management</h1>
        <p className="text-muted-foreground">
          Manage form submissions, templates, and auto-assignment rules for your website forms
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_submissions}</div>
            <p className="text-xs text-muted-foreground">
              All time submissions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_submissions}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting assignment
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assigned_submissions}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed_submissions}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_templates}</div>
            <p className="text-xs text-muted-foreground">
              Of {stats.total_templates} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_submissions > 0 
                ? Math.round((stats.completed_submissions / stats.total_submissions) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Submissions
            {stats.pending_submissions > 0 && (
              <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {stats.pending_submissions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="submissions" className="space-y-4">
          <FormSubmissionsManager user={session.user as any} />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <FormTemplatesManager user={session.user as any} />
        </TabsContent>
      </Tabs>
    </div>
  )
}