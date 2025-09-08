import { useState } from "react";
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

interface Diagnosis {
  code: string;
  term: string;
  priority: 'high' | 'medium' | 'low';
}

interface DxTableProps {
  doctorId: string;
}

export function DxTable({ doctorId }: DxTableProps) {
  const { toast } = useToast();
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    index: number;
    diagnosis: Diagnosis | null;
  }>({ open: false, index: -1, diagnosis: null });

  const addDiagnosis = async () => {
    if (!newCode.trim() || !newTerm.trim()) return;
    
    setLoading(true);
    try {
      const newDiagnosis = { 
        code: newCode.trim().toUpperCase(), 
        term: newTerm.trim(), 
        priority: newPriority 
      };
      
      const response = await fetch(`/api/doctor/${doctorId}/dx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [...diagnoses, newDiagnosis] })
      });
      
      if (!response.ok) throw new Error('Failed to add diagnosis');
      
      setDiagnoses([...diagnoses, newDiagnosis]);
      setNewCode("");
      setNewTerm("");
      setNewPriority('medium');
      toast({
        title: "Diagnosis Added",
        description: `${newCode} - ${newTerm} added successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add diagnosis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (index: number) => {
    setConfirmDelete({
      open: true,
      index,
      diagnosis: diagnoses[index]
    });
  };

  const confirmDeleteDiagnosis = () => {
    if (confirmDelete.index >= 0) {
      const removed = diagnoses[confirmDelete.index];
      setDiagnoses(diagnoses.filter((_, i) => i !== confirmDelete.index));
      toast({
        title: "Diagnosis Removed",
        description: `${removed.code} - ${removed.term} removed.`,
      });
    }
    setConfirmDelete({ open: false, index: -1, diagnosis: null });
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
    setLoading(true);
    try {
      const response = await fetch(`/api/doctor/${doctorId}/dx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: diagnoses })
      });
      
      if (!response.ok) throw new Error('Failed to save diagnoses');
      
      toast({
        title: "Diagnoses Saved",
        description: `${diagnoses.length} favorite diagnoses saved for ${doctorId}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save diagnoses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Diagnosis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Favorite Diagnosis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icd-code">ICD-10 Code</Label>
              <Input
                id="icd-code"
                placeholder="e.g., R06.02"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosis-term">Diagnosis Term</Label>
              <Input
                id="diagnosis-term"
                placeholder="e.g., Shortness of breath"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
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
          <Button onClick={addDiagnosis} disabled={!newCode.trim() || !newTerm.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Diagnosis
          </Button>
        </CardContent>
      </Card>

      {/* Diagnoses Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Favorite Diagnoses ({diagnoses.length})</CardTitle>
          <Button onClick={saveAll} disabled={diagnoses.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Save All
          </Button>
        </CardHeader>
        <CardContent>
          {diagnoses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No favorite diagnoses configured yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ICD-10 Code</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnoses
                  .sort((a, b) => {
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                  })
                  .map((diagnosis, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm font-medium">
                      {diagnosis.code}
                    </TableCell>
                    <TableCell>{diagnosis.term}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPriorityColor(diagnosis.priority)}>
                        {diagnosis.priority === 'high' && <Star className="h-3 w-3 mr-1" />}
                        {diagnosis.priority}
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
          )}
        </CardContent>
      </Card>
      
      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete(prev => ({ ...prev, open }))}
        onConfirm={confirmDeleteDiagnosis}
        title="Delete Diagnosis"
        description={`Are you sure you want to delete the diagnosis "${confirmDelete.diagnosis?.code} - ${confirmDelete.diagnosis?.term}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}