"use client";

import { useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { CorrectionsTable } from "@/components/doctor/CorrectionsTable";
import { DxTable } from "@/components/doctor/DxTable";
import { RxTable } from "@/components/doctor/RxTable";
import { ProcTable } from "@/components/doctor/ProcTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Settings, Heart, Pill, Scissors, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DoctorPage() {
  const { toast } = useToast();
  const [doctorId, setDoctorId] = useState<string>("chen");

  const handleDoctorIdSubmit = () => {
    if (doctorId.trim()) {
      toast({
        title: "Doctor Profile Loaded",
        description: `Loaded profile and preferences for Dr. ${doctorId}`,
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
                <UserCheck className="h-6 w-6 text-primary" />
                <span>Doctor Profile & Preferences</span>
              </CardTitle>
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                Clinical Configuration
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="doctorId">Doctor ID</Label>
                <Input
                  id="doctorId"
                  placeholder=""
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => e.key === 'Enter' && handleDoctorIdSubmit()}
                />
              </div>
              <Button 
                onClick={handleDoctorIdSubmit}
                disabled={!doctorId.trim()}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Settings className="h-4 w-4 mr-2" />
                Load Profile
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Configure personalized corrections, favorite diagnoses, medications, and procedures
            </p>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="corrections" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 rounded-xl bg-muted p-1">
            <TabsTrigger 
              value="corrections" 
              className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Corrections</span>
            </TabsTrigger>
            <TabsTrigger 
              value="diagnoses"
              className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Diagnoses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="medications"
              className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft"
            >
              <Pill className="h-4 w-4" />
              <span className="hidden sm:inline">Medications</span>
            </TabsTrigger>
            <TabsTrigger 
              value="procedures"
              className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft"
            >
              <Scissors className="h-4 w-4" />
              <span className="hidden sm:inline">Procedures</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="corrections" className="space-y-0">
            <Card className="rounded-xl shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-medical-warning" />
                  <span>Text Corrections</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage automatic text replacements for improved transcription accuracy
                </p>
              </CardHeader>
              <CardContent>
                <CorrectionsTable doctorId={doctorId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnoses" className="space-y-0">
            <Card className="rounded-xl shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-destructive" />
                  <span>Favorite Diagnoses</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure frequently used ICD-10 diagnoses for quick access
                </p>
              </CardHeader>
              <CardContent>
                <DxTable doctorId={doctorId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications" className="space-y-0">
            <Card className="rounded-xl shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Pill className="h-5 w-5 text-primary" />
                  <span>Favorite Medications</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage commonly prescribed medications with dosing information
                </p>
              </CardHeader>
              <CardContent>
                <RxTable doctorId={doctorId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="procedures" className="space-y-0">
            <Card className="rounded-xl shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scissors className="h-5 w-5 text-accent" />
                  <span>Favorite Procedures</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure frequently performed CPT procedures and codes
                </p>
              </CardHeader>
              <CardContent>
                <ProcTable doctorId={doctorId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}