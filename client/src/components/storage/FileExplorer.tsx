import { 
  File, 
  Folder, 
  FileText, 
  FileImage, 
  FileArchive, 
  FilePen, 
  FileSpreadsheet, 
  FileCode, 
  Clock, 
  Trash2, 
  Download, 
  MoreVertical 
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface StorageFile {
  id: number;
  name: string;
  description?: string;
  fileType: string;
  fileSize: number;
  isFolder: boolean;
  uploadDate: string;
  lastModified: string;
  accessLevel: string;
}

interface FileExplorerProps {
  files: StorageFile[];
  isLoading: boolean;
  onFolderClick: (folderId: number, folderName: string) => void;
  onDeleteFile: (fileId: number) => void;
  isDeletingFile: boolean;
}

export default function FileExplorer({ 
  files, 
  isLoading, 
  onFolderClick,
  onDeleteFile,
  isDeletingFile
}: FileExplorerProps) {
  
  // Function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Function to determine which icon to use based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType === 'folder') return <Folder className="h-5 w-5 text-primary" />;
    
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FilePen className="h-5 w-5 text-[#da1e28]" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-primary" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-[#24a148]" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-5 w-5 text-[#8a3ffc]" />;
      case 'zip':
      case 'rar':
        return <FileArchive className="h-5 w-5 text-[#ff832b]" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const getAccessLevelText = (level: string) => {
    switch (level) {
      case 'private':
        return 'ส่วนตัว';
      case 'department':
        return 'แผนก';
      case 'public':
        return 'ทั้งหมด';
      default:
        return 'ไม่ระบุ';
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: th });
    } catch (e) {
      return "ไม่ระบุวันที่";
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner className="h-8 w-8 text-primary mb-2" />
        <p className="text-muted-foreground">กำลังโหลดไฟล์...</p>
      </div>
    );
  }
  
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Folder className="h-12 w-12 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium text-secondary mb-1">ไม่พบไฟล์</h3>
        <p className="text-muted-foreground">
          โฟลเดอร์นี้ว่างเปล่า กรุณาอัปโหลดไฟล์หรือสร้างโฟลเดอร์ใหม่
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Folders first */}
      {files.filter(file => file.isFolder).length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">โฟลเดอร์</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files
              .filter(file => file.isFolder)
              .map(folder => (
                <div 
                  key={folder.id} 
                  className="border border-border rounded-lg p-3 hover:border-primary cursor-pointer transition-all"
                  onClick={() => onFolderClick(folder.id, folder.name)}
                >
                  <div className="flex items-center mb-2">
                    <Folder className="h-5 w-5 text-primary mr-2" />
                    <span className="font-medium truncate">{folder.name}</span>
                  </div>
                  {folder.description && (
                    <p className="text-xs text-muted-foreground mb-2 truncate">{folder.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{formatDate(folder.uploadDate)}</span>
                    </div>
                    <span>{getAccessLevelText(folder.accessLevel)}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
      
      {/* Files */}
      {files.filter(file => !file.isFolder).length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">ไฟล์</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">ชื่อ</th>
                  <th className="pb-2 font-medium">ประเภท</th>
                  <th className="pb-2 font-medium">ขนาด</th>
                  <th className="pb-2 font-medium">แก้ไขล่าสุด</th>
                  <th className="pb-2 font-medium text-right">การเข้าถึง</th>
                  <th className="pb-2 font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {files
                  .filter(file => !file.isFolder)
                  .map(file => (
                    <tr key={file.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3">
                        <div className="flex items-center">
                          {getFileIcon(file.fileType)}
                          <div className="ml-2">
                            <p className="text-sm font-medium">{file.name}</p>
                            {file.description && (
                              <p className="text-xs text-muted-foreground">{file.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-xs px-2 py-1 bg-muted rounded-full">
                          {file.fileType}
                        </span>
                      </td>
                      <td className="py-3 text-sm">{formatFileSize(file.fileSize)}</td>
                      <td className="py-3 text-sm">{formatDate(file.lastModified)}</td>
                      <td className="py-3 text-sm text-right">{getAccessLevelText(file.accessLevel)}</td>
                      <td className="py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer">
                              <Download className="mr-2 h-4 w-4" />
                              <span>ดาวน์โหลด</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-destructive focus:text-destructive" 
                              onClick={() => onDeleteFile(file.id)}
                              disabled={isDeletingFile}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>ลบ</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
