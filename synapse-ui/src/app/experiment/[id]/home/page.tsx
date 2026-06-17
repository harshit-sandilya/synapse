import ExperimentHomeScreen from "@/components/experiment/ExperimentHomeScreen";
import ExperimentShell from "@/components/experiment/ExperimentShell";

interface ExperimentHomePageProps {
  params: Promise<{ id: string }>;
}

export default async function ExperimentHomePage({ params }: ExperimentHomePageProps) {
  const { id } = await params;

  return (
    <ExperimentShell experimentId={id} activeTab="home">
      <ExperimentHomeScreen experimentId={id} />
    </ExperimentShell>
  );
}
