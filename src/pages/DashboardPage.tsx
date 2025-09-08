import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/dashboard/StatCard";
import { JobsTable } from "@/components/dashboard/JobsTable";
import { MiniChart } from "@/components/dashboard/MiniChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Zap, CheckCircle } from "lucide-react";

export default function DashboardPage() {
  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/dashboard/summary");
        if (!response.ok) throw new Error('API not available');
        return response.json();
      } catch (error) {
        // Return mock data when API is not available
        return {
          totalFiles: 0,
          filesTranscribed: 0,
          totalMinutes: 0,
          minutesProcessed: 0,
          timeSaved: 0,
          autoCorrections: 0,
          appliedSuccessfully: 0,
          timeseries: [
            { date: '2024-01-15', files: 3, minutes: 45 },
            { date: '2024-01-16', files: 5, minutes: 72 },
            { date: '2024-01-17', files: 2, minutes: 28 },
            { date: '2024-01-18', files: 7, minutes: 105 },
            { date: '2024-01-19', files: 4, minutes: 68 },
          ],
          minutesTimeseries: [
            { date: '2024-01-15', minutes: 45 },
            { date: '2024-01-16', minutes: 72 },
            { date: '2024-01-17', minutes: 28 },
            { date: '2024-01-18', minutes: 105 },
            { date: '2024-01-19', minutes: 68 },
          ]
        };
      }
    },
  });

  const { data: recentJobs } = useQuery({
    queryKey: ["recent-jobs"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/jobs/recent");
        if (!response.ok) throw new Error('API not available');
        return response.json();
      } catch (error) {
        // Return empty array when API is not available - JobsTable handles this
        return [];
      }
    },
  });

  const stats = [
    {
      title: "Total Files",
      value: (summary?.totalFiles || 0).toString(),
      description: "Files transcribed",
      trend: "+12% from last month",
      trendUp: true,
      icon: FileText,
    },
    {
      title: "Total Minutes",
      value: `${summary?.totalMinutes || 0}h ${summary?.minutesProcessed || 0}m`,
      description: "Audio processed",
      trend: "+8% from last month",
      trendUp: true,
      icon: Clock,
    },
    {
      title: "Time Saved",
      value: `${summary?.timeSaved || 0}h ${summary?.minutesProcessed || 0}m`,
      description: "Through automation",
      trend: "+15% from last month",
      trendUp: true,
      icon: Zap,
    },
    {
      title: "Auto-Corrections",
      value: (summary?.autoCorrections || 0).toString(),
      description: "Applied successfully",
      trend: "+22% from last month",
      trendUp: true,
      icon: CheckCircle,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your transcription activity and performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Files per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniChart 
              data={summary?.timeseries || []} 
              type="bar"
              dataKey="files"
              xAxisKey="date"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minutes per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniChart 
              data={summary?.minutesTimeseries || []} 
              type="line"
              dataKey="minutes"
              xAxisKey="date"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transcription Jobs</CardTitle>
          <p className="text-sm text-muted-foreground">Latest audio transcription activity</p>
        </CardHeader>
        <CardContent>
          <JobsTable />
        </CardContent>
      </Card>
    </div>
  );
}