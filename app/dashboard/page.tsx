"use client";
"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/ui/navigation";
import { StatCard } from "@/components/dashboard/StatCard";
import { JobsTable } from "@/components/dashboard/JobsTable";
import { MiniChart } from "@/components/dashboard/MiniChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  FileAudio,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CodeList from '@/components/doctor/CodeList';

interface DashboardStats {
  totalJobs: number;
  completedJobs: number;
  processingTime: string;
  errorRate: string;
  trend: {
    jobs: string;
    jobsUp: boolean;
    completion: string;
    completionUp: boolean;
  };
  dx_count: number;
  rx_count: number;
  proc_count: number;
  audioMinutes?: number;
  exports?: number;
}

interface TimeseriesData {
  date: string;
  jobs: number;
  completions: number;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard summary
        const summaryRes = await fetch("/api/dashboard/summary", { cache: "no-store" });
        if (summaryRes.ok) {
          const s = await summaryRes.json();
          setStats({
            totalJobs: s.total_jobs ?? 0,
            completedJobs: s.completed_jobs ?? 0,
            processingTime: `${Math.round((s.avg_turnaround_seconds ?? 0) / 60)} min`, // show turnaround as "Avg Processing Time"
            errorRate: `${((s.error_count ?? 0) / Math.max(1, s.total_jobs ?? 1) * 100).toFixed(0)}%`,
            // keep existing trend and other fields if needed
            trend: stats?.trend ?? { jobs: "", jobsUp: false, completion: "", completionUp: false },
            dx_count: stats?.dx_count ?? 0,
            rx_count: stats?.rx_count ?? 0,
            proc_count: stats?.proc_count ?? 0,
            // you can also surface:
            audioMinutes: s.audio_minutes_total ?? 0,
            exports: s.exports_count ?? 0,
          });
          setTimeseries(s.timeseries || []);
        } else {
          setStats(null as any);
          setTimeseries([]);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast({
          title: "Error Loading Dashboard",
          description: "Failed to load dashboard statistics",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  const completionRate = stats ? ((stats.completedJobs / stats.totalJobs) * 100).toFixed(1) : "0";

  const doctorId = 'DOCTOR123'; // <- replace with real selected doctor

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Navigation />

        {/* Header */}
        <Card className="rounded-xl shadow-soft">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <span>Analytics Dashboard</span>
              </CardTitle>
              <Badge variant="outline" className="text-medical-info border-medical-info/20 bg-medical-info/5">
                Live Data
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time insights into transcription performance and system metrics
            </p>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Jobs"
            value={loading ? "..." : stats ? stats.totalJobs.toString() : "0"}
            icon={FileAudio}
            description={stats ? "All transcription jobs" : "No data yet"}
            trend={stats?.trend?.jobs}
            trendUp={stats?.trend?.jobsUp}
          />
          <StatCard
            title="Completed Jobs"
            value={loading ? "..." : stats?.completedJobs.toString() || "0"}
            icon={CheckCircle}
            description="Successfully processed"
            trend={stats?.trend.completion}
            trendUp={stats?.trend.completionUp}
          />
          <StatCard
            title="Avg Processing Time"
            value={loading ? "..." : stats?.processingTime || "0 min"}
            icon={Clock}
            description="Time per transcription"
          />
          <StatCard
            title="Error Rate"
            value={loading ? "..." : stats?.errorRate || "0%"}
            icon={AlertCircle}
            description="Failed transcriptions"
          />
        </div>

        {/* Charts and Tables */}
        <section className="grid grid-cols-1 gap-4">
          <Card className="rounded-xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Processing Trends</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Daily transcription activity over the last 30 days
              </p>
            </CardHeader>
            <CardContent>
              {!loading && timeseries.length > 0 ? (
                <MiniChart
                  data={timeseries.map(item => ({
                    date: item.date,
                    value: item.jobs,
                    completions: item.completions
                  }))}
                  type="bar"
                  dataKey="value"
                  xAxisKey="date"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{loading ? "Loading chart data..." : "No data yet"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Summary Card remains below Processing Trends */}
          <Card className="rounded-xl shadow-soft bg-gradient-secondary">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{completionRate}%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-medical-success">
                    {loading ? "..." : stats?.completedJobs || "0"}
                  </p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-medical-info">
                    {loading ? "..." : stats?.processingTime || "0 min"}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

        {/* ==== Recent Transcription Jobs (full width table) ==== */}
        </section>
        <section className="mt-4">
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-lg font-semibold">Recent Transcription Jobs</h3>
              {/* Optional: add filters/actions here later if needed */}
            </div>
            <div className="p-4">
              <JobsTable />
            </div>
          </div>
        </section>

  {/* DX/RX/PROC blocks removed. Only KPIs and Recent Jobs are shown as per new dashboard spec. */}
      </div>
    </main>
  );
}

interface CodeListSimpleProps {
  doctorId: string;
  kind: 'dx' | 'rx' | 'proc';
  label: string;
}

interface ApiItem {
  id: number;
  doctor_id: string;
  code: string;
  text: string;
  created_at?: string;
}

function CodeListSimple({ doctorId, kind, label }: CodeListSimpleProps) {
  const [items, setItems] = useState<ApiItem[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch(`/api/doctor/${doctorId}/${kind}?q=${query}&limit=20&offset=0`)
      .then(r => r.json())
      .then(data => setItems(data.items as ApiItem[]));
  }, [doctorId, kind, query]);

  return (
    <div className="mb-8">
      <h2 className="font-semibold mb-2">{label}</h2>
      <input
        type="text"
        placeholder={`Search ${label}`}
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="border p-2 rounded mb-4 w-full max-w-md"
      />
      <ul>
        {items.map(row => (
          <li key={row.id} className="mb-1">
            <strong>{row.code}</strong> – {row.text}
          </li>
        ))}
      </ul>
    </div>
  );
}