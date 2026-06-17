import ExperimentShell from "@/components/experiment/ExperimentShell";
import TelemetryScreen from "@/components/experiment/TelemetryScreen";

interface ExperimentTelemetryPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExperimentTelemetryPage({ params }: ExperimentTelemetryPageProps) {
  const { id } = await params;

  return (
    <ExperimentShell experimentId={id} activeTab="telemetry">
      <TelemetryScreen experimentId={id} />
    </ExperimentShell>
  );
}
