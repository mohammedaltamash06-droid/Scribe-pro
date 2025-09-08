import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface Diagnosis {
  code: string;
  term: string;
  priority: 'high' | 'medium' | 'low';
}

interface DxFormProps {
  onSubmit: (diagnosis: Diagnosis) => void;
  onCancel?: () => void;
  initialData?: Diagnosis;
  title?: string;
  loading?: boolean;
}

export function DxForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  title = "Add New Diagnosis",
  loading = false
}: DxFormProps) {
  const [code, setCode] = useState(initialData?.code || "");
  const [term, setTerm] = useState(initialData?.term || "");
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(initialData?.priority || 'medium');
  const [errors, setErrors] = useState<{ code?: string; term?: string }>({});

  const validate = () => {
    const newErrors: { code?: string; term?: string } = {};
    
    if (!code.trim()) {
      newErrors.code = "ICD-10 code is required";
    } else if (!/^[A-Z]\d{2}(\.\d{1,2})?$/.test(code.trim().toUpperCase())) {
      newErrors.code = "Please enter a valid ICD-10 code (e.g., R06.02)";
    }
    
    if (!term.trim()) {
      newErrors.term = "Diagnosis term is required";
    } else if (term.trim().length < 3) {
      newErrors.term = "Diagnosis term must be at least 3 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit({
        code: code.trim().toUpperCase(),
        term: term.trim(),
        priority
      });
      
      // Reset form if not editing
      if (!initialData) {
        setCode("");
        setTerm("");
        setPriority('medium');
        setErrors({});
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
    <Card className="rounded-xl border bg-card shadow-soft">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icd-code" className="font-medium text-foreground after:content-['*'] after:text-destructive after:ml-1">
                ICD-10 Code
              </Label>
              <Input
                id="icd-code"
                placeholder="e.g., R06.02"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('diagnosis-term')?.focus();
                  }
                }}
                className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 font-mono ${
                  errors.code ? "border-destructive focus:ring-destructive/20" : ""
                }`}
                aria-invalid={!!errors.code}
                aria-describedby={errors.code ? "code-error" : undefined}
              />
              {errors.code && (
                <p id="code-error" className="text-sm text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 bg-destructive rounded-full"></span>
                  {errors.code}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="diagnosis-term" className="font-medium text-foreground after:content-['*'] after:text-destructive after:ml-1">
                Diagnosis Term
              </Label>
              <Input
                id="diagnosis-term"
                placeholder="e.g., Shortness of breath"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('priority-select')?.focus();
                  }
                  if (e.key === 'Escape') {
                    handleCancel();
                  }
                }}
                className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                  errors.term ? "border-destructive focus:ring-destructive/20" : ""
                }`}
                aria-invalid={!!errors.term}
                aria-describedby={errors.term ? "term-error" : undefined}
              />
              {errors.term && (
                <p id="term-error" className="text-sm text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 bg-destructive rounded-full"></span>
                  {errors.term}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority-select" className="font-medium text-foreground">Priority</Label>
              <Select value={priority} onValueChange={(value: 'high' | 'medium' | 'low') => setPriority(value)}>
                <SelectTrigger id="priority-select" className="focus:ring-2 focus:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={loading}
                className="transition-all duration-200 hover:bg-muted"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={!code.trim() || !term.trim() || loading}
              className="transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              {loading ? "Adding..." : (initialData ? "Update" : "Add")} Diagnosis
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}