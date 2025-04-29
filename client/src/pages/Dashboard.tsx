import { useQuery } from "@tanstack/react-query";
import { Plus, Eye, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/common/StatCard";
import ActivityTimeline from "@/components/common/ActivityTimeline";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch pending documents
  const { data: pendingDocuments, isLoading: isPendingLoading } = useQuery({
    queryKey: ['/api/circulation-documents', { status: 'pending', assignedTo: user?.id }],
    queryFn: async () => {
      const res = await fetch(`/api/circulation-documents?userId=${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch pending documents');
      return res.json();
    },
    enabled: !!user
  });
  
  // Fetch activity logs
  const { data: activityLogs, isLoading: isActivityLoading } = useQuery({
    queryKey: ['/api/activity-logs'],
    queryFn: async () => {
      const res = await fetch('/api/activity-logs');
      if (!res.ok) throw new Error('Failed to fetch activity logs');
      return res.json();
    }
  });
  
  // Fetch storage usage
  const { data: storageUsage, isLoading: isStorageLoading } = useQuery({
    queryKey: ['/api/storage-usage', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/storage-usage/${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch storage usage');
      return res.json();
    },
    enabled: !!user
  });
  
  const pendingItems = pendingDocuments?.filter(doc => doc.status === 'pending' && doc.assignedTo === user?.id) || [];
  const inProgressItems = pendingDocuments?.filter(doc => doc.status === 'in_progress') || [];
  
  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-secondary">สวัสดี, {user?.displayName}</h2>
            <p className="text-muted-foreground">ยินดีต้อนรับสู่ระบบจัดการเอกสารโรงพยาบาลเอกชล</p>
          </div>
          <Button className="mt-3 md:mt-0">
            <Plus className="mr-1 h-4 w-4" />
            สร้างเอกสารใหม่
          </Button>
        </div>
      
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard 
            title="เอกสารที่ต้องดำเนินการ"
            value={pendingItems.length.toString()}
            status="warning"
            statusLabel={`${pendingItems.length} รายการ`}
            icon="time"
            subtitle="เอกสารรออนุมัติ"
            isLoading={isPendingLoading}
          />
          
          <StatCard 
            title="สถานะเอกสารเวียน"
            value={inProgressItems.length.toString()}
            status="info"
            statusLabel={`${inProgressItems.length} รายการ`}
            icon="file-transfer"
            subtitle="เอกสารกำลังดำเนินการ"
            isLoading={isPendingLoading}
          />
          
          <StatCard 
            title="พื้นที่จัดเก็บส่วนตัว"
            value={!isStorageLoading && storageUsage ? `${Math.round(storageUsage.percentage)}%` : "0%"}
            status="success"
            statusLabel={
              !isStorageLoading && storageUsage
                ? `${(storageUsage.usage / (1024 * 1024)).toFixed(1)}/${(storageUsage.limit / (1024 * 1024)).toFixed(1)} MB`
                : "0/5 MB"
            }
            icon="folder"
            subtitle="พื้นที่ใช้งาน"
            isLoading={isStorageLoading}
          />
        </div>
      </div>
      
      {/* Main Tabs */}
      <Tabs defaultValue="download" className="mb-6">
        <TabsList className="border-b w-full rounded-none bg-transparent justify-start">
          <TabsTrigger value="download" className="rounded-none px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
            ดาวน์โหลดเอกสาร
          </TabsTrigger>
          <TabsTrigger value="circulation" className="rounded-none px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
            เอกสารเวียน
          </TabsTrigger>
          <TabsTrigger value="storage" className="rounded-none px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
            พื้นที่จัดเก็บส่วนตัว
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="download">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-secondary mb-1">ดาวน์โหลดเอกสาร</h3>
                <p className="text-sm text-muted-foreground">รวมแบบฟอร์ม/Template หนังสือราชการ ที่พร้อมใช้งาน</p>
              </div>
              <div className="mt-3 md:mt-0">
                <Link href="/download">
                  <Button variant="outline">
                    ดูทั้งหมด
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Will be populated with actual document cards */}
              <div className="doc-card border border-border rounded-lg overflow-hidden hover:cursor-pointer transition-all duration-200">
                <div className="flex items-center justify-between p-3 bg-muted">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-semibold text-secondary">แบบฟอร์มลางาน</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground mr-2">docx</span>
                    <button className="text-muted-foreground hover:text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-muted-foreground mb-3">แบบฟอร์มใบลาทั่วไป สำหรับบุคลากรทุกแผนก</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">แบบฟอร์มภายใน</span>
                    <span className="text-xs text-muted-foreground">อัปเดต: 10/05/2023</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">ดาวน์โหลด: 152 ครั้ง</span>
                    <button className="text-primary hover:text-primary/80 text-sm font-semibold flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      ดาวน์โหลด
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="circulation">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-secondary mb-1">เอกสารรออนุมัติ</h3>
                <p className="text-sm text-muted-foreground">รายการเอกสารที่ต้องได้รับการอนุมัติจากคุณ</p>
              </div>
              <div className="mt-3 md:mt-0">
                <Link href="/circulation">
                  <Button variant="outline">
                    ดูทั้งหมด
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Pending Documents Table */}
            {isPendingLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : pendingItems.length > 0 ? (
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
                    {pendingItems.slice(0, 3).map(doc => (
                      <tr key={doc.id} className="border-b border-border">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div>
                              <p className="text-sm font-semibold text-secondary">{doc.title}</p>
                              <p className="text-xs text-muted-foreground">{doc.documentNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2">
                              {doc.createdBy?.toString().substring(0, 2) || 'US'}
                            </div>
                            <span className="text-sm text-secondary">ผู้ใช้ {doc.createdBy}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-secondary">แผนก</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-secondary">
                            {new Date(doc.createdAt).toLocaleDateString('th-TH')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className="status-indicator status-pending"></span>
                            <span className="text-sm text-secondary">รออนุมัติ</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-primary hover:bg-primary/10 rounded">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-[#24a148] hover:bg-[#24a148]/10 rounded">
                              <Check className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-[#da1e28] hover:bg-[#da1e28]/10 rounded">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                ไม่มีเอกสารที่รอการอนุมัติในขณะนี้
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="storage">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-secondary mb-1">พื้นที่จัดเก็บส่วนตัว</h3>
                <p className="text-sm text-muted-foreground">พื้นที่จัดเก็บไฟล์ส่วนตัวของคุณ</p>
              </div>
              <div className="mt-3 md:mt-0">
                <Link href="/storage">
                  <Button variant="outline">
                    จัดการไฟล์
                  </Button>
                </Link>
              </div>
            </div>
            
            {isStorageLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="bg-muted p-4 rounded mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">พื้นที่ใช้งาน</span>
                  <span className="text-sm">
                    {(storageUsage?.usage / (1024 * 1024)).toFixed(1)} MB / {(storageUsage?.limit / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${storageUsage?.percentage || 0}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="flex justify-center py-4">
              <Link href="/storage">
                <Button>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  อัปโหลดไฟล์
                </Button>
              </Link>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Recent Activity */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-secondary mb-1">กิจกรรมล่าสุด</h3>
            <p className="text-sm text-muted-foreground">กิจกรรมล่าสุดในระบบเอกสาร</p>
          </div>
          <button className="mt-3 md:mt-0 text-primary hover:text-primary/80 font-semibold flex items-center">
            ดูทั้งหมด
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <ActivityTimeline activities={activityLogs || []} isLoading={isActivityLoading} />
      </div>
    </div>
  );
}
