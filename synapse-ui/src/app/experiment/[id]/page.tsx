import { redirect } from "next/navigation";

interface ExperimentIndexPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExperimentIndexPage({ params }: ExperimentIndexPageProps) {
  const { id } = await params;
  redirect(`/experiment/${id}/home`);
}
