import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Save, 
  Lock, 
  FileText, 
  Database, 
  Server, 
  Mail, 
  Clock, 
  Shield, 
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import WorkflowBuilder from "@/components/circulation/WorkflowBuilder";

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("general");

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  // Fetch workflows for workflow settings
  const { data: workflows, isLoading: isWorkflowsLoading } = useQuery({
    queryKey: ['/api/workflows'],
    queryFn: async () => {
      const res = await fetch('/api/workflows');
      if (!res.ok) throw new Error('Failed to fetch workflows');
      return res.json();
    }
  });

  const handleSaveSettings = () => {
    toast({
      title: "บันทึกการตั้งค่า",
      description: "การตั้งค่าถูกบันทึกเรียบร้อยแล้ว",
      variant: "default",
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-secondary mb-2">การเข้าถึงถูกจำกัด</h2>
          <p className="text-muted-foreground mb-4">
            คุณไม่มีสิทธิ์ในการเข้าถึงหน้าตั้งค่าระบบ กรุณาติดต่อผู้ดูแลระบบ
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
          <h1 className="text-2xl font-bold text-secondary">ตั้งค่าระบบ</h1>
          <p className="text-muted-foreground">กำหนดค่าการทำงานของระบบเอกสาร</p>
        </div>
        <Button 
          className="mt-3 md:mt-0" 
          onClick={handleSaveSettings}
        >
          <Save className="mr-2 h-4 w-4" />
          บันทึกการตั้งค่า
        </Button>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-border">
        <Tabs 
          defaultValue="general" 
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
            <TabsTrigger value="general">ทั่วไป</TabsTrigger>
            <TabsTrigger value="document">เอกสาร</TabsTrigger>
            <TabsTrigger value="workflow">ขั้นตอนการทำงาน</TabsTrigger>
            <TabsTrigger value="system">ระบบ</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลโรงพยาบาล</CardTitle>
                  <CardDescription>
                    ตั้งค่าข้อมูลพื้นฐานของโรงพยาบาลที่แสดงในระบบเอกสาร
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hospital-name">ชื่อโรงพยาบาล</Label>
                      <Input
                        id="hospital-name"
                        placeholder="ชื่อโรงพยาบาล"
                        defaultValue="โรงพยาบาลเอกชล"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hospital-code">รหัสโรงพยาบาล</Label>
                      <Input
                        id="hospital-code"
                        placeholder="รหัสโรงพยาบาล"
                        defaultValue="EKCH-001"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hospital-address">ที่อยู่</Label>
                    <Input
                      id="hospital-address"
                      placeholder="ที่อยู่โรงพยาบาล"
                      defaultValue="123 ถนนเอกชล ตำบลเมือง อำเภอเมือง จังหวัดชลบุรี 20000"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hospital-phone">หมายเลขโทรศัพท์</Label>
                      <Input
                        id="hospital-phone"
                        placeholder="หมายเลขโทรศัพท์"
                        defaultValue="038-123456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hospital-email">อีเมล</Label>
                      <Input
                        id="hospital-email"
                        placeholder="อีเมล"
                        defaultValue="contact@ekchhospital.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>ตั้งค่าการแจ้งเตือน</CardTitle>
                  <CardDescription>
                    กำหนดการแจ้งเตือนต่างๆ ในระบบ
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>แจ้งเตือนเมื่อมีเอกสารใหม่</Label>
                      <p className="text-sm text-muted-foreground">
                        แจ้งเตือนผู้ใช้งานเมื่อมีเอกสารใหม่ในระบบ
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>แจ้งเตือนผ่านอีเมล</Label>
                      <p className="text-sm text-muted-foreground">
                        ส่งการแจ้งเตือนผ่านอีเมลให้กับผู้ใช้งาน
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>แจ้งเตือนเมื่อเอกสารหมดอายุ</Label>
                      <p className="text-sm text-muted-foreground">
                        แจ้งเตือนเมื่อเอกสารใกล้หมดอายุหรือต้องต่ออายุ
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="document">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>ตั้งค่าเอกสาร</CardTitle>
                  <CardDescription>
                    กำหนดการจัดการเอกสารในระบบ
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-file-size">ขนาดไฟล์สูงสุด (MB)</Label>
                      <Input
                        id="max-file-size"
                        placeholder="ขนาดไฟล์สูงสุด"
                        defaultValue="10"
                        type="number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allowed-file-types">ประเภทไฟล์ที่อนุญาต</Label>
                      <Input
                        id="allowed-file-types"
                        placeholder="ประเภทไฟล์ที่อนุญาต"
                        defaultValue=".pdf, .docx, .xlsx, .jpg, .png"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>บันทึกประวัติการดาวน์โหลด</Label>
                      <p className="text-sm text-muted-foreground">
                        บันทึกประวัติการดาวน์โหลดเอกสารของผู้ใช้งาน
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>กำหนดวันหมดอายุเอกสาร</Label>
                      <p className="text-sm text-muted-foreground">
                        ให้ผู้ใช้งานสามารถกำหนดวันหมดอายุของเอกสารได้
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>ระบบ Version Control</Label>
                      <p className="text-sm text-muted-foreground">
                        เปิดใช้งานระบบจัดการเวอร์ชันของเอกสาร
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>ตั้งค่าพื้นที่จัดเก็บ</CardTitle>
                  <CardDescription>
                    กำหนดพื้นที่จัดเก็บส่วนตัวสำหรับผู้ใช้งาน
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storage-limit">พื้นที่จัดเก็บสูงสุดต่อผู้ใช้ (MB)</Label>
                      <Input
                        id="storage-limit"
                        placeholder="พื้นที่จัดเก็บสูงสุด"
                        defaultValue="5"
                        type="number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trash-days">วันที่เก็บในถังขยะ</Label>
                      <Input
                        id="trash-days"
                        placeholder="จำนวนวัน"
                        defaultValue="7"
                        type="number"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>ถังขยะ</Label>
                      <p className="text-sm text-muted-foreground">
                        เปิดใช้งานถังขยะสำหรับไฟล์ที่ถูกลบ
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>การแชร์ไฟล์</Label>
                      <p className="text-sm text-muted-foreground">
                        อนุญาตให้ผู้ใช้งานสามารถแชร์ไฟล์กับผู้ใช้อื่นได้
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="workflow">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>ขั้นตอนการทำงานมาตรฐาน</CardTitle>
                  <CardDescription>
                    กำหนดขั้นตอนการทำงานมาตรฐานสำหรับเอกสารเวียน
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isWorkflowsLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <Spinner className="h-6 w-6 text-primary" />
                      <span className="ml-2">กำลังโหลดข้อมูล...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded">
                        <p className="text-sm">ระบบมีขั้นตอนการทำงานทั้งหมด {workflows?.length || 0} รูปแบบ</p>
                      </div>
                      
                      {workflows?.map((workflow: any) => (
                        <div key={workflow.id} className="border border-border rounded-md p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{workflow.name}</h4>
                              <p className="text-sm text-muted-foreground">{workflow.description}</p>
                            </div>
                            {workflow.isDefault && (
                              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                ค่าเริ่มต้น
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-2 mt-4">
                            <p className="text-sm font-medium">ขั้นตอนการทำงาน:</p>
                            <div className="flex flex-col space-y-2">
                              {workflow.steps.map((step: any, index: number) => (
                                <div key={index} className="flex items-center">
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs mr-2">
                                    {index + 1}
                                  </div>
                                  <span>{step.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-4 flex space-x-2">
                            <Button variant="outline" size="sm">แก้ไข</Button>
                            {!workflow.isDefault && (
                              <Button variant="outline" size="sm">ตั้งเป็นค่าเริ่มต้น</Button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <Button className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        เพิ่มขั้นตอนการทำงานใหม่
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="system">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลระบบ</CardTitle>
                  <CardDescription>
                    ข้อมูลระบบจัดการเอกสารโรงพยาบาลเอกชล
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">เวอร์ชันระบบ:</span>
                      <span className="text-sm">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">วันที่อัปเดตล่าสุด:</span>
                      <span className="text-sm">01/07/2023</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">สถานะระบบ:</span>
                      <span className="text-sm flex items-center text-green-600">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        ทำงานปกติ
                      </span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">การตั้งค่าการสำรองข้อมูล</h4>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>สำรองข้อมูลอัตโนมัติ</Label>
                        <p className="text-sm text-muted-foreground">
                          สำรองข้อมูลระบบอัตโนมัติทุกวัน
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="backup-time">เวลาสำรองข้อมูล</Label>
                        <Input
                          id="backup-time"
                          placeholder="เวลาสำรองข้อมูล"
                          defaultValue="00:00"
                          type="time"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="backup-retention">จำนวนวันที่เก็บข้อมูลสำรอง</Label>
                        <Input
                          id="backup-retention"
                          placeholder="จำนวนวัน"
                          defaultValue="30"
                          type="number"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">ความปลอดภัย</h4>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>การยืนยันตัวตนสองชั้น</Label>
                        <p className="text-sm text-muted-foreground">
                          เปิดใช้งานการยืนยันตัวตนสองชั้นสำหรับผู้ใช้งาน
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>บันทึกประวัติการเข้าใช้งาน</Label>
                        <p className="text-sm text-muted-foreground">
                          บันทึกประวัติการเข้าใช้งานของผู้ใช้ทั้งหมด
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>ล็อกเอาท์อัตโนมัติ</Label>
                        <p className="text-sm text-muted-foreground">
                          ล็อกเอาท์ผู้ใช้งานโดยอัตโนมัติหลังจากไม่มีการใช้งาน
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="timeout">เวลาไม่มีการใช้งาน (นาที)</Label>
                        <Input
                          id="timeout"
                          placeholder="เวลาไม่มีการใช้งาน"
                          defaultValue="30"
                          type="number"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
