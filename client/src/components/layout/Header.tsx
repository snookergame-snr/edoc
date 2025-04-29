import { useState } from "react";
import { Menu, Bell, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            className="lg:hidden mr-3 p-2 text-secondary hover:bg-muted rounded"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center">
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white mr-2">
              <span className="font-bold">รพ</span>
            </div>
            <div>
              <h1 className="font-semibold text-xl text-secondary">โรงพยาบาลเอกชล</h1>
              <p className="text-xs text-muted-foreground">ระบบจัดการเอกสาร</p>
            </div>
          </div>
        </div>
        
        <div className="hidden md:block">
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="ค้นหาเอกสาร..." 
              className="w-full py-2 px-4 bg-muted rounded border border-border focus:outline-none focus:border-primary text-sm"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex items-center">
          <button className="relative mr-4 p-2 text-muted-foreground hover:text-primary">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full"></span>
          </button>
          <div className="relative">
            <button 
              className="flex items-center"
              onClick={toggleProfileMenu}
            >
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src="https://i.pravatar.cc/100?img=6" alt={user?.displayName || "ผู้ใช้"} />
                <AvatarFallback>{user?.displayName?.substring(0, 2) || "รพ"}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-secondary">{user?.displayName || "ผู้ใช้งาน"}</p>
                <p className="text-xs text-muted-foreground">{user?.department || "แผนกทั่วไป"}</p>
              </div>
              <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </button>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-border">
                <button className="block w-full text-left px-4 py-2 text-sm text-secondary hover:bg-muted">
                  โปรไฟล์
                </button>
                <button className="block w-full text-left px-4 py-2 text-sm text-secondary hover:bg-muted">
                  ตั้งค่าบัญชี
                </button>
                <div className="border-t border-border my-1"></div>
                <button 
                  className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted"
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                >
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
