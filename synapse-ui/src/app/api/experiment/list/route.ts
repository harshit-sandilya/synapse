import { NextResponse } from "next/server";
import { mockExperiments } from "@/data/mockExperiments";
import { ApiSuccessResponse } from "@/types/api.types";

export async function GET() {
  try {
    const response: ApiSuccessResponse<typeof mockExperiments> = {
      message: "Experiments loaded successfully.",
      data: mockExperiments,
    };

    return NextResponse.json(response, {
      status: 200,
    });
  } catch (error) {
    console.error("Experiment API error:", error);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 500,
        error: "Internal Server Error",
        message: "Failed to load experiments.",
        path: "/api/experiments",
      },
      {
        status: 500,
      },
    );
  }
}
