import DocumentCard from "./DocumentCard";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Document {
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
}

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  onDownload: (documentId: number) => void;
}

export default function DocumentList({ documents, isLoading, onDownload }: DocumentListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const documentsPerPage = 6;
  
  // Calculate pagination
  const totalPages = Math.ceil(documents.length / documentsPerPage);
  const indexOfLastDocument = currentPage * documentsPerPage;
  const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
  const currentDocuments = documents.slice(indexOfFirstDocument, indexOfLastDocument);
  
  // Fetch categories to display category names
  const { data: categories } = useQuery({
    queryKey: ['/api/document-categories'],
    queryFn: async () => {
      const res = await fetch('/api/document-categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });
  
  const getCategoryName = (categoryId?: number) => {
    if (!categoryId || !categories) return "ไม่ระบุหมวดหมู่";
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : "ไม่ระบุหมวดหมู่";
  };
  
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner className="h-8 w-8 text-primary" />
        <span className="ml-2">กำลังโหลดเอกสาร...</span>
      </div>
    );
  }
  
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        ไม่พบเอกสารที่ตรงกับเงื่อนไขที่เลือก
      </div>
    );
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentDocuments.map((document) => (
          <DocumentCard 
            key={document.id} 
            document={document} 
            categoryName={getCategoryName(document.categoryId)} 
            onDownload={onDownload}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} 
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <button
                    className={`w-10 h-10 flex items-center justify-center rounded ${
                      currentPage === page 
                        ? "bg-primary text-white" 
                        : "text-secondary hover:bg-muted/80"
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} 
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
