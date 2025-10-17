import TopBar from "@/components/TopBar";

export default function GlobalLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F7F9FB] text-gray-800 font-sans">
      <TopBar />
      <main className="max-w-5xl mx-auto p-6">{children}</main>
    </div>
  );
}
