import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface Procedure {
  code: string;
  term: string;
  priority: 'high' | 'medium' | 'low';
}

interface ProcFormProps {
  onSubmit: (procedure: Procedure) => void;
  onCancel?: () => void;
  initialData?: Procedure;
  title?: string;
}

export function ProcForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  title = "Add New Procedure" 
}: ProcFormProps) {
  const [code, setCode] = useState(initialData?.code || "");
  const [term, setTerm] = useState(initialData?.term || "");
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(initialData?.priority || 'medium');
  const [errors, setErrors] = useState<{ code?: string; term?: string }>({});

  const validate = () => {
    const newErrors: { code?: string; term?: string } = {};
    
    if (!code.trim()) {
      newErrors.code = "CPT code is required";
    } else if (!/^\d{5}$/.test(code.trim())) {
      newErrors.code = "Please enter a valid 5-digit CPT code";
    }
    
    if (!term.trim()) {
      newErrors.term = "Procedure description is required";
    } else if (term.trim().length < 5) {
      newErrors.term = "Procedure description must be at least 5 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit({
        code: code.trim(),
        term: term.trim(),
        priority
      });
      
      // Reset form if not editing
      if (!initialData) {
        setCode("");
        setTerm("");
        setPriority('medium');
      }
    }
  };

  const handleCancel = () => {
    setCode(initialData?.code || "");
    setTerm(initialData?.term || "");
    setPriority(initialData?.priority || 'medium');
    setErrors({});
    onCancel?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpt-code" className="required">
                CPT Code
              </Label>
              <Input
                id="cpt-code"
                placeholder="e.g., 93000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className={errors.code ? "border-destructive" : ""}
                aria-invalid={!!errors.code}
                aria-describedby={errors.code ? "code-error" : undefined}
              />
              {errors.code && (
                <p id="code-error" className="text-sm text-destructive">
                  {errors.code}
                </p>
              )}
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="procedure-term" className="required">
                Procedure Description
              </Label>
              <Input
                id="procedure-term"
                placeholder="e.g., Electrocardiogram, routine ECG with at least 12 leads"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className={errors.term ? "border-destructive" : ""}
                aria-invalid={!!errors.term}
                aria-describedby={errors.term ? "term-error" : undefined}
              />
              {errors.term && (
                <p id="term-error" className="text-sm text-destructive">
                  {errors.term}
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proc-priority">Priority</Label>
              <Select value={priority} onValueChange={(value: 'high' | 'medium' | 'low') => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={!code.trim() || !term.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              {initialData ? "Update" : "Add"} Procedure
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}