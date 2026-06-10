import { ApiError, ApiSuccessResponse } from "@/types/api.types";

export interface CreateExperimentRequestDTO {
  runtimeURL: string;
  runtimeName: string;

  name: string;
  description?: string;
}

export interface CreateExperimentResponseDTO {
  id: string;
  name: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

type CreateExperimentServiceResponse = [
  CreateExperimentResponseDTO | null,
  ApiError | null,
];

const createExperiment = async (
  payload: CreateExperimentRequestDTO,
): Promise<CreateExperimentServiceResponse> => {
  try {
    const response = await fetch("/api/experiment/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload: ApiError = await response.json();

      return [
        null,
        {
          ...errorPayload,
        },
      ];
    }

    const successPayload =
      (await response.json()) as ApiSuccessResponse<CreateExperimentResponseDTO>;

    return [successPayload.data, null];
  } catch (error) {
    console.error("[experimentCreateService.createExperiment]", error);

    return [
      null,
      {
        timestamp: new Date().toISOString(),
        status: 500,
        error: "Client Error",
        message: "Failed to create experiment.",
        path: "/api/experiments",
      },
    ];
  }
};

export const experimentCreateService = {
  createExperiment,
};
