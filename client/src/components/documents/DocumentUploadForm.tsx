import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface DocumentUploadFormProps {
  categories: any[];
  onSuccess: () => void;
  onCancel: () => void;
}

// Form validation schema
const uploadSchema = z.object({
  title: z.string().min(1, "กรุณาระบุชื่อเอกสาร"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  tags: z.string().optional(),
  accessRoles: z.string().optional(),
  accessDepartments: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export default function DocumentUploadForm({ categories, onSuccess, onCancel }: DocumentUploadFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      tags: "",
      accessRoles: "admin,manager,staff",
      accessDepartments: "",
    }
  });
  
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'อัปโหลดเอกสารไม่สำเร็จ');
      }
      
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const onSubmit = (data: UploadFormValues) => {
    if (!selectedFile) {
      toast({
        title: "กรุณาเลือกไฟล์",
        description: "คุณต้องเลือกไฟล์เอกสารที่ต้องการอัปโหลด",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "ไม่พบข้อมูลผู้ใช้งาน",
        description: "กรุณาเข้าสู่ระบบก่อนอัปโหลดเอกสาร",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('categoryId', data.categoryId);
    formData.append('uploadedBy', user.id.toString());
    
    // Convert tags, roles, departments to arrays
    const tags = data.tags?.split(',').map(tag => tag.trim()) || [];
    const accessRoles = data.accessRoles?.split(',').map(role => role.trim()) || [];
    const accessDepartments = data.accessDepartments?.split(',').map(dept => dept.trim()) || [];
    
    formData.append('tags', JSON.stringify(tags));
    formData.append('accessRoles', JSON.stringify(accessRoles));
    formData.append('accessDepartments', JSON.stringify(accessDepartments));
    
    uploadMutation.mutate(formData);
  };
  
  // Group categories by type
  const groupedCategories = categories.reduce(
    (acc, category) => {
      const type = category.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(category);
      return acc;
    },
    {} as Record<string, any[]>
  );
  
  // Map type names for display
  const typeNameMap: Record<string, string> = {
    'internal_form': 'แบบฟอร์มภายใน',
    'external_form': 'แบบฟอร์มภายนอก',
    'template': 'เทมเพลต'
  };
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="title">ชื่อเอกสาร <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="ชื่อเอกสาร"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">หมวดหมู่ <span className="text-red-500">*</span></Label>
            <Select onValueChange={(value) => {
              const input = document.querySelector(`input[name="categoryId"]`) as HTMLInputElement;
              if (input) input.value = value;
            }}>
              <SelectTrigger className={errors.categoryId ? "border-red-500" : ""}>
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedCategories).map(([type, categoriesInType]) => (
                  <SelectGroup key={type}>
                    <SelectLabel>{typeNameMap[type] || type}</SelectLabel>
                    {categoriesInType.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register("categoryId")} />
            {errors.categoryId && (
              <p className="text-xs text-red-500">{errors.categoryId.message}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <Label htmlFor="description">คำอธิบาย</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="คำอธิบายเอกสาร"
            rows={3}
          />
        </div>
        
        <div className="space-y-2 mb-4">
          <Label htmlFor="file">ไฟล์เอกสาร <span className="text-red-500">*</span></Label>
          <Input
            id="file"
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.docx,.xlsx,.jpg,.png"
            className={!selectedFile ? "border-red-500" : ""}
          />
          {!selectedFile && (
            <p className="text-xs text-red-500">กรุณาเลือกไฟล์</p>
          )}
          <p className="text-xs text-muted-foreground">
            รองรับไฟล์ .pdf, .docx, .xlsx, .jpg, .png
          </p>
        </div>
        
        <Card className="mb-4">
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium mb-2">ตั้งค่าขั้นสูง</h3>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="tags">แท็ก (คั่นด้วยเครื่องหมายจุลภาค)</Label>
              <Input
                id="tags"
                {...register("tags")}
                placeholder="เช่น: แบบฟอร์ม, ลางาน, ทั่วไป"
              />
              <p className="text-xs text-muted-foreground">
                แท็กช่วยในการค้นหาเอกสาร
              </p>
            </div>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="accessRoles">ระดับผู้ใช้งานที่เข้าถึงได้ (คั่นด้วยเครื่องหมายจุลภาค)</Label>
              <Input
                id="accessRoles"
                {...register("accessRoles")}
                placeholder="เช่น: admin, manager, staff"
                defaultValue="admin,manager,staff"
              />
              <p className="text-xs text-muted-foreground">
                กำหนดระดับผู้ใช้งานที่สามารถเข้าถึงเอกสารนี้ได้
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accessDepartments">แผนกที่เข้าถึงได้ (คั่นด้วยเครื่องหมายจุลภาค)</Label>
              <Input
                id="accessDepartments"
                {...register("accessDepartments")}
                placeholder="เช่น: แผนกบุคคล, แผนกบัญชี"
              />
              <p className="text-xs text-muted-foreground">
                หากไม่ระบุ ทุกแผนกจะสามารถเข้าถึงได้
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button 
            type="submit"
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                กำลังอัปโหลด...
              </>
            ) : (
              'อัปโหลดเอกสาร'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
