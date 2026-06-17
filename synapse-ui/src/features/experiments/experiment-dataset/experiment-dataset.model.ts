import type { SaveDatasetConfigRequest } from "@/types/api/dataset/save-dataset-config.request";
import type { SaveDatasetConfigResponse } from "@/types/api/dataset/save-dataset-config.response";
import type { ValidateDatasetResponse } from "@/types/api/dataset/validate-dataset.response";
import type { ExperimentDatasetResponse } from "@/types/api/experiment/experiment-dataset.response";
import { ConfigStatus, DatasetProvider } from "@/types/enums/transport.enums";

export type DatasetForm = Omit<SaveDatasetConfigRequest, "experimentId">;

export interface ExperimentDatasetData {
  dataset: ExperimentDatasetResponse | null;
  form: DatasetForm;
  saveResponse: SaveDatasetConfigResponse | null;
  validationResponse: ValidateDatasetResponse | null;
  loading: boolean;
  saving: boolean;
  validating: boolean;
  error: string | null;
}

export const initialDatasetForm: DatasetForm = {
  provider: DatasetProvider.PYTORCH,
  datasetName: "",
  batchSize: 64,
  numWorkers: 2,
  shuffle: true,
  pinMemory: false,
  dropLast: false,
  prefetchFactor: 2,
  persistentWorkers: false,
};

export const initialExperimentDatasetData: ExperimentDatasetData = {
  dataset: null,
  form: initialDatasetForm,
  saveResponse: null,
  validationResponse: null,
  loading: false,
  saving: false,
  validating: false,
  error: null,
};

export function datasetFormFromResponse(
  dataset: ExperimentDatasetResponse | null,
): DatasetForm {
  if (!dataset) {
    return initialDatasetForm;
  }

  return {
    provider: dataset.provider ?? initialDatasetForm.provider,
    datasetName: dataset.datasetName ?? initialDatasetForm.datasetName,
    batchSize: dataset.batchSize ?? initialDatasetForm.batchSize,
    numWorkers: dataset.numWorkers ?? initialDatasetForm.numWorkers,
    shuffle: dataset.shuffle ?? initialDatasetForm.shuffle,
    pinMemory: dataset.pinMemory ?? initialDatasetForm.pinMemory,
    dropLast: dataset.dropLast ?? initialDatasetForm.dropLast,
    prefetchFactor: dataset.prefetchFactor ?? initialDatasetForm.prefetchFactor,
    persistentWorkers:
      dataset.persistentWorkers ?? initialDatasetForm.persistentWorkers,
  };
}

export function isDatasetTerminal(status: ConfigStatus): boolean {
  return status === ConfigStatus.READY || status === ConfigStatus.FAILED;
}
