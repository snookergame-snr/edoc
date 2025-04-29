import { FileText, File, FilePlus2, FileImage, Download, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface DocumentCardProps {
  document: {
    id: number;
    title: string;
    description: string;
    fileType: string;
    fileName: string;
    uploadDate: string;
    lastUpdated: string;
    downloadCount: number;
    tags?: string[];
    categoryId?: number;
  };
  categoryName?: string;
  onDownload: (documentId: number) => void;
}

export default function DocumentCard({ document, categoryName, onDownload }: DocumentCardProps) {
  // Function to determine which icon to use based on file type
  const getFileIcon = () => {
    switch (document.fileType.toLowerCase()) {
      case 'pdf':
        return <File className="h-5 w-5 text-[#da1e28]" />;
      case 'docx':
      case 'doc':
        return <FilePlus2 className="h-5 w-5 text-primary" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileImage className="h-5 w-5 text-[#8a3ffc]" />;
      default:
        return <FileText className="h-5 w-5 text-primary" />;
    }
  };

  const formatUploadDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `อัปเดต: ${date.toLocaleDateString('th-TH')}`;
    } catch (e) {
      return "ไม่ระบุวันที่";
    }
  };

  return (
    <div className="doc-card border border-border rounded-lg overflow-hidden hover:cursor-pointer transition-all duration-200">
      <div className="flex items-center justify-between p-3 bg-muted">
        <div className="flex items-center">
          {getFileIcon()}
          <span className="text-sm font-semibold text-secondary ml-2">{document.title}</span>
        </div>
        <div className="flex items-center">
          <span className="text-xs text-muted-foreground mr-2">{document.fileType}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-primary">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDownload(document.id)}>
                <Download className="h-4 w-4 mr-2" />
                ดาวน์โหลด
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm text-muted-foreground mb-3">
          {document.description || "ไม่มีคำอธิบาย"}
        </p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
            {categoryName || "ไม่ระบุหมวดหมู่"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatUploadDate(document.lastUpdated)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">ดาวน์โหลด: {document.downloadCount} ครั้ง</span>
          <button 
            className="text-primary hover:text-primary/80 text-sm font-semibold flex items-center"
            onClick={() => onDownload(document.id)}
          >
            <Download className="h-4 w-4 mr-1" />
            ดาวน์โหลด
          </button>
        </div>
      </div>
    </div>
  );
}
