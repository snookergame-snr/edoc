import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CirculationFormProps {
  workflows: any[];
  isWorkflowsLoading: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

// Form validation schema
const circulationSchema = z.object({
  title: z.string().min(1, "กรุณาระบุชื่อเอกสาร"),
  documentNumber: z.string().min(1, "กรุณาระบุเลขที่เอกสาร"),
  content: z.string().optional(),
  workflowId: z.string().optional(),
  tags: z.string().optional(),
});

type CirculationFormValues = z.infer<typeof circulationSchema>;

export default function CirculationForm({ 
  workflows, 
  isWorkflowsLoading, 
  onSuccess, 
  onCancel 
}: CirculationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<CirculationFormValues>({
    resolver: zodResolver(circulationSchema),
    defaultValues: {
      title: "",
      documentNumber: `MEMO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
      content: "",
      workflowId: "",
      tags: "",
    }
  });
  
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/circulation-documents', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'สร้างเอกสารไม่สำเร็จ');
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
  
  const onSubmit = (data: CirculationFormValues) => {
    if (!user) {
      toast({
        title: "ไม่พบข้อมูลผู้ใช้งาน",
        description: "กรุณาเข้าสู่ระบบก่อนสร้างเอกสาร",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('documentNumber', data.documentNumber);
    formData.append('content', data.content || '');
    formData.append('createdBy', user.id.toString());
    
    if (data.workflowId) {
      formData.append('workflowId', data.workflowId);
      
      // Get the first step's assignee (for now, hardcoded to manager role user)
      const workflow = workflows.find(w => w.id.toString() === data.workflowId);
      if (workflow && workflow.steps && workflow.steps.length > 0) {
        // In a real app, would determine the correct assignee based on the workflow step
        // For now, assign to user ID 2 (manager)
        formData.append('assignedTo', '2');
      }
    }
    
    // Add selected file if any
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    
    // Convert tags to array
    const tags = data.tags?.split(',').map(tag => tag.trim()) || [];
    formData.append('tags', JSON.stringify(tags));
    
    createMutation.mutate(formData);
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
            <Label htmlFor="documentNumber">เลขที่เอกสาร <span className="text-red-500">*</span></Label>
            <Input
              id="documentNumber"
              {...register("documentNumber")}
              placeholder="เลขที่เอกสาร"
              className={errors.documentNumber ? "border-red-500" : ""}
            />
            {errors.documentNumber && (
              <p className="text-xs text-red-500">{errors.documentNumber.message}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <Label htmlFor="content">เนื้อหา</Label>
          <Textarea
            id="content"
            {...register("content")}
            placeholder="เนื้อหาเอกสาร"
            rows={4}
          />
        </div>
        
        <div className="space-y-2 mb-4">
          <Label htmlFor="file">ไฟล์เอกสาร (ถ้ามี)</Label>
          <Input
            id="file"
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.docx,.xlsx,.jpg,.png"
          />
          <p className="text-xs text-muted-foreground">
            รองรับไฟล์ .pdf, .docx, .xlsx, .jpg, .png
          </p>
        </div>
        
        <div className="space-y-2 mb-4">
          <Label htmlFor="workflowId">ลำดับขั้นตอนการอนุมัติ</Label>
          <Select onValueChange={(value) => {
            const input = document.querySelector(`input[name="workflowId"]`) as HTMLInputElement;
            if (input) input.value = value;
          }}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกลำดับขั้นตอนการอนุมัติ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">ไม่มีลำดับขั้นตอน</SelectItem>
              {isWorkflowsLoading ? (
                <div className="flex items-center justify-center p-2">
                  <Spinner className="h-4 w-4 mr-2" /> กำลังโหลด...
                </div>
              ) : (
                workflows.map(workflow => (
                  <SelectItem key={workflow.id} value={workflow.id.toString()}>
                    {workflow.name} {workflow.isDefault ? '(ค่าเริ่มต้น)' : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <input type="hidden" {...register("workflowId")} />
          <p className="text-xs text-muted-foreground">
            เลือกลำดับขั้นตอนการอนุมัติที่ต้องการใช้กับเอกสารนี้
          </p>
        </div>
        
        <div className="space-y-2 mb-6">
          <Label htmlFor="tags">แท็ก (คั่นด้วยเครื่องหมายจุลภาค)</Label>
          <Input
            id="tags"
            {...register("tags")}
            placeholder="เช่น: ประกาศ, ด่วน, ภายใน"
          />
          <p className="text-xs text-muted-foreground">
            แท็กช่วยในการค้นหาเอกสาร
          </p>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button 
            type="submit"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                กำลังสร้าง...
              </>
            ) : (
              'สร้างเอกสารเวียน'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
