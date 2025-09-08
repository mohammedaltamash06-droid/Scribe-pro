import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";

interface Job {
  id: string;
  fileName: string;
  doctor: string;
  duration: string;
  status: "completed" | "processing" | "failed";
  createdAt: string;
  corrections: number;
}

// NOTE: All styling/classes preserved. Only data fetching/normalization updated.
export function JobsTable() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const downloadResult = async (jobId: string) => {
    const res = await fetch(`/api/jobs/${jobId}/result`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${jobId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmtDuration = (seconds?: number | null): string => {
    if (seconds == null || isNaN(seconds as any)) return "-";
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  useEffect(() => {
    let alive = true;

    const fetchRecentJobs = async () => {
      try {
        const response = await fetch("/api/jobs/recent", { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();

        // Support both shapes: array OR { items: [...] }
        const rows: any[] = Array.isArray(payload)
          ? payload
          : payload.items ?? [];

        const normalized: Job[] = rows
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 5)
          .map((r) => ({
            id: r.id,
            fileName:
              r.file_name ??
              (r.file_path ? String(r.file_path).split("/").pop() : r.id),
            doctor:
              r.doctor_name ??
              r.doctor ??
              (r.doctor_id ? `Doctor #${r.doctor_id}` : "-"),
            duration: fmtDuration(r.duration_seconds),
            status:
              r.state === "done"
                ? "completed"
                : r.state === "error" || r.state === "failed"
                ? "failed"
                : "processing",
            createdAt: r.created_at
              ? new Date(r.created_at).toLocaleString()
              : "-",
            corrections: typeof r.corrections === "number" ? r.corrections : 0,
          }));

        if (alive) setJobs(normalized);
      } catch {
        if (alive) setJobs([]); // no mock in production
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchRecentJobs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-medical-success border-medical-success/20 bg-medical-success/5";
      case "processing":
        return "text-medical-warning border-medical-warning/20 bg-medical-warning/5";
      case "failed":
        return "text-destructive border-destructive/20 bg-destructive/5";
      default:
        return "text-muted-foreground border-border bg-background";
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
          <Eye className="h-8 w-8" />
        </div>
        <p className="text-lg font-medium">No recent completed jobs</p>
        <p className="text-sm mt-1">Process a file to see it here</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <p className="text-sm text-muted-foreground">
          Latest audio transcription activity
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Corrections</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow
              key={job.id}
              className="hover:bg-muted/50 transition-colors"
            >
              <TableCell className="font-medium">{job.fileName}</TableCell>
              <TableCell className="text-muted-foreground">
                {job.doctor}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {job.duration}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(job.status)}>
                  {job.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {job.createdAt}
              </TableCell>
              <TableCell>
                {job.corrections > 0 ? (
                  <Badge
                    variant="outline"
                    className="text-medical-info border-medical-info/20 bg-medical-info/5"
                  >
                    {job.corrections}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={job.status !== "completed"}
                    className="hover:bg-primary/10 hover:text-primary transition-colors"
                    aria-label={`View ${job.fileName}`}
                    onClick={() =>
                      window.open(`/api/jobs/${job.id}/result`, "_blank")
                    }
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {job.status === "completed" && (
                    <button
                      className="inline-flex items-center justify-center rounded-md h-9 w-9 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 border bg-background hover:bg-accent hover:text-accent-foreground"
                      onClick={() => downloadResult(job.id)}
                      title="Download JSON"
                    >
                      <Download className="h-4 w-4 inline" />
                      <span className="sr-only">Download</span>
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
