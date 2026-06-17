import type { ConfigStatus, DatasetProvider } from "../../enums/transport.enums";

export interface ExperimentDatasetResponse {
    experimentId: string;
    datasetStatus: ConfigStatus;
    provider: DatasetProvider | null;
    datasetName: string | null;
    trainSampleCount: number | null;
    testSampleCount: number | null;
    inputShape: string | null;
    outputShape: string | null;
    batchSize: number | null;
    numWorkers: number | null;
    shuffle: boolean | null;
    pinMemory: boolean | null;
    dropLast: boolean | null;
    prefetchFactor: number | null;
    persistentWorkers: boolean | null;
    lastValidationError: string | null;
}
