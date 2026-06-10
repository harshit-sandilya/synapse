import ConnectionForm from "@/components/home/connectionForm";
import RecentSessions from "@/components/home/recentSessions";

export default function Home() {
  return (
    <main className="flex h-screen w-screen items-center justify-center overflow-hidden px-4">
      <div className="flex w-full max-w-xl flex-col gap-4">
        <ConnectionForm />
        <RecentSessions />
      </div>
    </main>
  );
}
