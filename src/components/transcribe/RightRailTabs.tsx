import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CorrectionsList } from "./CorrectionsList";
import { DetectedTerms } from "./DetectedTerms";
import { Settings, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";

interface RightRailTabsProps {
  doctorId: string;
}

export function RightRailTabs({ doctorId }: RightRailTabsProps) {
  return (
    <Card className="h-fit">
      <CardContent className="p-0">
        <Tabs defaultValue="corrections" className="w-full">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="corrections">Corrections</TabsTrigger>
              <TabsTrigger value="detected">Detected</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="corrections" className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Auto-Corrections</h3>
              <Button asChild variant="outline" size="sm">
                <Link href="/doctor">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Go to Doctor Page
                </Link>
              </Button>
            </div>
            {doctorId.trim() ? (
              <CorrectionsList doctorId={doctorId} />
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">Enter a doctor ID to view corrections</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="detected" className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Detected Medical Terms</h3>
              <Badge variant="outline" className="text-medical-info border-medical-info">
                Live
              </Badge>
            </div>
            <DetectedTerms doctorId={doctorId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}