import RuntimeBar from "@/components/session/RuntimeBar";
import ExperimentList from "@/components/session/ExperimentList";
import AddExperimentButton from "@/components/session/AddExperimentButton";

export default function Session() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col justify-center items-center gap-4">
      <RuntimeBar />
      <ExperimentList />
      <AddExperimentButton />
    </div>
  );
}
