import ExperimentShell from "@/components/experiment/ExperimentShell";
import InferenceScreen from "@/components/experiment/InferenceScreen";

interface ExperimentInferencePageProps {
  params: Promise<{ id: string }>;
}

export default async function ExperimentInferencePage({ params }: ExperimentInferencePageProps) {
  const { id } = await params;

  return (
    <ExperimentShell experimentId={id} activeTab="inference">
      <InferenceScreen experimentId={id} />
    </ExperimentShell>
  );
}
