import { Experiment } from "@/features/experiments/experiment-list/experiment-list.model";
import { ApiError, ApiSuccessResponse } from "@/types/api.types";

type GetExperimentsServiceResponse = [Experiment[] | null, ApiError | null];

const getExperiments = async (): Promise<GetExperimentsServiceResponse> => {
  try {
    const response = await fetch("/api/experiment/list", {
      method: "GET",
    });

    if (!response.ok) {
      const errorPayload: ApiError = await response.json();
      return [null, errorPayload];
    }

    const successPayload = (await response.json()) as ApiSuccessResponse<
      Experiment[]
    >;

    return [successPayload.data, null];
  } catch (error) {
    console.error(
      "Network or parsing error in experimentService.getExperiments:",
      error,
    );

    return [
      null,
      {
        timestamp: new Date().toISOString(),
        status: 500,
        error: "Client Error",
        message: "Unexpected client-side error occurred.",
        path: "/api/experiments",
      },
    ];
  }
};

export const experimentService = {
  getExperiments,
};
