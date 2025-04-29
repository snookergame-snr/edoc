import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebarElement = document.getElementById('sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');
      
      if (sidebarElement && 
          !sidebarElement.contains(event.target as Node) && 
          toggleButton && 
          !toggleButton.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
        <span className="ml-2">กำลังโหลด...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // In a real app, redirect to login page
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white">
              <span className="font-bold text-xl">รพ</span>
            </div>
          </div>
          <h1 className="text-xl font-semibold text-center mb-6">ระบบจัดการเอกสารโรงพยาบาลเอกชล</h1>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="username">ชื่อผู้ใช้งาน</label>
              <input 
                id="username" 
                type="text" 
                className="w-full p-2 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="ชื่อผู้ใช้งาน"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="password">รหัสผ่าน</label>
              <input 
                id="password" 
                type="password" 
                className="w-full p-2 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="รหัสผ่าน"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input 
                  id="remember" 
                  type="checkbox" 
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-secondary">จดจำฉัน</label>
              </div>
              <a href="#" className="text-sm text-primary hover:underline">ลืมรหัสผ่าน?</a>
            </div>
            <button 
              type="button" 
              className="w-full bg-primary text-white p-2 rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => {
                // For demo purposes, use guest login with hardcoded user
                const { login } = useAuth.getState();
                login('somchai', 'somchai123');
              }}
            >
              เข้าสู่ระบบ
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>ระบบนี้สำหรับเจ้าหน้าที่โรงพยาบาลเอกชลเท่านั้น</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Header onToggleSidebar={toggleSidebar} />
      <div className="flex pt-16 min-h-screen">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
