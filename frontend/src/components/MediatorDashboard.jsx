import React from "react";
import { Plus, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "./Layout";
import ChatDrawer from "./chat/ChatDrawer";

export default function MediatorDashboard() {
  const [chatOpen, setChatOpen] = React.useState(false);
  
  const clients = [
    { id: 1, name: "John & Mary Smith", status: "Active" },
    { id: 2, name: "Alex Johnson", status: "Pending" },
  ];

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium">Clients</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 bg-[#10B981] text-white px-4 py-2 rounded hover:bg-[#059669]"
          >
            <MessageSquare className="w-4 h-4" />
            Open Chat & AI Insights
          </button>
          <button className="flex items-center gap-2 bg-[#4A90E2] text-white px-4 py-2 rounded hover:bg-[#357ABD]">
            <Plus className="w-4 h-4" />
            New Client
          </button>
        </div>
      </div>
      
      <ChatDrawer open={chatOpen} onOpenChange={setChatOpen} />

      <div className="space-y-4">
        {clients.map((c) => (
          <Card key={c.id} className="bg-white shadow-sm">
            <CardContent className="flex justify-between items-center p-4">
              <span className="font-medium">{c.name}</span>
              <span className="text-sm text-gray-600">{c.status}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
