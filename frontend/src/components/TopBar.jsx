import { Button } from "@/components/ui/button";
import { User, MessageCircle } from "lucide-react";

export default function TopBar() {
  return (
    <header className="flex items-center justify-between px-6 py-4 shadow bg-[#F7F9FB]">
      <div className="font-semibold text-xl text-[#334E68]">MediationApp</div>
      <div className="flex gap-4 items-center">
        <Button variant="secondary" className="flex gap-2">
          <MessageCircle className="w-4 h-4" />
          AI Assistant
        </Button>
        <User className="w-6 h-6 text-gray-500" />
      </div>
    </header>
  );
}
