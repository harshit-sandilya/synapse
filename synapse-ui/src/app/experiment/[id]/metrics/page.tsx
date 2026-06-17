import ExperimentShell from "@/components/experiment/ExperimentShell";
import MetricsScreen from "@/components/experiment/MetricsScreen";

interface ExperimentMetricsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExperimentMetricsPage({ params }: ExperimentMetricsPageProps) {
  const { id } = await params;

  return (
    <ExperimentShell experimentId={id} activeTab="metrics">
      <MetricsScreen experimentId={id} />
    </ExperimentShell>
  );
}
