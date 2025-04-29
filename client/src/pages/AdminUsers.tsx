import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  UserIcon, 
  Shield, 
  Building, 
  Mail, 
  CheckCircle2, 
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  // Fetch users
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });

  // Filter users based on search term
  const filteredUsers = users?.filter((u: any) => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Role mapper for display
  const roleMapper = {
    admin: { label: "ผู้ดูแลระบบ", color: "bg-blue-100 text-blue-800" },
    manager: { label: "ผู้จัดการ", color: "bg-purple-100 text-purple-800" },
    staff: { label: "เจ้าหน้าที่", color: "bg-green-100 text-green-800" }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-secondary mb-2">การเข้าถึงถูกจำกัด</h2>
          <p className="text-muted-foreground mb-4">
            คุณไม่มีสิทธิ์ในการเข้าถึงหน้าจัดการผู้ใช้งาน กรุณาติดต่อผู้ดูแลระบบ
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
          <h1 className="text-2xl font-bold text-secondary">จัดการผู้ใช้งาน</h1>
          <p className="text-muted-foreground">จัดการบัญชีผู้ใช้งานและสิทธิ์การเข้าถึงระบบ</p>
        </div>
        <Button 
          className="mt-3 md:mt-0" 
          onClick={() => {
            toast({
              title: "คุณสมบัตินี้ยังไม่พร้อมใช้งาน",
              description: "การเพิ่มผู้ใช้งานใหม่จะเปิดให้บริการเร็วๆ นี้",
              variant: "default",
            });
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มผู้ใช้งาน
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ผู้ใช้งานทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">บัญชีที่ลงทะเบียนในระบบ</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ผู้ดูแลระบบ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter((u: any) => u.role === 'admin').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">บัญชีที่มีสิทธิ์ผู้ดูแลระบบ</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">แผนก</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(users?.map((u: any) => u.department)).size || 0}
            </div>
            <p className="text-xs text-muted-foreground">แผนกในระบบ</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-secondary mb-1">รายชื่อผู้ใช้งาน</h2>
            <p className="text-sm text-muted-foreground">จัดการข้อมูลและสิทธิ์ผู้ใช้งานทั้งหมดในระบบ</p>
          </div>
          
          <div className="flex flex-col md:flex-row mt-4 md:mt-0 space-y-2 md:space-y-0 md:space-x-2">
            <div className="relative">
              <input 
                type="text" 
                placeholder="ค้นหาผู้ใช้งาน..." 
                className="border border-border rounded py-2 pl-8 pr-3 text-sm w-full focus:outline-none focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
          </div>
        </div>
        
        {isUsersLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner className="h-8 w-8 text-primary" />
            <span className="ml-2">กำลังโหลดข้อมูล...</span>
          </div>
        ) : filteredUsers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ผู้ใช้งาน</TableHead>
                <TableHead>บัญชีผู้ใช้</TableHead>
                <TableHead>แผนก</TableHead>
                <TableHead>ระดับสิทธิ์</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead className="text-right">สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u: any) => {
                const role = roleMapper[u.role as keyof typeof roleMapper] || { label: u.role, color: "bg-gray-100 text-gray-800" };
                
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={u.profileImage || `https://i.pravatar.cc/100?u=${u.id}`} alt={u.displayName} />
                          <AvatarFallback>
                            {u.displayName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{u.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{u.department}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${role.color}`}>
                        {role.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{u.email || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                        <span>ใช้งาน</span>
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            ไม่พบผู้ใช้งานที่ตรงกับคำค้นหา
          </div>
        )}
      </div>
    </div>
  );
}
