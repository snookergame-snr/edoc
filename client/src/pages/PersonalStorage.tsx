import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, 
  Upload, 
  FolderPlus, 
  RefreshCw, 
  Trash, 
  Search,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import FileExplorer from "@/components/storage/FileExplorer";

export default function PersonalStorage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: number | null; name: string }[]>([
    { id: null, name: "พื้นที่หลัก" }
  ]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFileDetails, setUploadFileDetails] = useState({
    name: "",
    description: "",
    accessLevel: "private" as "private" | "department" | "public",
  });

  // Fetch storage usage
  const { data: storageUsage, isLoading: isStorageUsageLoading } = useQuery({
    queryKey: ['/api/storage-usage', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/storage-usage/${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch storage usage');
      return res.json();
    },
    enabled: !!user?.id
  });

  // Fetch files in the current folder
  const { data: files, isLoading: isFilesLoading, refetch: refetchFiles } = useQuery({
    queryKey: ['/api/storage-files', { userId: user?.id, parentId: currentFolder }],
    queryFn: async () => {
      const url = `/api/storage-files?userId=${user?.id}${
        currentFolder !== null ? `&parentId=${currentFolder}` : ''
      }`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch files');
      return res.json();
    },
    enabled: !!user?.id
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/storage-files', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/storage-files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/storage-usage'] });
      setShowUploadDialog(false);
      setSelectedFile(null);
      setUploadFileDetails({
        name: "",
        description: "",
        accessLevel: "private",
      });
      toast({
        title: "อัปโหลดสำเร็จ",
        description: "ไฟล์ถูกอัปโหลดเรียบร้อยแล้ว",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถอัปโหลดไฟล์ได้ โปรดลองอีกครั้ง",
        variant: "destructive",
      });
    }
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('name', newFolderName);
      formData.append('description', `Folder: ${newFolderName}`);
      formData.append('ownerId', user?.id.toString() || '');
      formData.append('isFolder', 'true');
      formData.append('accessLevel', 'private');
      
      if (currentFolder !== null) {
        formData.append('parentId', currentFolder.toString());
      }
      
      const res = await fetch('/api/storage-files', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Failed to create folder');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/storage-files'] });
      setShowCreateFolderDialog(false);
      setNewFolderName("");
      toast({
        title: "สร้างโฟลเดอร์สำเร็จ",
        description: "โฟลเดอร์ถูกสร้างเรียบร้อยแล้ว",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างโฟลเดอร์ได้ โปรดลองอีกครั้ง",
        variant: "destructive",
      });
    }
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const res = await fetch(`/api/storage-files/${fileId}?userId=${user?.id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete file');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/storage-files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/storage-usage'] });
      toast({
        title: "ลบไฟล์สำเร็จ",
        description: "ไฟล์ถูกย้ายไปยังถังขยะเรียบร้อยแล้ว",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบไฟล์ได้ โปรดลองอีกครั้ง",
        variant: "destructive",
      });
    }
  });

  const handleFolderClick = (folderId: number, folderName: string) => {
    setCurrentFolder(folderId);
    setFolderPath([...folderPath, { id: folderId, name: folderName }]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadFileDetails({
        ...uploadFileDetails,
        name: file.name
      });
    }
  };

  const handleUploadSubmit = () => {
    if (!selectedFile || !user) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', uploadFileDetails.name || selectedFile.name);
    formData.append('description', uploadFileDetails.description);
    formData.append('ownerId', user.id.toString());
    formData.append('accessLevel', uploadFileDetails.accessLevel);
    
    if (currentFolder !== null) {
      formData.append('parentId', currentFolder.toString());
    }
    
    uploadFileMutation.mutate(formData);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "กรุณาระบุชื่อโฟลเดอร์",
        description: "ชื่อโฟลเดอร์ไม่สามารถเว้นว่างได้",
        variant: "destructive",
      });
      return;
    }
    
    createFolderMutation.mutate();
  };

  const navigateToFolder = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolder(newPath[newPath.length - 1].id);
  };

  const handleNavigateBack = () => {
    if (folderPath.length > 1) {
      const newPath = folderPath.slice(0, -1);
      setFolderPath(newPath);
      setCurrentFolder(newPath[newPath.length - 1].id);
    }
  };

  const handleDeleteFile = (fileId: number) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้?')) {
      deleteFileMutation.mutate(fileId);
    }
  };

  // Filter files based on search term
  const filteredFiles = files?.filter((file: any) => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">พื้นที่จัดเก็บส่วนตัว</h1>
          <p className="text-muted-foreground">พื้นที่จัดเก็บไฟล์ส่วนตัวและแชร์เอกสารภายในองค์กร</p>
        </div>
        <div className="flex space-x-2 mt-3 md:mt-0">
          <Button 
            variant="outline" 
            onClick={() => setShowCreateFolderDialog(true)}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            สร้างโฟลเดอร์
          </Button>
          <Button 
            onClick={() => setShowUploadDialog(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            อัปโหลดไฟล์
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-secondary mb-1">จัดการไฟล์</h2>
            <p className="text-sm text-muted-foreground">บริหารพื้นที่จัดเก็บขนาด 5 MB ของคุณ</p>
          </div>
          
          <div className="flex flex-col md:flex-row mt-4 md:mt-0 space-y-2 md:space-y-0 md:space-x-2">
            <div className="relative">
              <input 
                type="text" 
                placeholder="ค้นหาไฟล์..." 
                className="border border-border rounded py-2 pl-8 pr-3 text-sm w-full focus:outline-none focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => refetchFiles()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Storage Usage */}
        <div className="bg-muted p-4 rounded mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">พื้นที่ใช้งาน</span>
            {isStorageUsageLoading ? (
              <Spinner className="h-4 w-4 text-primary" />
            ) : (
              <span className="text-sm">
                {(storageUsage?.usage / (1024 * 1024)).toFixed(1)} MB / {(storageUsage?.limit / (1024 * 1024)).toFixed(1)} MB
              </span>
            )}
          </div>
          <Progress 
            value={storageUsage?.percentage || 0} 
            className="h-2"
          />
        </div>
        
        {/* Folder Navigation */}
        <div className="flex items-center mb-4 overflow-x-auto pb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleNavigateBack}
            disabled={folderPath.length <= 1}
            className="mr-1"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            กลับ
          </Button>
          
          <div className="flex items-center text-sm text-muted-foreground">
            {folderPath.map((folder, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                <button
                  className={`hover:text-primary ${
                    index === folderPath.length - 1 ? 'font-semibold text-secondary' : ''
                  }`}
                  onClick={() => navigateToFolder(index)}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <FileExplorer
          files={filteredFiles}
          isLoading={isFilesLoading}
          onFolderClick={handleFolderClick}
          onDeleteFile={handleDeleteFile}
          isDeletingFile={deleteFileMutation.isPending}
        />
      </div>

      {/* Upload File Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>อัปโหลดไฟล์</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="file" className="text-sm font-medium">เลือกไฟล์</label>
              <input
                id="file"
                type="file"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                onChange={handleFileSelect}
                accept=".pdf,.docx,.xlsx,.jpg,.png,.pptx"
              />
              <p className="text-xs text-muted-foreground">
                รองรับไฟล์ .pdf, .docx, .xlsx, .jpg, .png, .pptx ขนาดไม่เกิน 10 MB
              </p>
            </div>
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="filename" className="text-sm font-medium">ชื่อไฟล์</label>
              <input
                id="filename"
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={uploadFileDetails.name}
                onChange={(e) => setUploadFileDetails({...uploadFileDetails, name: e.target.value})}
              />
            </div>
            
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="description" className="text-sm font-medium">คำอธิบาย</label>
              <input
                id="description"
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={uploadFileDetails.description}
                onChange={(e) => setUploadFileDetails({...uploadFileDetails, description: e.target.value})}
              />
            </div>
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="access" className="text-sm font-medium">ระดับการเข้าถึง</label>
              <select
                id="access"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={uploadFileDetails.accessLevel}
                onChange={(e) => setUploadFileDetails({
                  ...uploadFileDetails, 
                  accessLevel: e.target.value as "private" | "department" | "public"
                })}
              >
                <option value="private">ส่วนตัว</option>
                <option value="department">แผนก</option>
                <option value="public">ทั้งหมด</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleUploadSubmit}
                disabled={!selectedFile || uploadFileMutation.isPending}
              >
                {uploadFileMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    กำลังอัปโหลด...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    อัปโหลด
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างโฟลเดอร์ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="foldername" className="text-sm font-medium">ชื่อโฟลเดอร์</label>
              <input
                id="foldername"
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateFolderDialog(false)}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || createFolderMutation.isPending}
              >
                {createFolderMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    สร้างโฟลเดอร์
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
