import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Stethoscope, Pill, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DetectedTerm {
  text: string;
  type: 'diagnosis' | 'medication' | 'procedure';
  confidence: number;
}

interface DetectedTermsProps {
  doctorId: string;
}

export function DetectedTerms({ doctorId }: DetectedTermsProps) {
  const { toast } = useToast();
  const [selectedTerm, setSelectedTerm] = useState<DetectedTerm | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    // For medications
    codeSystem: 'RxNorm',
    strength: '',
    route: 'PO',
    frequency: ''
  });
  
  const [detectedTerms] = useState<DetectedTerm[]>([
    { text: "chest pain", type: "diagnosis", confidence: 0.95 },
    { text: "electrocardiogram", type: "procedure", confidence: 0.88 },
    { text: "aspirin", type: "medication", confidence: 0.92 },
    { text: "hypertension", type: "diagnosis", confidence: 0.87 },
    { text: "chest X-ray", type: "procedure", confidence: 0.91 },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'diagnosis':
        return <Stethoscope className="h-3 w-3" />;
      case 'medication':
        return <Pill className="h-3 w-3" />;
      case 'procedure':
        return <Activity className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'diagnosis':
        return 'text-medical-info border-medical-info/20 bg-medical-info/5';
      case 'medication':
        return 'text-medical-success border-medical-success/20 bg-medical-success/5';
      case 'procedure':
        return 'text-medical-warning border-medical-warning/20 bg-medical-warning/5';
      default:
        return 'text-muted-foreground border-border bg-background';
    }
  };

  const handleAddToDoctor = (term: DetectedTerm) => {
    if (!doctorId.trim()) {
      toast({
        title: "No Doctor Selected",
        description: "Please enter a doctor ID first to add terms to their favorites.",
        variant: "destructive"
      });
      return;
    }

    setSelectedTerm(term);
    setFormData({
      code: '',
      priority: 'medium',
      codeSystem: 'RxNorm',
      strength: '',
      route: 'PO',
      frequency: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedTerm || !doctorId.trim()) return;

    try {
      let endpoint = '';
      let payload: any = {
        code: formData.code,
        term: selectedTerm.text,
        priority: formData.priority
      };

      switch (selectedTerm.type) {
        case 'diagnosis':
          endpoint = `/api/doctor/${doctorId}/dx`;
          break;
        case 'medication':
          endpoint = `/api/doctor/${doctorId}/rx`;
          payload = {
            ...payload,
            code_system: formData.codeSystem,
            drug_name: selectedTerm.text,
            strength: formData.strength,
            route: formData.route,
            freq_text: formData.frequency
          };
          break;
        case 'procedure':
          endpoint = `/api/doctor/${doctorId}/proc`;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: "Term Added",
          description: `"${selectedTerm.text}" added to Dr. ${doctorId}'s ${selectedTerm.type} favorites.`,
        });
        setIsModalOpen(false);
        setSelectedTerm(null);
      } else {
        throw new Error('Failed to add term');
      }
    } catch (error) {
      console.error('Error adding term:', error);
      toast({
        title: "Error",
        description: "Failed to add term to doctor's favorites.",
        variant: "destructive"
      });
    }
  };

  if (detectedTerms.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">No medical terms detected yet</p>
        <p className="text-xs mt-1">Terms will appear here during transcription</p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-64">
        <div className="space-y-2">
          {detectedTerms.map((term, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-soft ${getTypeColor(term.type)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getIcon(term.type)}
                  <span className="text-xs font-medium capitalize">{term.type}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {Math.round(term.confidence * 100)}%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{term.text}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddToDoctor(term)}
                  disabled={!doctorId.trim()}
                  className="h-6 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Add Term Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add "{selectedTerm?.text}" to Doctor's {selectedTerm?.type} favorites
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Common fields */}
            <div className="space-y-2">
              <Label htmlFor="modal-code">
                {selectedTerm?.type === 'diagnosis' && 'ICD-10 Code'}
                {selectedTerm?.type === 'medication' && 'Drug Code'}
                {selectedTerm?.type === 'procedure' && 'CPT Code'}
              </Label>
              <Input
                id="modal-code"
                placeholder={
                  selectedTerm?.type === 'diagnosis' ? 'e.g., R06.02' :
                  selectedTerm?.type === 'medication' ? 'e.g., 307782' :
                  'e.g., 93000'
                }
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>

            {/* Medication-specific fields */}
            {selectedTerm?.type === 'medication' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="modal-code-system">Code System</Label>
                    <Select value={formData.codeSystem} onValueChange={(value) => setFormData(prev => ({ ...prev, codeSystem: value }))}>
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
                    <Label htmlFor="modal-strength">Strength</Label>
                    <Input
                      id="modal-strength"
                      placeholder="e.g., 81mg"
                      value={formData.strength}
                      onChange={(e) => setFormData(prev => ({ ...prev, strength: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="modal-route">Route</Label>
                    <Select value={formData.route} onValueChange={(value) => setFormData(prev => ({ ...prev, route: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PO">PO</SelectItem>
                        <SelectItem value="IV">IV</SelectItem>
                        <SelectItem value="IM">IM</SelectItem>
                        <SelectItem value="SubQ">SubQ</SelectItem>
                        <SelectItem value="Topical">Topical</SelectItem>
                        <SelectItem value="Inhaled">Inhaled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-frequency">Frequency</Label>
                    <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once daily">once daily</SelectItem>
                        <SelectItem value="twice daily">twice daily</SelectItem>
                        <SelectItem value="three times daily">three times daily</SelectItem>
                        <SelectItem value="as needed">as needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="modal-priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: 'high' | 'medium' | 'low') => setFormData(prev => ({ ...prev, priority: value }))}>
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

            <div className="flex space-x-2 pt-4">
              <Button onClick={() => setIsModalOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.code.trim() || (selectedTerm?.type === 'medication' && (!formData.strength.trim() || !formData.frequency))}
                className="flex-1"
              >
                Add to Favorites
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}