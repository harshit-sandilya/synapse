from utils.http import post


def save_dataset_config(
    experiment_id: str,
    provider: str = "PYTORCH",
    dataset_name: str = "MNIST",
):
    """
    POST /api/v1/dataset
    """

    payload = {
        "experimentId": experiment_id,
        "provider": provider,
        "datasetName": dataset_name,
        # defaults
        "batchSize": 16,
        "numWorkers": 4,
        "shuffle": True,
        "pinMemory": True,
        "dropLast": False,
        "prefetchFactor": 2,
        "persistentWorkers": True,
    }
    data = post("/api/v1/dataset", payload)

    return data
