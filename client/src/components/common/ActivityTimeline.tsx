import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Spinner } from "@/components/ui/spinner";

interface Activity {
  id: number;
  userId: number;
  timestamp: string;
  action: string;
  resourceType: string;
  resourceId: number;
  details: {
    documentNumber?: string;
    title?: string;
    fileName?: string;
    name?: string;
    isFolder?: boolean;
    comment?: string;
  };
  user?: {
    id: number;
    displayName: string;
    department: string;
    profileImage?: string;
  };
}

interface ActivityTimelineProps {
  activities: Activity[];
  isLoading: boolean;
  limit?: number;
}

export default function ActivityTimeline({ 
  activities, 
  isLoading,
  limit = 4
}: ActivityTimelineProps) {
  
  const formatActivityAction = (activity: Activity) => {
    switch (activity.action) {
      case 'approve':
        return `ได้อนุมัติเอกสาร`;
      case 'reject':
        return `ได้ปฏิเสธเอกสาร`;
      case 'upload':
        if (activity.resourceType === 'document') {
          return `ได้อัปโหลดเอกสาร`;
        } else if (activity.resourceType === 'storage') {
          if (activity.details.isFolder) {
            return `ได้สร้างโฟลเดอร์`;
          }
          return `ได้อัปโหลดไฟล์`;
        }
        return `ได้อัปโหลด`;
      case 'download':
        return `ได้ดาวน์โหลดเอกสาร`;
      case 'create':
        if (activity.resourceType === 'circulation') {
          return `ได้สร้างเอกสารเวียน`;
        } else if (activity.resourceType === 'workflow') {
          return `ได้สร้างขั้นตอนการทำงาน`;
        }
        return `ได้สร้าง`;
      case 'delete':
        if (activity.resourceType === 'storage') {
          if (activity.details.isFolder) {
            return `ได้ลบโฟลเดอร์`;
          }
          return `ได้ลบไฟล์`;
        }
        return `ได้ลบ`;
      case 'restore':
        return `ได้กู้คืน`;
      case 'in_progress':
        return `ได้ดำเนินการ`;
      default:
        return `ได้ ${activity.action}`;
    }
  };
  
  const formatActivityResource = (activity: Activity) => {
    if (activity.details.documentNumber) {
      return activity.details.documentNumber;
    } else if (activity.details.title) {
      return activity.details.title;
    } else if (activity.details.fileName) {
      return activity.details.fileName;
    } else if (activity.details.name) {
      return activity.details.name;
    }
    
    return `รหัส ${activity.resourceId}`;
  };
  
  const formatActivityDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: th });
    } catch (e) {
      return "ไม่ระบุเวลา";
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner className="h-6 w-6 text-primary" />
        <span className="ml-2">กำลังโหลดกิจกรรม...</span>
      </div>
    );
  }
  
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">ไม่พบกิจกรรมล่าสุด</p>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <div className="absolute left-4 h-full w-px bg-border"></div>
      
      {activities.slice(0, limit).map((activity, index) => (
        <div key={activity.id} className="ml-10 mb-6 relative">
          <div className={`absolute -left-10 top-0 w-5 h-5 rounded-full border-2 border-white ${
            activity.action === 'approve' ? 'bg-primary' :
            activity.action === 'reject' ? 'bg-[#da1e28]' :
            activity.action === 'upload' || activity.action === 'create' ? 'bg-[#24a148]' :
            activity.action === 'in_progress' ? 'bg-[#8a3ffc]' :
            'bg-[#ff832b]'
          }`}></div>
          
          <div className="bg-muted p-3 rounded">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <Avatar className="h-5 w-5 mr-2">
                  <AvatarImage
                    src={activity.user?.profileImage || `https://i.pravatar.cc/28?img=${activity.userId}`}
                    alt={activity.user?.displayName || `ผู้ใช้ ID: ${activity.userId}`}
                  />
                  <AvatarFallback>
                    {activity.user?.displayName?.substring(0, 2) || `U${activity.userId}`}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-secondary">
                  {activity.user?.displayName || `ผู้ใช้ ID: ${activity.userId}`}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatActivityDate(activity.timestamp)}
              </span>
            </div>
            <p className="text-sm text-secondary">
              {formatActivityAction(activity)} <span className="text-primary">{formatActivityResource(activity)}</span>
              {activity.details.comment && (
                <span className="block text-xs text-muted-foreground mt-1">"{activity.details.comment}"</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
