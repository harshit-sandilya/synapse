from utils.http import get


def experiment_metrics(experiment_id: str):
    """
    GET /api/v1/experiment/{id}/metrics
    """

    url = f"/api/v1/experiment/{experiment_id}/metrics"
    data = get(url)
    return data
