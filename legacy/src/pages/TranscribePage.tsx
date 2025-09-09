import React, { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { UploadDropzone } from "@/components/transcribe/UploadDropzone";
import { AudioPlayer } from "@/components/transcribe/AudioPlayer";
import TranscriptList, { normalizeLines, Line } from "@/components/transcribe/TranscriptList";
import { RightRailTabs } from "@/components/transcribe/RightRailTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, AlertCircle, ExternalLink, Upload, Download } from "lucide-react";

type JobStatus = "idle" | "uploaded" | "queued" | "running" | "done" | "error";

interface TranscriptLine {
  id: string;
  text: string;
  timestamp: number;
  speaker?: string;
}

/* ========== Small, presentational cards (no hooks inside JSX) ========== */

function TranscriptCard({
  transcript,
  jobStatus,
  onExport,
}: {
  transcript: Line[];
  jobStatus: JobStatus;
  onExport: () => void;
}) {
  return (
    <section className="rounded-2xl border bg-card text-card-foreground shadow-sm p-4">
      <div className="flex items-center justify-between mb-2 gap-3">
        <h3 className="text-sm font-semibold">Medical Transcript</h3>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{transcript.length} lines</span>
          <Button variant="outline" size="sm" onClick={onExport} className="h-7 px-2 text-xs">
            <Download className="h-3.5 w-3.5 mr-1" /> Export .docx
          </Button>
        </div>
      </div>

      {jobStatus === "done" && transcript.length > 0 ? (
        <TranscriptList lines={transcript} />
      ) : (
        <div className="text-muted-foreground text-sm">No transcript available.</div>
      )}
    </section>
  );
}

function AudioCard({ uploadedFile }: { uploadedFile: File | null }) {
  return (
    <section className="rounded-2xl border bg-card text-card-foreground shadow-sm p-4">
      <h3 className="text-sm font-semibold mb-2">Audio Player</h3>
      {uploadedFile ? (
        <AudioPlayer src={URL.createObjectURL(uploadedFile)} />
      ) : (
        <div className="text-muted-foreground text-sm">Upload a file to see audio controls.</div>
      )}
    </section>
  );
}

/* =====================  PAGE  ===================== */

export default function TranscribePage() {
  const { toast } = useToast();

  const [doctorId, setDoctorId] = useState("");
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Line[]>([]);
  const [corrections, setCorrections] = useState<Array<{ before: string; after: string }>>([]);
  const [mode, setMode] = useState<"Lite" | "Balanced" | "Pro">("Balanced");

  const handleFileUpload = useCallback(
    (file: File) => {
      setUploadedFile(file);
      setJobStatus("uploaded");
      setError(null);
      toast({
        title: "File uploaded",
        description: `${file.name} is ready for transcription`,
      });
    },
    [toast]
  );

  async function handleStart() {
    if (!uploadedFile) return;

    try {
      setJobStatus("queued");
      setProgress(0);
      setError(null);

      // 1) Create job
      const res1 = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: doctorId || "demo" }),
      });
      const { jobId: newJobId } = await res1.json();
      if (!newJobId) throw new Error("Failed to create job");
      setJobId(newJobId);

      // 2) Upload file
      const fd = new FormData();
      fd.set("file", uploadedFile);
      const res2 = await fetch(`/api/jobs/${newJobId}/upload`, { method: "POST", body: fd });
      const up = await res2.json();
      if (!res2.ok) throw new Error(up?.error || "Upload failed");

      // 3) Kick off processing
      await fetch(`/api/jobs/${newJobId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: mode || "Balanced" }),
      });

      // 4) Poll status until done
      const poll = async (): Promise<void> => {
        const r = await fetch(`/api/jobs/${newJobId}/status`);
        const s = await r.json();
        setJobStatus(s.state);
        setProgress(s.progress || 0);

        if (s.state === "done") return;
        if (s.state === "error") throw new Error(s.message || "Processing error");

        await new Promise((r2) => setTimeout(r2, 1500));
        return poll();
      };

      await poll();

      // 5) Fetch full transcript
      const r3 = await fetch(`/api/jobs/${newJobId}/result`);
      const { lines } = await r3.json();
      setTranscript(normalizeLines(lines));
    } catch (err) {
      console.error(err);
      setJobStatus("error");
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      toast({
        title: "Transcription error",
        description: msg,
        variant: "destructive",
      });
    }
  }

  const exportToDocx = async () => {
    try {
      const response = await fetch("/api/exports/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadedFile?.name || "Transcript",
          lines: transcript,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${uploadedFile?.name || "transcript"}.docx`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: "Export successful",
          description: "Transcript exported as Word document",
        });
      }
    } catch {
      toast({
        title: "Export failed",
        description: "Failed to export transcript",
        variant: "destructive",
      });
    }
  };

  const retryTranscription = () => {
    setJobStatus("uploaded");
    setError(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Mic className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Transcribe</h1>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Open Doctor Profile
        </Button>
      </div>

      {/* Doctor ID */}
      <div className="space-y-2">
        <Label htmlFor="doctorId">Doctor ID</Label>
        <Input
          id="doctorId"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          placeholder=" (e.g., johnson, chen, rodriguez)"
          className="max-w-md"
        />
      </div>

      {/* Upload section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Upload Audio or Video</h2>
        </div>

        <div className="space-y-6">
          {jobStatus === "idle" && (
            <div className="space-y-4">
              <UploadDropzone onFileSelected={handleFileUpload} uploadedFile={uploadedFile} />
              <p className="text-muted-foreground text-center">Upload a file to see audio controls</p>
            </div>
          )}

          {jobStatus === "uploaded" && uploadedFile && (
            <>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium">{uploadedFile.name}</h3>
                <p className="text-sm text-muted-foreground">Ready for transcription</p>
              </div>
              <Button onClick={handleStart} className="w-full">
                Transcribe Now
              </Button>
            </>
          )}

          {(jobStatus === "queued" || jobStatus === "running") && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium mb-2">
                  {jobStatus === "queued" ? "Queued..." : "Processing..."}
                </h3>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
              </div>
            </div>
          )}

          {jobStatus === "error" && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                {error}
                <Button variant="outline" size="sm" onClick={retryTranscription}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Main 3-col layout */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Transcript spans two columns */}
        <section className="lg:col-span-2 order-2 lg:order-1">
          <TranscriptCard transcript={transcript} jobStatus={jobStatus} onExport={exportToDocx} />
        </section>

        {/* Right rail: audio + detected/corrections */}
        <aside className="order-1 lg:order-2 space-y-4">
          <AudioCard uploadedFile={uploadedFile} />
          {/* Keep your existing RightRailTabs here to show Corrections/Detected terms */}
          <RightRailTabs doctorId={doctorId} />
        </aside>
      </div>

      {/* Mode selector */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">Mode:</div>
        <div className="flex items-center space-x-2">
          {(["Lite", "Balanced", "Pro"] as const).map((m) => (
            <Button
              key={m}
              variant={mode === m ? "default" : "outline"}
              size="sm"
              onClick={() => setMode(m)}
              className={mode === m ? "bg-primary text-primary-foreground" : ""}
            >
              {m}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
