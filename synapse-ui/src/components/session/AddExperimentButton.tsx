"use client";

export default function AddExperimentButton() {
  const handleCreateExperiment = () => {
    console.log("Create Experiment");
  };

  return (
    <button
      onClick={handleCreateExperiment}
      className="fixed bottom-6 right-6 button-primary"
    >
      <span className="font-mono text-2xl leading-none">+</span>
      <span>New experiment</span>
    </button>
  );
}
