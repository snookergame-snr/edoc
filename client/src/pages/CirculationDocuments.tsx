import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, 
  Filter as FilterIcon, 
  Eye, 
  Check, 
  X, 
  FileText, 
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PendingDocumentTable from "@/components/documents/PendingDocumentTable";
import CirculationForm from "@/components/circulation/CirculationForm";
import { Spinner } from "@/components/ui/spinner";

export default function CirculationDocuments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all circulation documents for the user
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/circulation-documents', { userId: user?.id }],
    queryFn: async () => {
      const res = await fetch(`/api/circulation-documents?userId=${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch circulation documents');
      return res.json();
    },
    enabled: !!user?.id
  });

  // Fetch workflows
  const { data: workflows, isLoading: isWorkflowsLoading } = useQuery({
    queryKey: ['/api/workflows'],
    queryFn: async () => {
      const res = await fetch('/api/workflows');
      if (!res.ok) throw new Error('Failed to fetch workflows');
      return res.json();
    }
  });

  // Update document status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      step, 
      assignedTo, 
      comment 
    }: { 
      id: number; 
      status: string; 
      step: number; 
      assignedTo?: number; 
      comment?: string;
    }) => {
      const res = await fetch(`/api/circulation-documents/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          step,
          assignedTo,
          userId: user?.id,
          comment
        }),
      });

      if (!res.ok) throw new Error('Failed to update document status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/circulation-documents'] });
      toast({
        title: "อัปเดตสถานะสำเร็จ",
        description: "เอกสารได้รับการอัปเดตสถานะเรียบร้อยแล้ว",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสถานะเอกสารได้ โปรดลองอีกครั้ง",
        variant: "destructive",
      });
    }
  });

  const handleCreateDocument = () => {
    setShowCreateForm(true);
  };

  const handleDocumentCreated = () => {
    setShowCreateForm(false);
    queryClient.invalidateQueries({ queryKey: ['/api/circulation-documents'] });
    toast({
      title: "สร้างเอกสารสำเร็จ",
      description: "เอกสารเวียนถูกสร้างเรียบร้อยแล้ว",
      variant: "default",
    });
  };

  const handleApprove = (documentId: number, currentStep: number, workflow: any) => {
    const nextStep = currentStep + 1;
    const workflowSteps = workflow?.steps || [];
    
    // Check if this is the last step
    const isLastStep = nextStep >= workflowSteps.length;
    
    // If last step, mark as approved, otherwise move to next step
    const status = isLastStep ? 'approved' : 'in_progress';
    
    // Determine who to assign to next (if not the last step)
    const assignedTo = isLastStep ? undefined : 1; // In a real app, would find next assignee based on workflow
    
    updateStatusMutation.mutate({
      id: documentId,
      status,
      step: nextStep,
      assignedTo,
      comment: 'อนุมัติเอกสาร'
    });
  };

  const handleReject = (documentId: number) => {
    updateStatusMutation.mutate({
      id: documentId,
      status: 'rejected',
      step: 0,
      comment: 'ไม่อนุมัติเอกสาร'
    });
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  // Filter documents based on the selected tab and search term
  const filteredDocuments = documents?.filter((doc: any) => {
    const matchesSearch = 
      searchTerm === "" || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.tags && doc.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    if (selectedTab === 'all') return matchesSearch;
    if (selectedTab === 'pending') return doc.status === 'pending' && doc.assignedTo === user?.id && matchesSearch;
    if (selectedTab === 'in_progress') return doc.status === 'in_progress' && matchesSearch;
    if (selectedTab === 'approved') return doc.status === 'approved' && matchesSearch;
    if (selectedTab === 'rejected') return doc.status === 'rejected' && matchesSearch;
    if (selectedTab === 'created') return doc.createdBy === user?.id && matchesSearch;
    
    return matchesSearch;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">เอกสารเวียน</h1>
          <p className="text-muted-foreground">ระบบจัดการและติดตามเอกสารเวียนที่ต้องได้รับการอนุมัติ</p>
        </div>
        <Button 
          className="mt-3 md:mt-0" 
          onClick={handleCreateDocument}
        >
          <Plus className="mr-2 h-4 w-4" />
          สร้างเอกสารใหม่
        </Button>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-secondary mb-1">รายการเอกสารเวียน</h2>
            <p className="text-sm text-muted-foreground">ติดตามสถานะเอกสารและดำเนินการตามขั้นตอน</p>
          </div>
          
          <div className="flex flex-col md:flex-row mt-4 md:mt-0 space-y-2 md:space-y-0 md:space-x-2">
            <div className="relative">
              <input 
                type="text" 
                placeholder="ค้นหาเอกสาร..." 
                className="border border-border rounded py-2 pl-8 pr-3 text-sm w-full focus:outline-none focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
          </div>
        </div>
        
        <Tabs 
          defaultValue="pending" 
          value={selectedTab}
          onValueChange={handleTabChange}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
            <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
            <TabsTrigger value="pending">รออนุมัติ</TabsTrigger>
            <TabsTrigger value="in_progress">กำลังดำเนินการ</TabsTrigger>
            <TabsTrigger value="approved">อนุมัติแล้ว</TabsTrigger>
            <TabsTrigger value="rejected">ไม่อนุมัติ</TabsTrigger>
            <TabsTrigger value="created">เอกสารที่สร้าง</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab}>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner className="h-8 w-8 text-primary" />
                <span className="ml-2">กำลังโหลดข้อมูล...</span>
              </div>
            ) : filteredDocuments.length > 0 ? (
              <PendingDocumentTable 
                documents={filteredDocuments}
                onApprove={handleApprove}
                onReject={handleReject}
                workflows={workflows || []}
                isPending={updateStatusMutation.isPending}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                ไม่พบเอกสารในสถานะที่เลือก
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Document Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>สร้างเอกสารเวียนใหม่</DialogTitle>
          </DialogHeader>
          <CirculationForm 
            workflows={workflows || []} 
            isWorkflowsLoading={isWorkflowsLoading}
            onSuccess={handleDocumentCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
