from utils.http import get


def experiment_inference(experiment_id: str):
    """
    GET /api/v1/experiment/{id}/inference
    """

    url = f"/api/v1/experiment/{experiment_id}/inference"
    data = get(url)
    return data
