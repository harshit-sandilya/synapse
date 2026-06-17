import type { DatasetProvider } from "../../enums/transport.enums";

export interface SaveDatasetConfigRequest {
  experimentId: string;
  provider: DatasetProvider;
  datasetName: string;
  batchSize: number;
  numWorkers: number;
  shuffle: boolean;
  pinMemory: boolean;
  dropLast: boolean;
  prefetchFactor: number;
  persistentWorkers: boolean;
}
