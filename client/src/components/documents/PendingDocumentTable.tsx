import { Eye, Check, X, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface PendingDocumentTableProps {
  documents: any[];
  onApprove: (documentId: number, currentStep: number, workflow: any) => void;
  onReject: (documentId: number) => void;
  workflows: any[];
  isPending: boolean;
}

export default function PendingDocumentTable({
  documents,
  onApprove,
  onReject,
  workflows,
  isPending
}: PendingDocumentTableProps) {
  const { user } = useAuth();
  
  // Fetch users to display creator name
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'in_progress':
        return 'status-in-progress';
      default:
        return 'status-pending';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'รออนุมัติ';
      case 'approved':
        return 'อนุมัติแล้ว';
      case 'rejected':
        return 'ไม่อนุมัติ';
      case 'in_progress':
        return 'กำลังดำเนินการ';
      default:
        return 'รออนุมัติ';
    }
  };
  
  const getUserName = (userId: number) => {
    if (!users) return `ผู้ใช้ ID: ${userId}`;
    const user = users.find((u: any) => u.id === userId);
    return user ? user.displayName : `ผู้ใช้ ID: ${userId}`;
  };
  
  const getUserDepartment = (userId: number) => {
    if (!users) return '';
    const user = users.find((u: any) => u.id === userId);
    return user ? user.department : '';
  };
  
  const getWorkflow = (workflowId: number) => {
    return workflows.find(w => w.id === workflowId);
  };
  
  const canApprove = (document: any) => {
    return document.status === 'pending' && document.assignedTo === user?.id;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-muted text-left text-muted-foreground">
            <th className="py-3 px-4 text-sm font-semibold">เอกสาร</th>
            <th className="py-3 px-4 text-sm font-semibold">ผู้สร้าง</th>
            <th className="py-3 px-4 text-sm font-semibold">แผนก</th>
            <th className="py-3 px-4 text-sm font-semibold">วันที่สร้าง</th>
            <th className="py-3 px-4 text-sm font-semibold">สถานะ</th>
            <th className="py-3 px-4 text-sm font-semibold">การดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b border-border">
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <FileText className="text-primary mr-2 h-5 w-5" />
                  <div>
                    <p className="text-sm font-semibold text-secondary">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{doc.documentNumber}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback>
                      {getUserName(doc.createdBy).substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-secondary">{getUserName(doc.createdBy)}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-secondary">{getUserDepartment(doc.createdBy)}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-secondary">
                  {new Date(doc.createdAt).toLocaleDateString('th-TH')}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <span className={`status-indicator ${getStatusClass(doc.status)}`}></span>
                  <span className="text-sm text-secondary">{getStatusText(doc.status)}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded">
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {canApprove(doc) && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-[#24a148] hover:bg-[#24a148]/10 rounded"
                        onClick={() => onApprove(doc.id, doc.currentStep, getWorkflow(doc.workflowId))}
                        disabled={isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-[#da1e28] hover:bg-[#da1e28]/10 rounded"
                        onClick={() => onReject(doc.id)}
                        disabled={isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
