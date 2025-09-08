import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Save, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/tables/ConfirmDialog";

interface Medication {
  code_system: string;
  code: string;
  drug_name: string;
  strength: string;
  route: string;
  freq_text: string;
  priority: 'high' | 'medium' | 'low';
}

interface RxTableProps {
  doctorId: string;
}

export function RxTable({ doctorId }: RxTableProps) {
  const { toast } = useToast();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newCodeSystem, setNewCodeSystem] = useState("RxNorm");
  const [newCode, setNewCode] = useState("");
  const [newDrugName, setNewDrugName] = useState("");
  const [newStrength, setNewStrength] = useState("");
  const [newRoute, setNewRoute] = useState("PO");
  const [newFreq, setNewFreq] = useState("");
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    index: number;
    medication: Medication | null;
  }>({ open: false, index: -1, medication: null });

  // Load medications
  useEffect(() => {
    const loadMedications = async () => {
      if (!doctorId.trim()) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/doctor/${doctorId}/rx`);
        if (response.ok) {
          const data = await response.json();
          setMedications(data.items || []);
        }
      } catch (error) {
        console.error('Failed to load medications:', error);
        toast({
          title: "Error",
          description: "Failed to load medications",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadMedications();
  }, [doctorId, toast]);

  const routes = ["PO", "IV", "IM", "SubQ", "Topical", "Inhaled", "PR", "SL"];
  const frequencies = [
    "once daily", "twice daily", "three times daily", "four times daily",
    "every 4 hours", "every 6 hours", "every 8 hours", "every 12 hours",
    "as needed", "at bedtime", "with meals"
  ];

  const addMedication = () => {
    if (newCode.trim() && newDrugName.trim() && newStrength.trim() && newFreq.trim()) {
      setMedications([...medications, { 
        code_system: newCodeSystem,
        code: newCode.trim(), 
        drug_name: newDrugName.trim(),
        strength: newStrength.trim(),
        route: newRoute,
        freq_text: newFreq.trim(),
        priority: newPriority 
      }]);
      setNewCode("");
      setNewDrugName("");
      setNewStrength("");
      setNewFreq("");
      setNewPriority('medium');
      toast({
        title: "Medication Added",
        description: `${newDrugName} ${newStrength} added successfully.`,
      });
    }
  };

  const handleDeleteClick = (index: number) => {
    setConfirmDelete({
      open: true,
      index,
      medication: medications[index]
    });
  };

  const confirmDeleteMedication = () => {
    if (confirmDelete.index >= 0) {
      const removed = medications[confirmDelete.index];
      setMedications(medications.filter((_, i) => i !== confirmDelete.index));
      toast({
        title: "Medication Removed",
        description: `${removed.drug_name} ${removed.strength} removed.`,
      });
    }
    setConfirmDelete({ open: false, index: -1, medication: null });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-destructive border-destructive/20 bg-destructive/5';
      case 'medium':
        return 'text-medical-warning border-medical-warning/20 bg-medical-warning/5';
      case 'low':
        return 'text-medical-info border-medical-info/20 bg-medical-info/5';
      default:
        return 'text-muted-foreground border-border bg-background';
    }
  };

  const saveAll = async () => {
    try {
      const response = await fetch(`/api/doctor/${doctorId}/rx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: medications })
      });
      
      if (response.ok) {
        toast({
          title: "Medications Saved",
          description: `${medications.length} favorite medications saved for ${doctorId}.`,
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save medications",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Medication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Favorite Medication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code-system">Code System</Label>
              <Select value={newCodeSystem} onValueChange={setNewCodeSystem}>
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
              <Label htmlFor="drug-code">Drug Code</Label>
              <Input
                id="drug-code"
                placeholder="e.g., 307782"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drug-name">Drug Name</Label>
              <Input
                id="drug-name"
                placeholder="e.g., Aspirin"
                value={newDrugName}
                onChange={(e) => setNewDrugName(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="strength">Strength</Label>
              <Input
                id="strength"
                placeholder="e.g., 81mg"
                value={newStrength}
                onChange={(e) => setNewStrength(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="route">Route</Label>
              <Select value={newRoute} onValueChange={setNewRoute}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {routes.map(route => (
                    <SelectItem key={route} value={route}>{route}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={newFreq} onValueChange={setNewFreq}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map(freq => (
                    <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-priority">Priority</Label>
              <Select value={newPriority} onValueChange={(value: 'high' | 'medium' | 'low') => setNewPriority(value)}>
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
          
          <Button onClick={addMedication} disabled={!newCode.trim() || !newDrugName.trim() || !newStrength.trim() || !newFreq.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
        </CardContent>
      </Card>

      {/* Medications Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Favorite Medications ({medications.length})</CardTitle>
          <Button onClick={saveAll} disabled={medications.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Save All
          </Button>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No favorite medications configured yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug Name</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications
                    .sort((a, b) => {
                      const priorityOrder = { high: 0, medium: 1, low: 2 };
                      return priorityOrder[a.priority] - priorityOrder[b.priority];
                    })
                    .map((medication, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{medication.drug_name}</TableCell>
                      <TableCell>{medication.strength}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {medication.route}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{medication.freq_text}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {medication.code_system}: {medication.code}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPriorityColor(medication.priority)}>
                          {medication.priority === 'high' && <Star className="h-3 w-3 mr-1" />}
                          {medication.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete(prev => ({ ...prev, open }))}
        onConfirm={confirmDeleteMedication}
        title="Delete Medication"
        description={`Are you sure you want to delete the medication "${confirmDelete.medication?.drug_name} ${confirmDelete.medication?.strength}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}