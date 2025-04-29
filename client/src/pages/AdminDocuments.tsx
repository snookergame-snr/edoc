import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  FileText, 
  Folder, 
  Download, 
  UserCheck, 
  Tag, 
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import DocumentUploadForm from "@/components/documents/DocumentUploadForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminDocuments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState("documents");
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  // Fetch documents
  const { data: documents, isLoading: isDocumentsLoading, refetch: refetchDocuments } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      const res = await fetch('/api/documents');
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    }
  });

  // Fetch categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['/api/document-categories'],
    queryFn: async () => {
      const res = await fetch('/api/document-categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  // Fetch download history
  const { data: downloadHistory, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['/api/activity-logs'],
    queryFn: async () => {
      const res = await fetch('/api/activity-logs?limit=50');
      if (!res.ok) throw new Error('Failed to fetch activity logs');
      const logs = await res.json();
      return logs.filter((log: any) => log.action === 'download');
    }
  });

  const handleDocumentUploaded = () => {
    setShowUploadForm(false);
    refetchDocuments();
    toast({
      title: "อัปโหลดสำเร็จ",
      description: "เอกสารถูกอัปโหลดเรียบร้อยแล้ว",
      variant: "default",
    });
  };

  // Filter documents based on search term
  const filteredDocuments = documents?.filter((doc: any) => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.tags && doc.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  ) || [];

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-secondary mb-2">การเข้าถึงถูกจำกัด</h2>
          <p className="text-muted-foreground mb-4">
            คุณไม่มีสิทธิ์ในการเข้าถึงหน้าจัดการเอกสาร กรุณาติดต่อผู้ดูแลระบบ
          </p>
          <Button onClick={() => window.history.back()}>กลับ</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">จัดการเอกสาร</h1>
          <p className="text-muted-foreground">จัดการแบบฟอร์ม เอกสาร และหมวดหมู่ต่างๆ</p>
        </div>
        <Button 
          className="mt-3 md:mt-0" 
          onClick={() => setShowUploadForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มเอกสารใหม่
        </Button>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-secondary mb-1">เอกสารและหมวดหมู่</h2>
            <p className="text-sm text-muted-foreground">จัดการเอกสารในระบบทั้งหมด</p>
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
          defaultValue="documents" 
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="documents">เอกสาร</TabsTrigger>
            <TabsTrigger value="statistics">สถิติการใช้งาน</TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents">
            {isDocumentsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner className="h-8 w-8 text-primary" />
                <span className="ml-2">กำลังโหลดข้อมูล...</span>
              </div>
            ) : filteredDocuments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อเอกสาร</TableHead>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead>ประเภทไฟล์</TableHead>
                    <TableHead>อัปโหลดเมื่อ</TableHead>
                    <TableHead className="text-right">ดาวน์โหลด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc: any) => {
                    const category = categories?.find((cat: any) => cat.id === doc.categoryId);
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-primary mr-2" />
                            <div>
                              <div>{doc.title}</div>
                              <div className="text-xs text-muted-foreground">{doc.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{category?.name || "ไม่ระบุ"}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">
                            {doc.fileType}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(doc.uploadDate).toLocaleDateString('th-TH')}</TableCell>
                        <TableCell className="text-right">{doc.downloadCount} ครั้ง</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                ไม่พบเอกสารที่ตรงกับคำค้นหา
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">เอกสารทั้งหมด</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{documents?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">รายการในระบบ</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">ดาวน์โหลดทั้งหมด</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {documents?.reduce((sum: number, doc: any) => sum + doc.downloadCount, 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">ครั้ง</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">หมวดหมู่</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categories?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">หมวดหมู่ในระบบ</p>
                </CardContent>
              </Card>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">ประวัติการดาวน์โหลดล่าสุด</h3>
            {isHistoryLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner className="h-8 w-8 text-primary" />
                <span className="ml-2">กำลังโหลดข้อมูล...</span>
              </div>
            ) : downloadHistory?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ผู้ใช้งาน</TableHead>
                    <TableHead>เอกสาร</TableHead>
                    <TableHead>วันเวลา</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {downloadHistory.slice(0, 10).map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2">
                            <UserCheck className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div>{log.user?.displayName || `ผู้ใช้ ID: ${log.userId}`}</div>
                            <div className="text-xs text-muted-foreground">{log.user?.department || "ไม่ระบุแผนก"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.details?.title || "ไม่ระบุชื่อเอกสาร"}
                      </TableCell>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString('th-TH')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                ไม่พบประวัติการดาวน์โหลด
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Form Dialog */}
      <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>อัปโหลดเอกสารใหม่</DialogTitle>
          </DialogHeader>
          <DocumentUploadForm 
            categories={categories || []} 
            onSuccess={handleDocumentUploaded}
            onCancel={() => setShowUploadForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
