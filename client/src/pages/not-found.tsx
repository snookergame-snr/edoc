import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="bg-red-100 p-3 rounded-full mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบหน้าที่ต้องการ</h1>
            <p className="text-gray-600">
              หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบ หรือไม่มีอยู่ในระบบ
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => setLocation("/")}
              className="w-full"
            >
              กลับไปยังหน้าหลัก
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full"
            >
              กลับไปยังหน้าก่อนหน้า
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
