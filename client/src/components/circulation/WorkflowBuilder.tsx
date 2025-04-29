import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, GripVertical, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WorkflowBuilderProps {
  existingWorkflow?: any;
  onSave: (workflow: any) => void;
  onCancel: () => void;
  isSaving: boolean;
}

// Form validation schema
const workflowSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อขั้นตอนการทำงาน"),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  isLocked: z.boolean().optional(),
});

type WorkflowFormValues = z.infer<typeof workflowSchema>;

export default function WorkflowBuilder({
  existingWorkflow,
  onSave,
  onCancel,
  isSaving
}: WorkflowBuilderProps) {
  const { toast } = useToast();
  const [steps, setSteps] = useState<{order: number; role: string; description: string}[]>(
    existingWorkflow?.steps || [{ order: 1, role: "manager", description: "หัวหน้าแผนก" }]
  );
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: existingWorkflow?.name || "",
      description: existingWorkflow?.description || "",
      isDefault: existingWorkflow?.isDefault || false,
      isLocked: existingWorkflow?.isLocked || false,
    }
  });
  
  const isLocked = watch("isLocked");
  
  const addStep = () => {
    setSteps([...steps, { 
      order: steps.length + 1, 
      role: "staff", 
      description: "" 
    }]);
  };
  
  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    // Reorder remaining steps
    const reorderedSteps = newSteps.map((step, i) => ({
      ...step,
      order: i + 1
    }));
    setSteps(reorderedSteps);
  };
  
  const updateStepRole = (index: number, role: string) => {
    const newSteps = [...steps];
    newSteps[index].role = role;
    setSteps(newSteps);
  };
  
  const updateStepDescription = (index: number, description: string) => {
    const newSteps = [...steps];
    newSteps[index].description = description;
    setSteps(newSteps);
  };
  
  const onSubmit = (data: WorkflowFormValues) => {
    if (steps.length === 0) {
      toast({
        title: "กรุณาเพิ่มขั้นตอน",
        description: "ขั้นตอนการทำงานต้องมีอย่างน้อย 1 ขั้นตอน",
        variant: "destructive",
      });
      return;
    }
    
    // Check if all steps have descriptions
    const missingDescription = steps.some(step => !step.description);
    if (missingDescription) {
      toast({
        title: "กรุณาระบุคำอธิบายขั้นตอน",
        description: "ทุกขั้นตอนต้องมีคำอธิบาย",
        variant: "destructive",
      });
      return;
    }
    
    const workflowData = {
      ...data,
      steps,
      id: existingWorkflow?.id
    };
    
    onSave(workflowData);
  };
  
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'ผู้ดูแลระบบ';
      case 'manager':
        return 'ผู้จัดการ/หัวหน้า';
      case 'staff':
        return 'เจ้าหน้าที่';
      default:
        return role;
    }
  };
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อขั้นตอนการทำงาน <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="ชื่อขั้นตอนการทำงาน"
              className={errors.name ? "border-red-500" : ""}
              disabled={isSaving}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          
          <div className="flex space-x-4 items-center">
            <div className="flex items-center space-x-2">
              <Switch 
                id="isDefault" 
                {...register("isDefault")} 
                disabled={isSaving}
              />
              <Label htmlFor="isDefault">ตั้งเป็นค่าเริ่มต้น</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="isLocked" 
                {...register("isLocked")} 
                disabled={isSaving}
              />
              <Label htmlFor="isLocked">ล็อกการแก้ไข</Label>
            </div>
          </div>
        </div>
        
        <div className="space-y-2 mb-6">
          <Label htmlFor="description">คำอธิบาย</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="คำอธิบายขั้นตอนการทำงาน"
            rows={2}
            disabled={isSaving}
          />
        </div>
        
        <h3 className="text-md font-semibold mb-3">ขั้นตอนการทำงาน</h3>
        
        <div className="space-y-3 mb-4">
          {steps.map((step, index) => (
            <Card key={index} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                    {index + 1}
                  </div>
                  {index > 0 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="flex-grow md:flex md:items-center md:gap-4">
                    <div className="md:w-1/3 mb-2 md:mb-0">
                      <Label htmlFor={`step-${index}-role`}>บทบาท</Label>
                      <Select 
                        defaultValue={step.role} 
                        onValueChange={(value) => updateStepRole(index, value)}
                        disabled={isLocked || isSaving}
                      >
                        <SelectTrigger id={`step-${index}-role`}>
                          <SelectValue placeholder="เลือกบทบาท" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                          <SelectItem value="manager">ผู้จัดการ/หัวหน้า</SelectItem>
                          <SelectItem value="staff">เจ้าหน้าที่</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:w-2/3">
                      <Label htmlFor={`step-${index}-description`}>คำอธิบาย</Label>
                      <Input
                        id={`step-${index}-description`}
                        placeholder="คำอธิบายขั้นตอน"
                        value={step.description}
                        onChange={(e) => updateStepDescription(index, e.target.value)}
                        disabled={isLocked || isSaving}
                        className={!step.description ? "border-red-500" : ""}
                      />
                    </div>
                  </div>
                  
                  {!isLocked && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(index)}
                      disabled={steps.length <= 1 || isSaving}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {!isLocked && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addStep}
              disabled={isSaving}
            >
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มขั้นตอน
            </Button>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            ยกเลิก
          </Button>
          <Button 
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                กำลังบันทึก...
              </>
            ) : (
              'บันทึก'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
