"use client";

import { useRouter } from "next/navigation";

export default function AddExperimentButton() {
    const router = useRouter();

    return (
        <button onClick={() => router.push("/experiment/new")} className="button-primary fixed right-6 bottom-6">
            <span className="font-mono text-2xl leading-none">+</span>
            <span>New experiment</span>
        </button>
    );
}
