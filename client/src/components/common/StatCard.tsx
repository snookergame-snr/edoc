import { 
  Clock, 
  Files, 
  Folder, 
  FileText,
  Users,
  BarChart,
  Building,
  Bell
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface StatCardProps {
  title: string;
  value: string;
  status: "warning" | "info" | "success" | "danger" | "primary";
  statusLabel: string;
  icon: "time" | "file-transfer" | "folder" | "file" | "users" | "chart" | "department" | "notification";
  subtitle: string;
  isLoading?: boolean;
}

export default function StatCard({
  title,
  value,
  status,
  statusLabel,
  icon,
  subtitle,
  isLoading = false
}: StatCardProps) {
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'warning':
        return 'bg-[#ff832b] bg-opacity-10 text-[#ff832b]';
      case 'info':
        return 'bg-[#8a3ffc] bg-opacity-10 text-[#8a3ffc]';
      case 'success':
        return 'bg-[#24a148] bg-opacity-10 text-[#24a148]';
      case 'danger':
        return 'bg-[#da1e28] bg-opacity-10 text-[#da1e28]';
      case 'primary':
        return 'bg-primary bg-opacity-10 text-primary';
      default:
        return 'bg-primary bg-opacity-10 text-primary';
    }
  };
  
  const getStatusTextClass = (status: string) => {
    switch (status) {
      case 'warning':
        return 'text-white bg-[#ff832b]';
      case 'info':
        return 'text-white bg-[#8a3ffc]';
      case 'success':
        return 'text-white bg-[#24a148]';
      case 'danger':
        return 'text-white bg-[#da1e28]';
      case 'primary':
        return 'text-white bg-primary';
      default:
        return 'text-white bg-primary';
    }
  };
  
  const getIcon = () => {
    switch (icon) {
      case 'time':
        return <Clock className="text-xl" />;
      case 'file-transfer':
        return <Files className="text-xl" />;
      case 'folder':
        return <Folder className="text-xl" />;
      case 'file':
        return <FileText className="text-xl" />;
      case 'users':
        return <Users className="text-xl" />;
      case 'chart':
        return <BarChart className="text-xl" />;
      case 'department':
        return <Building className="text-xl" />;
      case 'notification':
        return <Bell className="text-xl" />;
      default:
        return <FileText className="text-xl" />;
    }
  };
  
  return (
    <Card className="border border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
          <span className={`text-white text-xs rounded-full px-2 py-1 ${getStatusTextClass(status)}`}>
            {statusLabel}
          </span>
        </div>
        
        <div className="flex items-center">
          <div className={`${getStatusClass(status)} p-3 rounded mr-3`}>
            {getIcon()}
          </div>
          <div>
            {isLoading ? (
              <div className="flex items-center">
                <Spinner className="h-5 w-5 mr-2" />
                <span className="text-muted-foreground">กำลังโหลด...</span>
              </div>
            ) : (
              <>
                <p className="text-2xl font-semibold text-secondary">{value}</p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
