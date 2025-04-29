import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Filter as FilterIcon,
  Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import DocumentList from "@/components/documents/DocumentList";
import DocumentFilter from "@/components/documents/DocumentFilter";
import DocumentUploadForm from "@/components/documents/DocumentUploadForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";

interface Category {
  id: number;
  name: string;
  type: string;
}

export default function DownloadCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const isAdmin = user?.role === "admin";

  // Fetch document categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['/api/document-categories'],
    queryFn: async () => {
      const res = await fetch('/api/document-categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  // Fetch documents
  const { data: documents, isLoading: isDocumentsLoading, refetch } = useQuery({
    queryKey: ['/api/documents', { categoryId: selectedCategory }],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/documents?categoryId=${selectedCategory}`
        : '/api/documents';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    }
  });

  const handleDownload = async (documentId: number) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/download?userId=${user?.id}`);
      if (!res.ok) throw new Error('Failed to download document');
      
      const data = await res.json();
      
      // In a real app, we would trigger a file download here
      // For now, just show a success message
      toast({
        title: "เอกสารพร้อมดาวน์โหลด",
        description: `ดาวน์โหลด ${data.document.title} สำเร็จ`,
        variant: "default",
      });
      
      // Refetch documents to update the download count
      refetch();
      
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดาวน์โหลดเอกสารได้ โปรดลองอีกครั้ง",
        variant: "destructive",
      });
    }
  };

  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDocumentUploaded = () => {
    setShowUploadForm(false);
    refetch();
    toast({
      title: "อัปโหลดสำเร็จ",
      description: "เอกสารถูกอัปโหลดเรียบร้อยแล้ว",
      variant: "default",
    });
  };

  // Filter documents by search term
  const filteredDocuments = documents?.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">ดาวน์โหลดเอกสาร</h1>
          <p className="text-muted-foreground">รวมแบบฟอร์ม/Template หนังสือราชการ ที่พร้อมใช้งาน</p>
        </div>
        {isAdmin && (
          <Button 
            className="mt-3 md:mt-0" 
            onClick={() => setShowUploadForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มเอกสารใหม่
          </Button>
        )}
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-secondary mb-1">แบบฟอร์มและเอกสาร</h2>
            <p className="text-sm text-muted-foreground">ค้นหาและดาวน์โหลดเอกสารที่ต้องการ</p>
          </div>
          
          <div className="flex flex-col md:flex-row mt-4 md:mt-0 space-y-2 md:space-y-0 md:space-x-2">
            <div className="relative">
              <input 
                type="text" 
                placeholder="ค้นหาเอกสาร..." 
                className="border border-border rounded py-2 pl-8 pr-3 text-sm w-full focus:outline-none focus:border-primary"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
            
            <Button 
              variant="outline" 
              className="flex items-center" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className="mr-2 h-4 w-4" />
              กรองรายการ
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <DocumentFilter 
            categories={categories || []}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryClick}
            isLoading={isCategoriesLoading}
          />
        )}
        
        <div className="mb-6">
          <div className="flex overflow-x-auto pb-1 space-x-2">
            <button 
              className={`${
                selectedCategory === null 
                  ? "bg-primary text-white" 
                  : "bg-muted hover:bg-muted/80 text-secondary"
              } rounded-full px-4 py-1 text-sm whitespace-nowrap`}
              onClick={() => handleCategoryClick(null)}
            >
              ทั้งหมด
            </button>
            
            {isCategoriesLoading ? (
              <div className="flex items-center justify-center px-4">
                <Spinner className="h-4 w-4 text-primary" />
              </div>
            ) : (
              categories?.map((category: Category) => (
                <button 
                  key={category.id}
                  className={`${
                    selectedCategory === category.id 
                      ? "bg-primary text-white" 
                      : "bg-muted hover:bg-muted/80 text-secondary"
                  } rounded-full px-4 py-1 text-sm whitespace-nowrap`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  {category.name}
                </button>
              ))
            )}
          </div>
        </div>
        
        <DocumentList 
          documents={filteredDocuments} 
          isLoading={isDocumentsLoading}
          onDownload={handleDownload}
        />
      </div>

      {/* Upload Form Dialog */}
      <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>อัปโหลดเอกสารใหม่</DialogTitle>
          </DialogHeader>
          <DocumentUploadForm 
            categories={categories || []} 
            onSuccess={handleDocumentUploaded}
            onCancel={() => setShowUploadForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
