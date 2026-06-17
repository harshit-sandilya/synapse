import ConnectionForm from "@/components/home/connectionForm";
import RecentWorkspaces from "@/components/home/recentWorkspaces";

export default function Home() {
  return (
    <main className="flex h-screen w-screen items-center justify-center overflow-hidden px-4">
      <div className="flex w-full max-w-xl flex-col gap-4">
        <ConnectionForm />
        <RecentWorkspaces />
      </div>
    </main>
  );
}
