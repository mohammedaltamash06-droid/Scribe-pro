import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/tables/ConfirmDialog";

interface Correction {
  before: string;
  after: string;
}

interface CorrectionsTableProps {
  doctorId: string;
}

export function CorrectionsTable({ doctorId }: CorrectionsTableProps) {
  const { toast } = useToast();
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(false);

  // Load corrections from API
  useEffect(() => {
    const loadCorrections = async () => {
      if (!doctorId) return;
      
      try {
        const response = await fetch(`/api/doctor/${doctorId}/corrections`);
        if (response.ok) {
          const data = await response.json();
          setCorrections(data.items || []);
        }
      } catch (error) {
        console.error('Error loading corrections:', error);
      }
    };

    loadCorrections();
  }, [doctorId]);
  const [newBefore, setNewBefore] = useState("");
  const [newAfter, setNewAfter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    index: number;
    correction: Correction | null;
  }>({ open: false, index: -1, correction: null });

  const addCorrection = async () => {
    if (!newBefore.trim() || !newAfter.trim()) return;
    
    setLoading(true);
    try {
      const newCorrection = { before: newBefore.trim(), after: newAfter.trim() };
      const response = await fetch(`/api/doctor/${doctorId}/corrections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [...corrections, newCorrection] })
      });
      
      if (!response.ok) throw new Error('Failed to add correction');
      
      setCorrections([...corrections, newCorrection]);
      setNewBefore("");
      setNewAfter("");
      toast({
        title: "Correction Added",
        description: `"${newBefore}" → "${newAfter}" added successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add correction. Please try again.",
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
      correction: corrections[index]
    });
  };

  const confirmDeleteCorrection = () => {
    if (confirmDelete.index >= 0) {
      const removed = corrections[confirmDelete.index];
      setCorrections(corrections.filter((_, i) => i !== confirmDelete.index));
      toast({
        title: "Correction Removed",
        description: `"${removed.before}" → "${removed.after}" removed.`,
      });
    }
    setConfirmDelete({ open: false, index: -1, correction: null });
  };

  const saveAll = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/doctor/${doctorId}/corrections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: corrections })
      });
      
      if (!response.ok) throw new Error('Failed to save corrections');
      
      toast({
        title: "Corrections Saved",
        description: `${corrections.length} corrections saved for ${doctorId}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save corrections. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Correction */}
      <Card className="rounded-xl border bg-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-base font-medium">Add New Correction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="before" className="font-medium">
                Original Text
              </Label>
              <Input
                id="before"
                placeholder="e.g., chest pain"
                value={newBefore}
                onChange={(e) => setNewBefore(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('after')?.focus();
                  }
                }}
                className="focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="after" className="font-medium">
                Corrected Text
              </Label>
              <Input
                id="after"
                placeholder="e.g., chest discomfort"
                value={newAfter}
                onChange={(e) => setNewAfter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && newBefore.trim() && newAfter.trim()) {
                    e.preventDefault();
                    addCorrection();
                  }
                }}
                className="focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <Button 
            onClick={addCorrection} 
            disabled={!newBefore.trim() || !newAfter.trim() || loading}
            className="transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            {loading ? "Adding..." : "Add Correction"}
          </Button>
        </CardContent>
      </Card>

      {/* Corrections Table */}
      <Card className="rounded-xl border bg-card shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Current Corrections ({corrections.length})</CardTitle>
          <Button 
            onClick={saveAll} 
            disabled={corrections.length === 0 || loading}
            className="transition-all duration-200"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save All"}
          </Button>
        </CardHeader>
        <CardContent>
          {corrections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
                <Plus className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">No corrections configured yet</p>
              <p className="text-sm mt-1">Add your first text correction above to get started</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-background overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="font-medium">Original Text</TableHead>
                    <TableHead className="font-medium">Corrected Text</TableHead>
                    <TableHead className="text-right font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {corrections.map((correction, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-sm bg-destructive/5 rounded-md px-2 py-1">
                        {correction.before}
                      </TableCell>
                      <TableCell className="font-mono text-sm bg-medical-success/5 rounded-md px-2 py-1">
                        {correction.after}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label={`Delete correction: ${correction.before} to ${correction.after}`}
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
        onConfirm={confirmDeleteCorrection}
        title="Delete Correction"
        description={`Are you sure you want to delete the correction "${confirmDelete.correction?.before}" → "${confirmDelete.correction?.after}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}