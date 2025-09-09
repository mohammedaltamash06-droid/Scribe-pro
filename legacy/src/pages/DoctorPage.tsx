import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CorrectionsTable } from "@/components/doctor/CorrectionsTable";
import { DxTable } from "@/components/doctor/DxTable";
import { RxTable } from "@/components/doctor/RxTable";
import { ProcTable } from "@/components/doctor/ProcTable";

export default function DoctorPage() {
  const [activeTab, setActiveTab] = useState("corrections");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Doctor Profile</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="corrections">Corrections</TabsTrigger>
          <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="procedures">Procedures</TabsTrigger>
        </TabsList>

        <TabsContent value="corrections" className="space-y-4">
          <CorrectionsTable doctorId="1" />
        </TabsContent>

        <TabsContent value="diagnoses" className="space-y-4">
          <DxTable doctorId="1" />
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4">
          <RxTable doctorId="1" />
        </TabsContent>

        <TabsContent value="procedures" className="space-y-4">
          <ProcTable doctorId="1" />
        </TabsContent>
      </Tabs>
    </div>
  );
}