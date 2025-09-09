"use client";
import React, { useEffect, useRef, useState } from "react";
import { wakeTranscribe } from '@/src/utils/wakeTranscribe';
import { uploadAudio } from '@/src/utils/TranscribeClient';
import useFauxSmoothProgress from "@/hooks/useFauxSmoothProgress";

// --- Helper Components ---
type AudioCardProps = { uploadedFile: File | null };
function AudioCard(props: AudioCardProps) {
  const { uploadedFile } = props;
  const [audioUrl, setAudioUrl] = React.useState("");
  React.useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioUrl("");
    }
  }, [uploadedFile]);
  return (
    <section className="rounded-2xl border bg-card text-card-foreground shadow-sm p-4">
      <h3 className="text-sm font-semibold mb-2">Audio Player</h3>
      {uploadedFile && audioUrl ? (
        <AudioPlayer src={audioUrl} />
      ) : (
        <div className="text-muted-foreground text-sm">Upload a file to see audio controls.</div>
      )}
    </section>
  );
}

type TranscriptCardProps = {
  transcript: Line[];
  jobStatus: "idle" | "uploaded" | "queued" | "running" | "done" | "error";
  onExport: () => void;
};
function TranscriptCard(props: TranscriptCardProps) {
  const { transcript, jobStatus } = props;
  const isLoading = jobStatus === "queued" || jobStatus === "running";
  const lineCount = transcript.length;
  return (
  <section className="rounded-2xl border bg-card text-card-foreground shadow-sm p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 gap-3">
        <h3 className="text-sm font-semibold">Medical Transcript</h3>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{lineCount} lines</span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-500 flex-1 min-h-0">Transcribing…</div>
      ) : lineCount === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-10 flex-1 min-h-0">
          <svg
            className="h-8 w-8 text-slate-300 mb-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
            <path d="M19 10a7 7 0 0 1-14 0" />
            <path d="M12 19v4" />
            <path d="M8 23h8" />
          </svg>
          <div className="text-sm font-medium text-slate-600">No transcript available</div>
          <div className="text-xs text-slate-400">
            Upload an audio file and start transcription to see results
          </div>
        </div>
      ) : (
        (() => {
          const joined = (transcript ?? [])
            .map((l: any) => (typeof l === "string" ? l : l?.text ?? ""))
            .join("\n");
          return (
            <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800 font-mono bg-slate-50 rounded-lg p-3 h-full flex-1 min-h-0">
              {joined}
            </pre>
          );
        })()
      )}
    </section>
  );
}
import Link from "next/link";
import { Navigation } from "@/components/ui/navigation";
import { UploadDropzone } from "@/components/transcribe/UploadDropzone";
import { AudioPlayer } from "@/components/transcribe/AudioPlayer";
import TranscriptList, { Line, normalizeLines } from "@/components/transcribe/TranscriptList";
import TranscriptPanel from "@/app/components/TranscriptPanel";
import { RightRailTabs } from "@/components/transcribe/RightRailTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, Download, Mic, Upload, ExternalLink, AlertCircle, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TranscribePage() {
  useEffect(() => { wakeTranscribe(); }, []);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLElement>(null);
  const rightInnerRef = useRef<HTMLDivElement>(null);

  // Match left column height to right rail's inner content on desktop; allow natural stack on mobile
  useEffect(() => {
    const left = leftColRef.current;
    const rightInner = rightInnerRef.current;
    if (!left || !rightInner) return;

    const apply = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        // measure actual content height (not stretched track)
        const h = Math.ceil(rightInner.getBoundingClientRect().height || rightInner.scrollHeight || 0);
        left.style.height = h ? `${h}px` : "";
      } else {
        left.style.height = ""; // natural stack on mobile/tablet
      }
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(rightInner);

    // Ensure re-apply on tab switches/content swaps
    const mo = new MutationObserver(apply);
    mo.observe(rightInner, { childList: true, subtree: true });

    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, []);
  const { toast } = useToast();
  const [doctorId, setDoctorId] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'idle' | 'uploaded' | 'queued' | 'running' | 'done' | 'error'>('idle');
  // Enable Start button if a file is picked and not currently processing
  const canStart = Boolean(uploadedFile) && !(['queued', 'running'].includes(jobStatus));
  const [progress, setProgress] = useState(0);
  // Faux smooth progress for UI
  const displayProgress = useFauxSmoothProgress(progress, {
    intervalMs: 250,
    step: 1,
    resetKey: jobId || 'no-job',
  });
  const [errorMessage, setErrorMessage] = useState<string>("");
  // Change transcriptLines state to Line[]
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const [mode, setMode] = useState<'lite' | 'balanced' | 'pro'>('balanced');
  const [doctorCorrections, setDoctorCorrections] = useState<Array<{
    id: string;
    before: string;
    after: string;
    type: 'dx' | 'rx' | 'proc' | 'correction';
  }>>([]);

  // Load doctor corrections
  useEffect(() => {
    const loadDoctorCorrections = async () => {
      if (!doctorId.trim()) return;
      
      try {
        const response = await fetch(`/api/doctor/${doctorId}/corrections`);
        if (response.ok) {
          const data = await response.json();
          setDoctorCorrections(data.items || []);
        }
      } catch (error) {
        console.error('Failed to load doctor corrections:', error);
      }
    };
    
    loadDoctorCorrections();
  }, [doctorId]);

  // Polling effect for job status
  useEffect(() => {
    if (!jobId || !['queued', 'running'].includes(jobStatus)) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}/status`);
        if (response.ok) {
          const data = await response.json();
          setJobStatus(data.status);
          setProgress(data.progress || 0);
          
          if (data.status === 'done') {
            // Fetch transcript result and normalize
            const resultResponse = await fetch(`/api/jobs/${jobId}/result`, { cache: "no-store" });
            if (resultResponse.ok) {
              const resultData = await resultResponse.json();

              // 1) normalize to Line[]
              const normalized: Line[] = normalizeLines(resultData?.lines ?? resultData);
              console.log("Normalized lines:", normalized);

              // 2) (Optional) keep doctor correction output as Line[]
              const finalLines: Line[] = (typeof applyDoctorCorrections === "function"
                ? applyDoctorCorrections(normalized, doctorCorrections)
                : normalized
              );

              console.log("Normalized lines:", finalLines); // should be [{text: "Every …"}, ...]
              setTranscriptLines((finalLines ?? []).map((l: any) => (typeof l === "string" ? l : l?.text ?? "").trimStart()));

              toast({
                title: "Transcription Complete",
                description: "Your transcript is ready for review."
              });
              return; // stop any polling after done so nothing overwrites state
            }
          } else if (data.status === 'error') {
            setErrorMessage(data.error || 'Unknown error occurred');
            toast({
              title: "Transcription Failed",
              description: data.error || 'Unknown error occurred',
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        setJobStatus('error');
        setErrorMessage('Failed to check job status');
      }
    };

    const interval = setInterval(pollStatus, 2500);
    return () => clearInterval(interval);
  }, [jobId, jobStatus, doctorCorrections, toast]);

  // Improved doctor corrections with case-insensitive whole-word replacement
    function applyDoctorCorrections(lines: Line[], corrections?: any[]): Line[] {
      if (!corrections?.length) return lines;
      return lines.map((line) => {
        let correctedText = line?.text ?? "";
        for (const correction of corrections) {
          if (correction?.before && correction?.after) {
            const escapedBefore = String(correction.before).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(`\\b${escapedBefore}\\b`, "gi");
            correctedText = correctedText.replace(regex, String(correction.after));
          }
        }
        return { ...line, text: correctedText };
      });
    }

  const handleFileUpload = async (file: File) => {
    try {
      setUploadedFile(file);
      setJobStatus('uploaded');
      setErrorMessage("");
      
      // Create object URL for audio player
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} is ready for transcription`,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      setJobStatus('error');
      setErrorMessage('Failed to upload file');
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleStartTranscription = async () => {
  if (!uploadedFile) {
    toast({ title: "Choose a file first", variant: "destructive" });
    return;
  }
  setJobStatus('queued');
  setProgress(0);
  setTranscriptLines([]);
  setErrorMessage("");
  try {
    // Create job
    const doctor = doctorId.trim() || "demo";
    const jobResponse = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: doctor })
    });
    if (!jobResponse.ok) {
      const err = await jobResponse.json().catch(() => ({}));
      throw new Error(`Failed to create job: ${err.detail ?? jobResponse.statusText}`);
    }
    const jobData = await jobResponse.json();
    setJobId(jobData.jobId);

    // 1) upload
    const fd = new FormData();
    fd.append("file", uploadedFile);
    const up = await fetch(`/api/jobs/${jobData.jobId}/upload`, { method: "POST", body: fd });
    if (!up.ok) {
      const err = await up.json().catch(() => ({}));
      throw new Error(`Upload failed: ${err.error ?? up.statusText}`);
    }

    // 2) process and WAIT for it to finish
    const processRes = await fetch(`/api/jobs/${jobData.jobId}/process`, { method: "POST" });
    const body = await processRes.json().catch(() => ({}));
    if (!processRes.ok) {
      throw new Error(body?.error ? `Transcribe failed — ${body.error}${body?.detail ? `: ${body.detail}` : ""}` : "Transcribe failed");
    }

    // 3) Only AFTER process succeeds, set job status to running
    setJobStatus("running");
    toast({
      title: "Transcription Started",
      description: "Processing your audio file..."
    });
  } catch (error) {
    console.error('Transcription error:', error);
    setJobStatus('error');
    setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    toast({
      title: "Error",
      description: "Failed to start transcription.",
      variant: "destructive"
    });
  }
};

  const handleRetry = () => {
    setJobStatus('uploaded');
    setErrorMessage("");
    setProgress(0);
  };

  const handleEditLine = (index: number, newText: string) => {
    setTranscriptLines(prev =>
      prev.map((line, i) => i === index ? newText : line)
    );
  };

  const handleExport = async () => {
    try {
      const text = transcriptLines.join("\n");
      const cleanedForExport = (text ?? "").replace(/^\s+/gm, "");
      if (!cleanedForExport.trim()) {
        toast({
          title: "No Content",
          description: "No transcript to export.",
          variant: "destructive"
        });
        return;
      }
      const res = await fetch("/api/exports/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Medical Transcript", text: cleanedForExport }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        console.error("Export failed", res.status, msg);
        throw new Error(`Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Medical_Transcript.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({
        title: "Export Successful",
        description: "Document downloaded successfully."
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export document.",
        variant: "destructive"
      });
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Navigation />
        
        {/* Header */}
        <Card className="rounded-xl shadow-soft">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center space-x-2">
                <Mic className="h-6 w-6 text-primary" />
                <span>Medical Transcription</span>
              </CardTitle>
              <Link 
                href="/doctor" 
                className="flex items-center space-x-2 text-sm text-primary hover:text-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Manage Doctor Profile</span>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="doctorId">Doctor ID</Label>
              <Input
                id="doctorId"
                placeholder=" (optional)"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Used for personalized corrections and preferences
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upload Card */}
        <Card className="rounded-xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-primary" />
              <span>Upload Audio or Video File</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UploadDropzone 
              onFileSelected={handleFileUpload}
              uploadedFile={uploadedFile} 
            />
            
            {uploadedFile && (
              <div className="p-4 bg-medical-success/5 border border-medical-success/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(uploadedFile.size / 1024 / 1024 * 100) / 100} MB
                    </p>
                  </div>
                  {jobStatus === 'uploaded' && (
                    <Badge variant="outline" className="text-medical-success border-medical-success bg-medical-success/10">
                      Ready for Processing
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* Processing Status or Start Button */}
            {jobStatus === 'error' && (
              <Alert variant="destructive" className="rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    size="sm"
                    className="ml-4 hover:bg-destructive/10"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {(['queued', 'running'].includes(jobStatus)) && (
              <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">
                    {jobStatus === 'queued' ? 'Queued for processing...' : 'Processing audio file...'}
                  </span>
                  <span className="text-muted-foreground">{Math.round(displayProgress)}%</span>
                </div>
                <Progress value={displayProgress} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  This may take a few minutes depending on file size and selected mode
                </p>
              </div>
            )}
            
            {jobStatus === 'uploaded' && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={handleStartTranscription}
                  disabled={!uploadedFile}
                  size="lg"
                  className="bg-gradient-primary hover:opacity-90 shadow-medium transition-all duration-200"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Transcription
                </Button>
              </div>
            )}
          </CardContent>
        </Card>


  {/* Main 3-col layout */}
  <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
    {/* Transcript spans two columns */}
    <section
      ref={leftColRef}
      className="lg:col-span-2 order-2 lg:order-1 h-full min-h-0 flex flex-col"
    >
      <TranscriptPanel
        lines={transcriptLines}
        isLoading={jobStatus === "queued" || jobStatus === "running"}
        onLinesChange={setTranscriptLines}
      />
    </section>

    {/* Right rail: audio + corrections/detected */}
    <aside
      ref={rightColRef}
      className="order-1 lg:order-2"
    >
      <div ref={rightInnerRef} className="space-y-4">
        <AudioCard uploadedFile={uploadedFile} />
        <RightRailTabs doctorId={doctorId} />
      </div>
    </aside>
      </div>

      {/* Footer Bar */}
      <Card className="rounded-xl shadow-soft">
        <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleExport}
                  disabled={!transcriptLines?.length}
                  variant="outline"
                  className="hover:bg-primary/10 hover:text-primary hover:border-primary"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as Word Document
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium">Processing Mode:</Label>
                <div className="flex border rounded-lg overflow-hidden">
                  {(['lite', 'balanced', 'pro'] as const).map((modeOption) => (
                    <Button
                      key={modeOption}
                      variant={mode === modeOption ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMode(modeOption)}
                      className={`rounded-none border-none ${
                        mode === modeOption 
                          ? 'bg-primary text-primary-foreground shadow-none' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      {modeOption === 'lite' && 'Lite'}
                      {modeOption === 'balanced' && 'Balanced'}
                      {modeOption === 'pro' && 'Pro'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}