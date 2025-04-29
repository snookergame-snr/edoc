import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, Database, Lock, Server, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function InstallPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"database" | "admin" | "complete">("database");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dbConfig, setDbConfig] = useState({
    host: "localhost",
    port: "5432",
    username: "postgres",
    password: "",
    database: "hospital_docs",
    useDefault: false
  });

  const handleDbConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDbConfig(prev => ({ ...prev, [name]: value }));
  };

  const toggleUseDefault = () => {
    setDbConfig(prev => ({ 
      ...prev, 
      useDefault: !prev.useDefault,
      host: !prev.useDefault ? "localhost" : prev.host,
      port: !prev.useDefault ? "5432" : prev.port,
      username: !prev.useDefault ? "postgres" : prev.username,
      database: !prev.useDefault ? "hospital_docs" : prev.database
    }));
  };

  const handleDatabaseConnect = async () => {
    setIsLoading(true);
    try {
      // Send database configuration to server
      const response = await apiRequest("POST", "/api/install/database", {
        ...dbConfig,
        useLocal: true // Tell server to use local DB config
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "เชื่อมต่อสำเร็จ",
          description: "เชื่อมต่อฐานข้อมูลสำเร็จแล้ว",
        });
        setIsSuccess(true);
        // Move to next step after a short delay
        setTimeout(() => {
          setStep("admin");
          setIsLoading(false);
          setIsSuccess(false);
        }, 1500);
      } else {
        throw new Error(data.error || "ไม่สามารถเชื่อมต่อฐานข้อมูลได้");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถเชื่อมต่อฐานข้อมูลได้",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleInstallComplete = async () => {
    setIsLoading(true);
    try {
      // Send request to create default admin
      const response = await apiRequest("POST", "/api/install/complete", {
        createAdmin: true
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "ติดตั้งสำเร็จ",
          description: "ระบบได้ถูกติดตั้งสำเร็จแล้ว",
        });
        setIsSuccess(true);
        // Move to complete step after a short delay
        setTimeout(() => {
          setStep("complete");
          setIsLoading(false);
        }, 1500);
      } else {
        throw new Error(data.error || "ไม่สามารถติดตั้งระบบได้");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถติดตั้งระบบได้",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center font-bold gradient-text">
            ติดตั้งระบบจัดการเอกสารโรงพยาบาลเอกชล
          </CardTitle>
          <CardDescription className="text-center">
            {step === "database" && "กรุณากรอกข้อมูลการเชื่อมต่อฐานข้อมูล PostgreSQL"}
            {step === "admin" && "ตั้งค่าผู้ดูแลระบบ"}
            {step === "complete" && "ติดตั้งระบบสำเร็จแล้ว"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-between px-8 py-2">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === "database" ? "bg-primary text-white" : "bg-primary/20 text-primary"}`}>
                <Database className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">ฐานข้อมูล</span>
            </div>
            <div className="h-0.5 flex-1 bg-border mx-2"></div>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === "admin" ? "bg-primary text-white" : step === "complete" ? "bg-primary/20 text-primary" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                <User className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">ผู้ดูแลระบบ</span>
            </div>
            <div className="h-0.5 flex-1 bg-border mx-2"></div>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === "complete" ? "bg-primary text-white" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">เสร็จสิ้น</span>
            </div>
          </div>

          {/* Database configuration form */}
          {step === "database" && (
            <>
              <div className="flex items-center space-x-2 py-2">
                <Checkbox 
                  id="useDefault"
                  checked={dbConfig.useDefault}
                  onCheckedChange={toggleUseDefault}
                />
                <label
                  htmlFor="useDefault"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  ใช้ค่าเริ่มต้น (localhost:5432, postgres)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">โฮสต์ (Host)</Label>
                  <Input
                    id="host"
                    name="host"
                    placeholder="localhost"
                    value={dbConfig.host}
                    onChange={handleDbConfigChange}
                    disabled={dbConfig.useDefault}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">พอร์ต (Port)</Label>
                  <Input
                    id="port"
                    name="port"
                    placeholder="5432"
                    value={dbConfig.port}
                    onChange={handleDbConfigChange}
                    disabled={dbConfig.useDefault}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">ชื่อผู้ใช้ (Username)</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="postgres"
                  value={dbConfig.username}
                  onChange={handleDbConfigChange}
                  disabled={dbConfig.useDefault}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน (Password)</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="รหัสผ่านของฐานข้อมูล"
                  value={dbConfig.password}
                  onChange={handleDbConfigChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="database">ชื่อฐานข้อมูล (Database Name)</Label>
                <Input
                  id="database"
                  name="database"
                  placeholder="hospital_docs"
                  value={dbConfig.database}
                  onChange={handleDbConfigChange}
                  disabled={dbConfig.useDefault}
                />
              </div>
            </>
          )}

          {/* Admin Configuration */}
          {step === "admin" && (
            <div className="space-y-4 py-4">
              <div className="border rounded-md p-4 bg-accent">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  ข้อมูลผู้ดูแลระบบเริ่มต้น
                </h3>
                <dl className="grid grid-cols-[1fr_2fr] gap-y-2 text-sm">
                  <dt className="text-muted-foreground">ชื่อผู้ใช้:</dt>
                  <dd className="font-medium">admin</dd>
                  
                  <dt className="text-muted-foreground">รหัสผ่าน:</dt>
                  <dd className="font-medium">admin</dd>
                  
                  <dt className="text-muted-foreground">ชื่อ-นามสกุล:</dt>
                  <dd>ผู้ดูแลระบบ</dd>
                  
                  <dt className="text-muted-foreground">แผนก:</dt>
                  <dd>ฝ่ายไอที</dd>
                  
                  <dt className="text-muted-foreground">สิทธิ์:</dt>
                  <dd>ผู้ดูแลระบบ (Admin)</dd>
                </dl>
                <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                  <p className="flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    <span>กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Installation complete */}
          {step === "complete" && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-green-100 text-green-800 rounded-full p-3">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold">ติดตั้งสำเร็จ!</h3>
              <p className="text-muted-foreground">
                ระบบได้ถูกติดตั้งเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ
              </p>
              <div className="border rounded-md p-4 mt-4 bg-accent text-left w-full max-w-sm mx-auto">
                <dl className="grid grid-cols-[1fr_2fr] gap-y-2 text-sm">
                  <dt className="text-muted-foreground">ชื่อผู้ใช้:</dt>
                  <dd className="font-medium">admin</dd>
                  
                  <dt className="text-muted-foreground">รหัสผ่าน:</dt>
                  <dd className="font-medium">admin</dd>
                </dl>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {step === "database" && (
            <>
              <Button variant="outline" onClick={() => setLocation("/auth")}>
                ยกเลิก
              </Button>
              <Button 
                onClick={handleDatabaseConnect} 
                disabled={isLoading || isSuccess}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isSuccess ? (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                ) : (
                  <Server className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "กำลังเชื่อมต่อ..." : isSuccess ? "เชื่อมต่อสำเร็จ" : "เชื่อมต่อฐานข้อมูล"}
              </Button>
            </>
          )}

          {step === "admin" && (
            <>
              <Button variant="outline" onClick={() => setStep("database")}>
                ย้อนกลับ
              </Button>
              <Button 
                onClick={handleInstallComplete} 
                disabled={isLoading || isSuccess}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isSuccess ? (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                ) : null}
                {isLoading ? "กำลังติดตั้ง..." : isSuccess ? "ติดตั้งสำเร็จ" : "ติดตั้ง"}
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button 
              className="w-full" 
              onClick={() => setLocation("/auth")}
            >
              ไปยังหน้าเข้าสู่ระบบ
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}