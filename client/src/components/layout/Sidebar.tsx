import { useLocation } from "wouter";
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

// Custom NavLink component to avoid nested anchor issue
function NavLink({ href, isActive, children, onClick }: { href: string, isActive: boolean, children: React.ReactNode, onClick?: () => void }) {
  const [, setLocation] = useLocation();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation(href);
    if (onClick) onClick();
  };
  
  return (
    <div 
      onClick={handleClick}
      className={`sidebar-item flex items-center px-4 py-3 text-secondary hover:text-primary hover:bg-accent cursor-pointer ${
        isActive ? 'bg-accent text-primary font-medium' : ''
      }`}
    >
      {children}
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  
  return (
    <aside 
      id="sidebar"
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
        
        <NavLink href="/" isActive={location === '/'} onClick={onClose}>
          <LayoutDashboard className="mr-3 h-5 w-5" />
          <span>แดชบอร์ด</span>
        </NavLink>
        
        <NavLink href="/download" isActive={location === '/download'} onClick={onClose}>
          <FileDown className="mr-3 h-5 w-5" />
          <span>ดาวน์โหลดเอกสาร</span>
        </NavLink>
        
        <NavLink href="/circulation" isActive={location === '/circulation'} onClick={onClose}>
          <FileSearch className="mr-3 h-5 w-5" />
          <span>เอกสารเวียน</span>
        </NavLink>
        
        <NavLink href="/storage" isActive={location === '/storage'} onClick={onClose}>
          <Folder className="mr-3 h-5 w-5" />
          <span>พื้นที่จัดเก็บส่วนตัว</span>
        </NavLink>
        
        {isAdmin && (
          <>
            <div className="px-4 mt-6 mb-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold">สำหรับผู้ดูแลระบบ</p>
            </div>
            
            <NavLink href="/admin/users" isActive={location === '/admin/users'} onClick={onClose}>
              <UserCog className="mr-3 h-5 w-5" />
              <span>จัดการผู้ใช้งาน</span>
            </NavLink>
            
            <NavLink href="/admin/documents" isActive={location === '/admin/documents'} onClick={onClose}>
              <FileCog className="mr-3 h-5 w-5" />
              <span>จัดการเอกสาร</span>
            </NavLink>
            
            <NavLink href="/admin/settings" isActive={location === '/admin/settings'} onClick={onClose}>
              <Settings className="mr-3 h-5 w-5" />
              <span>ตั้งค่าระบบ</span>
            </NavLink>
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
