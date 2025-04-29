import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileDown, 
  FileSearch, 
  Folder, 
  UserCog, 
  FileCog, 
  Settings, 
  Info,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  
  return (
    <aside 
      className={`fixed h-full w-64 bg-white shadow-md z-20 overflow-y-auto custom-scrollbar transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <nav className="py-4">
        <div className="px-4 mb-6">
          <button 
            className="md:hidden ml-auto block p-1 text-secondary hover:text-primary"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="md:hidden relative mt-3">
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
        
        <div className="px-4 mb-2">
          <p className="text-xs text-muted-foreground uppercase font-semibold">เมนูหลัก</p>
        </div>
        
        <Link href="/">
          <a 
            className={`sidebar-item flex items-center px-4 py-3 text-secondary hover:text-primary hover:bg-accent ${
              location === '/' ? 'active' : ''
            }`}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            <span>แดชบอร์ด</span>
          </a>
        </Link>
        
        <Link href="/download">
          <a 
            className={`sidebar-item flex items-center px-4 py-3 text-secondary hover:text-primary hover:bg-accent ${
              location === '/download' ? 'active' : ''
            }`}
          >
            <FileDown className="mr-3 h-5 w-5" />
            <span>ดาวน์โหลดเอกสาร</span>
          </a>
        </Link>
        
        <Link href="/circulation">
          <a 
            className={`sidebar-item flex items-center px-4 py-3 text-secondary hover:text-primary hover:bg-accent ${
              location === '/circulation' ? 'active' : ''
            }`}
          >
            <FileSearch className="mr-3 h-5 w-5" />
            <span>เอกสารเวียน</span>
          </a>
        </Link>
        
        <Link href="/storage">
          <a 
            className={`sidebar-item flex items-center px-4 py-3 text-secondary hover:text-primary hover:bg-accent ${
              location === '/storage' ? 'active' : ''
            }`}
          >
            <Folder className="mr-3 h-5 w-5" />
            <span>พื้นที่จัดเก็บส่วนตัว</span>
          </a>
        </Link>
        
        {isAdmin && (
          <>
            <div className="px-4 mt-6 mb-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold">สำหรับผู้ดูแลระบบ</p>
            </div>
            
            <Link href="/admin/users">
              <a 
                className={`sidebar-item flex items-center px-4 py-3 text-secondary hover:text-primary hover:bg-accent ${
                  location === '/admin/users' ? 'active' : ''
                }`}
              >
                <UserCog className="mr-3 h-5 w-5" />
                <span>จัดการผู้ใช้งาน</span>
              </a>
            </Link>
            
            <Link href="/admin/documents">
              <a 
                className={`sidebar-item flex items-center px-4 py-3 text-secondary hover:text-primary hover:bg-accent ${
                  location === '/admin/documents' ? 'active' : ''
                }`}
              >
                <FileCog className="mr-3 h-5 w-5" />
                <span>จัดการเอกสาร</span>
              </a>
            </Link>
            
            <Link href="/admin/settings">
              <a 
                className={`sidebar-item flex items-center px-4 py-3 text-secondary hover:text-primary hover:bg-accent ${
                  location === '/admin/settings' ? 'active' : ''
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                <span>ตั้งค่าระบบ</span>
              </a>
            </Link>
          </>
        )}
        
        <div className="px-4 py-4 mt-6 mb-2 bg-muted mx-4 rounded">
          <div className="flex items-center mb-2">
            <Info className="text-primary mr-2 h-4 w-4" />
            <p className="text-sm font-semibold">ต้องการความช่วยเหลือ?</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">พบปัญหาการใช้งาน หรือต้องการสอบถามข้อมูลเพิ่มเติม</p>
          <button className="text-xs text-primary font-semibold hover:underline">ติดต่อทีมสนับสนุน</button>
        </div>
      </nav>
    </aside>
  );
}
