import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, MessageCircle } from "lucide-react";

export default function ParticipantHome() {
  const progress = 70; // example %

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-gray-800">
      <header className="flex items-center justify-between px-6 py-4 shadow">
        <div className="font-semibold text-xl text-[#334E68]">MediationApp</div>
        <div className="flex gap-4 items-center">
          <Button variant="secondary" className="flex gap-2">
            <MessageCircle className="w-4 h-4" />
            AI Assistant
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-medium mb-4">Document Upload Progress</h2>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-[#4A90E2] h-4 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex gap-4">
              <Button className="flex gap-2 bg-[#4A90E2] hover:bg-[#357ABD]">
                <Upload className="w-4 h-4" />
                Upload New
              </Button>
              <Button variant="secondary">View Submitted</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium mb-4">Next Steps</h2>
            <ul className="list-disc pl-6 text-sm text-gray-700">
              <li>Mediator feedback goes here</li>
              <li>Reminders, deadlines</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
