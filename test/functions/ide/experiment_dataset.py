from utils.http import get


def experiment_dataset(experiment_id: str):
    """
    GET /api/v1/experiment/{id}/dataset
    """

    url = f"/api/v1/experiment/{experiment_id}/dataset"
    data = get(url)
    return data
