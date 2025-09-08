import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight } from "lucide-react";

interface Correction {
  before: string;
  after: string;
}

interface CorrectionsListProps {
  doctorId: string;
}

export function CorrectionsList({ doctorId }: CorrectionsListProps) {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCorrections = async () => {
      if (!doctorId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/doctor/${doctorId}/corrections`);
        if (!response.ok) {
          throw new Error('Failed to fetch corrections');
        }
        const data = await response.json();
        setCorrections(data.items || []);
      } catch (error) {
        console.error('Error fetching corrections:', error);
        setCorrections([]);
        // Could show error toast here if useToast is available
      } finally {
        setLoading(false);
      }
    };

    fetchCorrections();
  }, [doctorId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-10 bg-muted rounded-md"></div>
          </div>
        ))}
      </div>
    );
  }

  if (corrections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted/50 flex items-center justify-center">
          <ArrowRight className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium">No corrections configured</p>
        <p className="text-xs mt-1">This doctor hasn't set up any text corrections yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-2">
        {corrections.map((correction, index) => (
          <div
            key={index}
            className="p-3 bg-secondary/50 rounded-lg space-y-2"
          >
            <div className="flex items-center space-x-2 text-xs">
              <Badge variant="outline" className="text-destructive border-destructive/20">
                {correction.before}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="outline" className="text-medical-success border-medical-success/20">
                {correction.after}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}