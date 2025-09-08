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

interface Procedure {
  code: string;
  term: string;
  priority: 'high' | 'medium' | 'low';
}

interface ProcTableProps {
  doctorId: string;
}

export function ProcTable({ doctorId }: ProcTableProps) {
  const { toast } = useToast();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);

  // Load procedures
  useEffect(() => {
    const loadProcedures = async () => {
      if (!doctorId.trim()) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/doctor/${doctorId}/proc`);
        if (response.ok) {
          const data = await response.json();
          setProcedures(data.items || []);
        }
      } catch (error) {
        console.error('Failed to load procedures:', error);
        toast({
          title: "Error",
          description: "Failed to load procedures",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadProcedures();
  }, [doctorId, toast]);
  const [newCode, setNewCode] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    index: number;
    procedure: Procedure | null;
  }>({ open: false, index: -1, procedure: null });

  const addProcedure = () => {
    if (newCode.trim() && newTerm.trim()) {
      setProcedures([...procedures, { 
        code: newCode.trim(), 
        term: newTerm.trim(), 
        priority: newPriority 
      }]);
      setNewCode("");
      setNewTerm("");
      setNewPriority('medium');
      toast({
        title: "Procedure Added",
        description: `${newCode} - ${newTerm} added successfully.`,
      });
    }
  };

  const handleDeleteClick = (index: number) => {
    setConfirmDelete({
      open: true,
      index,
      procedure: procedures[index]
    });
  };

  const confirmDeleteProcedure = () => {
    if (confirmDelete.index >= 0) {
      const removed = procedures[confirmDelete.index];
      setProcedures(procedures.filter((_, i) => i !== confirmDelete.index));
      toast({
        title: "Procedure Removed",
        description: `${removed.code} - ${removed.term} removed.`,
      });
    }
    setConfirmDelete({ open: false, index: -1, procedure: null });
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
      const response = await fetch(`/api/doctor/${doctorId}/proc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: procedures })
      });
      
      if (response.ok) {
        toast({
          title: "Procedures Saved",
          description: `${procedures.length} favorite procedures saved for ${doctorId}.`,
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save procedures",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Procedure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Favorite Procedure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpt-code">CPT Code</Label>
              <Input
                id="cpt-code"
                placeholder="e.g., 93000"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="procedure-term">Procedure Description</Label>
              <Input
                id="procedure-term"
                placeholder="e.g., Electrocardiogram, routine ECG with at least 12 leads"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proc-priority">Priority</Label>
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
          <Button onClick={addProcedure} disabled={!newCode.trim() || !newTerm.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Procedure
          </Button>
        </CardContent>
      </Card>

      {/* Procedures Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Favorite Procedures ({procedures.length})</CardTitle>
          <Button onClick={saveAll} disabled={procedures.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Save All
          </Button>
        </CardHeader>
        <CardContent>
          {procedures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No favorite procedures configured yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CPT Code</TableHead>
                  <TableHead>Procedure Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {procedures
                  .sort((a, b) => {
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                  })
                  .map((procedure, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm font-medium">
                      {procedure.code}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={procedure.term}>
                        {procedure.term}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPriorityColor(procedure.priority)}>
                        {procedure.priority === 'high' && <Star className="h-3 w-3 mr-1" />}
                        {procedure.priority}
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
        onConfirm={confirmDeleteProcedure}
        title="Delete Procedure"
        description={`Are you sure you want to delete the procedure "${confirmDelete.procedure?.code} - ${confirmDelete.procedure?.term}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}