"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Loader2, Upload, FilePlus2 } from "lucide-react";

type JobState = "created" | "uploaded" | "running" | "done" | "error" | "failed";

export function JobStatusBadge({ state }: { state: JobState }) {
  const s = (state || "created") as JobState;

  if (s === "done") {
    return (
      <Badge variant="outline" className="gap-1 border-medical-success/30 text-medical-success bg-medical-success/5">
        <CheckCircle className="h-3.5 w-3.5" /> done
      </Badge>
    );
  }

  if (s === "error" || s === "failed") {
    return (
      <Badge variant="outline" className="gap-1 border-destructive/30 text-destructive bg-destructive/5">
        <AlertTriangle className="h-3.5 w-3.5" /> {s}
      </Badge>
    );
  }

  if (s === "running") {
    return (
      <Badge variant="outline" className="gap-1 border-primary/30 text-primary bg-primary/5">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> running
      </Badge>
    );
  }

  if (s === "uploaded") {
    return (
      <Badge variant="outline" className="gap-1 border-muted-foreground/30 text-muted-foreground bg-muted/30">
        <Upload className="h-3.5 w-3.5" /> uploaded
      </Badge>
    );
  }

  // default: created
  return (
    <Badge variant="outline" className="gap-1 border-muted-foreground/30 text-muted-foreground bg-muted/30">
      <FilePlus2 className="h-3.5 w-3.5" /> created
    </Badge>
  );
}
