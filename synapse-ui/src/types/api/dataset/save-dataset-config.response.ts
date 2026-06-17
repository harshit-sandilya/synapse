import type { DatasetProvider } from "../../enums/transport.enums";

export interface SaveDatasetConfigResponse {
  experimentId: string;
  provider: DatasetProvider;
  datasetName: string;
  datasetConfigArtifactId: string;
  batchSize: number;
  numWorkers: number;
  shuffle: boolean;
  pinMemory: boolean;
  dropLast: boolean;
  prefetchFactor: number;
  persistentWorkers: boolean;
}
