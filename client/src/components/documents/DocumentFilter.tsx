import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  type: string;
  description?: string;
}

interface DocumentFilterProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  isLoading: boolean;
}

export default function DocumentFilter({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  isLoading
}: DocumentFilterProps) {
  const [open, setOpen] = useState(false);

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
    {} as Record<string, Category[]>
  );

  // Map type names for display
  const typeNameMap: Record<string, string> = {
    'internal_form': 'แบบฟอร์มภายใน',
    'external_form': 'แบบฟอร์มภายนอก',
    'template': 'เทมเพลต'
  };

  return (
    <Card className="mb-6 p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-grow">
          <h3 className="text-sm font-medium mb-1">ตัวกรองขั้นสูง</h3>
          <p className="text-xs text-muted-foreground">
            เลือกหมวดหมู่เอกสารที่ต้องการแสดง
          </p>
        </div>

        <div className="w-full md:w-64">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Spinner className="h-4 w-4 mr-2" />
                    <span>กำลังโหลด...</span>
                  </div>
                ) : selectedCategory ? (
                  categories.find(category => category.id === selectedCategory)?.name || "เลือกหมวดหมู่"
                ) : (
                  "เลือกหมวดหมู่"
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="ค้นหาหมวดหมู่..." />
                <CommandEmpty>ไม่พบหมวดหมู่</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        onSelectCategory(null);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCategory === null ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>ทั้งหมด</span>
                    </CommandItem>
                  </CommandGroup>
                  
                  {Object.entries(groupedCategories).map(([type, categoriesInType]) => (
                    <CommandGroup key={type} heading={typeNameMap[type] || type}>
                      {categoriesInType.map(category => (
                        <CommandItem
                          key={category.id}
                          onSelect={() => {
                            onSelectCategory(category.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCategory === category.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span>{category.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedCategory && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onSelectCategory(null)}
          >
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {selectedCategory && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-primary/10">
            {categories.find(category => category.id === selectedCategory)?.name}
          </Badge>
        </div>
      )}
    </Card>
  );
}
