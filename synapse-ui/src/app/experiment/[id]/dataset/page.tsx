import DatasetScreen from "@/components/experiment/DatasetScreen";
import ExperimentShell from "@/components/experiment/ExperimentShell";

interface ExperimentDatasetPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExperimentDatasetPage({ params }: ExperimentDatasetPageProps) {
  const { id } = await params;

  return (
    <ExperimentShell experimentId={id} activeTab="dataset">
      <DatasetScreen experimentId={id} />
    </ExperimentShell>
  );
}
