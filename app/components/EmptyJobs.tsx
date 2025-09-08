"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import Link from "next/link";

export default function EmptyJobs() {
  return (
    <Card className="rounded-xl shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">No jobs yet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Start by uploading an audio file to generate your first transcript.</p>
        <div>
          <Link href="/transcribe">
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Go to Transcribe
            </Button>
          </Link>
        </div>
        <ul className="list-disc pl-5">
          <li>Supported: mp3, m4a, wav, ogg, mp4…</li>
          <li>We’ll show live progress (created → uploaded → running → done).</li>
        </ul>
      </CardContent>
    </Card>
  );
}
