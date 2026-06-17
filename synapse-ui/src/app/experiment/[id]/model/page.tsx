import ExperimentShell from "@/components/experiment/ExperimentShell";
import ModelScreen from "@/components/experiment/ModelScreen";

interface ExperimentModelPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExperimentModelPage({ params }: ExperimentModelPageProps) {
  const { id } = await params;

  return (
    <ExperimentShell experimentId={id} activeTab="model">
      <ModelScreen experimentId={id} />
    </ExperimentShell>
  );
}
