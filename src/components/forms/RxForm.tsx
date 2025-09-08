import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface Medication {
  code_system: string;
  code: string;
  drug_name: string;
  strength: string;
  route: string;
  freq_text: string;
  priority: 'high' | 'medium' | 'low';
}

interface RxFormProps {
  onSubmit: (medication: Medication) => void;
  onCancel?: () => void;
  initialData?: Medication;
  title?: string;
}

const routes = ["PO", "IV", "IM", "SubQ", "Topical", "Inhaled", "PR", "SL"];
const frequencies = [
  "once daily", "twice daily", "three times daily", "four times daily",
  "every 4 hours", "every 6 hours", "every 8 hours", "every 12 hours",
  "as needed", "at bedtime", "with meals"
];

export function RxForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  title = "Add New Medication" 
}: RxFormProps) {
  const [codeSystem, setCodeSystem] = useState(initialData?.code_system || "RxNorm");
  const [code, setCode] = useState(initialData?.code || "");
  const [drugName, setDrugName] = useState(initialData?.drug_name || "");
  const [strength, setStrength] = useState(initialData?.strength || "");
  const [route, setRoute] = useState(initialData?.route || "PO");
  const [freqText, setFreqText] = useState(initialData?.freq_text || "");
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(initialData?.priority || 'medium');
  const [errors, setErrors] = useState<{ 
    code?: string; 
    drug_name?: string; 
    strength?: string; 
    freq_text?: string;
  }>({});

  const validate = () => {
    const newErrors: { 
      code?: string; 
      drug_name?: string; 
      strength?: string; 
      freq_text?: string;
    } = {};
    
    if (!code.trim()) {
      newErrors.code = "Drug code is required";
    }
    
    if (!drugName.trim()) {
      newErrors.drug_name = "Drug name is required";
    } else if (drugName.trim().length < 2) {
      newErrors.drug_name = "Drug name must be at least 2 characters";
    }
    
    if (!strength.trim()) {
      newErrors.strength = "Strength is required";
    }
    
    if (!freqText.trim()) {
      newErrors.freq_text = "Frequency is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit({
        code_system: codeSystem,
        code: code.trim(),
        drug_name: drugName.trim(),
        strength: strength.trim(),
        route,
        freq_text: freqText.trim(),
        priority
      });
      
      // Reset form if not editing
      if (!initialData) {
        setCode("");
        setDrugName("");
        setStrength("");
        setFreqText("");
        setPriority('medium');
      }
    }
  };

  const handleCancel = () => {
    setCodeSystem(initialData?.code_system || "RxNorm");
    setCode(initialData?.code || "");
    setDrugName(initialData?.drug_name || "");
    setStrength(initialData?.strength || "");
    setRoute(initialData?.route || "PO");
    setFreqText(initialData?.freq_text || "");
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code-system">Code System</Label>
              <Select value={codeSystem} onValueChange={setCodeSystem}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RxNorm">RxNorm</SelectItem>
                  <SelectItem value="NDC">NDC</SelectItem>
                  <SelectItem value="SNOMED">SNOMED CT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="drug-code" className="required">
                Drug Code
              </Label>
              <Input
                id="drug-code"
                placeholder="e.g., 307782"
                value={code}
                onChange={(e) => setCode(e.target.value)}
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
            
            <div className="space-y-2">
              <Label htmlFor="drug-name" className="required">
                Drug Name
              </Label>
              <Input
                id="drug-name"
                placeholder="e.g., Aspirin"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                className={errors.drug_name ? "border-destructive" : ""}
                aria-invalid={!!errors.drug_name}
                aria-describedby={errors.drug_name ? "drug-name-error" : undefined}
              />
              {errors.drug_name && (
                <p id="drug-name-error" className="text-sm text-destructive">
                  {errors.drug_name}
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="strength" className="required">
                Strength
              </Label>
              <Input
                id="strength"
                placeholder="e.g., 81mg"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                className={errors.strength ? "border-destructive" : ""}
                aria-invalid={!!errors.strength}
                aria-describedby={errors.strength ? "strength-error" : undefined}
              />
              {errors.strength && (
                <p id="strength-error" className="text-sm text-destructive">
                  {errors.strength}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="route">Route</Label>
              <Select value={route} onValueChange={setRoute}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {routes.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="frequency" className="required">
                Frequency
              </Label>
              <Select value={freqText} onValueChange={setFreqText}>
                <SelectTrigger className={errors.freq_text ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map(freq => (
                    <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.freq_text && (
                <p className="text-sm text-destructive">
                  {errors.freq_text}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="med-priority">Priority</Label>
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
            <Button type="submit" disabled={!code.trim() || !drugName.trim() || !strength.trim() || !freqText.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              {initialData ? "Update" : "Add"} Medication
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}