import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Mail, Archive, Play, CheckCircle, AlertCircle } from "lucide-react"
import { Deal, DealStage, KYCStatus } from "@prisma/client"

interface DealWorkflowActionsProps {
  deal: Deal
  onSendKYC: (dealId: string) => Promise<void>
  onArchiveToDrive: (dealId: string) => Promise<void>
  onAutoProgress: (dealId: string) => Promise<void>
}

export function DealWorkflowActions({ 
  deal, 
  onSendKYC, 
  onArchiveToDrive, 
  onAutoProgress 
}: DealWorkflowActionsProps) {
  const canSendKYC = deal.stage === DealStage.NEW_LEAD || deal.stage === DealStage.KYC_IN_PROGRESS
  const canArchive = deal.kyc_status === KYCStatus.VERIFIED && deal.stage === DealStage.KYC_IN_PROGRESS
  const canAutoProgress = deal.stage !== DealStage.ONBOARDED && deal.stage !== DealStage.REJECTED

  const getStageColor = (stage: DealStage) => {
    switch (stage) {
      case DealStage.NEW_LEAD: return "bg-gray-100 text-gray-800"
      case DealStage.KYC_IN_PROGRESS: return "bg-blue-100 text-blue-800"
      case DealStage.DUE_DILIGENCE: return "bg-yellow-100 text-yellow-800"
      case DealStage.CONTRACT_SIGNING: return "bg-orange-100 text-orange-800"
      case DealStage.ONBOARDED: return "bg-green-100 text-green-800"
      case DealStage.REJECTED: return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getKYCStatusColor = (status: KYCStatus) => {
    switch (status) {
      case KYCStatus.PENDING: return "bg-gray-100 text-gray-800"
      case KYCStatus.SUBMITTED: return "bg-blue-100 text-blue-800"
      case KYCStatus.VERIFIED: return "bg-green-100 text-green-800"
      case KYCStatus.REJECTED: return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Workflow Actions
        </CardTitle>
        <CardDescription>
          Automated workflow actions for deal progression
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex gap-2">
            <Badge className={getStageColor(deal.stage)}>
              Stage: {deal.stage.replace('_', ' ')}
            </Badge>
            <Badge className={getKYCStatusColor(deal.kyc_status)}>
              KYC: {deal.kyc_status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Send KYC Email */}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  disabled={!canSendKYC}
                >
                  <Mail className="h-6 w-6" />
                  <span className="text-sm">Send KYC Email</span>
                  {!canSendKYC && (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send KYC/AML Email</DialogTitle>
                  <DialogDescription>
                    This will send a KYC/AML compliance email to {deal.associated_contact.full_name} ({deal.associated_contact.email}) 
                    and move the deal to KYC In Progress stage.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button 
                    onClick={() => onSendKYC(deal.id)}
                    disabled={!canSendKYC}
                  >
                    Send Email
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Archive to Google Drive */}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  disabled={!canArchive}
                >
                  <Archive className="h-6 w-6" />
                  <span className="text-sm">Archive to Drive</span>
                  {!canArchive && (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Archive to Google Drive</DialogTitle>
                  <DialogDescription>
                    This will archive all verified KYC documents to Google Drive and move the deal to Due Diligence stage.
                    {deal.kyc_status !== KYCStatus.VERIFIED && (
                      <div className="text-yellow-600 mt-2">
                        ⚠️ KYC must be verified before archiving.
                      </div>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button 
                    onClick={() => onArchiveToDrive(deal.id)}
                    disabled={!canArchive}
                  >
                    Archive to Drive
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Auto Progress */}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  disabled={!canAutoProgress}
                >
                  <Play className="h-6 w-6" />
                  <span className="text-sm">Auto Progress</span>
                  {!canAutoProgress && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Auto Progress Deal</DialogTitle>
                  <DialogDescription>
                    This will automatically progress the deal to the next stage based on completion criteria.
                    Current stage: {deal.stage.replace('_', ' ')}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button 
                    onClick={() => onAutoProgress(deal.id)}
                    disabled={!canAutoProgress}
                  >
                    Progress Deal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Workflow Status */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Workflow Progress</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${deal.stage !== DealStage.NEW_LEAD ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Lead Created</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${deal.kyc_status !== KYCStatus.PENDING ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>KYC Email Sent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${deal.kyc_status === KYCStatus.VERIFIED ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>KYC Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${deal.stage === DealStage.DUE_DILIGENCE || deal.stage === DealStage.CONTRACT_SIGNING || deal.stage === DealStage.ONBOARDED ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Documents Archived</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${deal.stage === DealStage.ONBOARDED ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Deal Onboarded</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}