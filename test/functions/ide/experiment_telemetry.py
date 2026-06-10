from utils.http import get


def experiment_telemetry(experiment_id: str):
    """
    GET /api/v1/experiment/{id}/telemetry
    """

    url = f"/api/v1/experiment/{experiment_id}/telemetry"
    data = get(url)
    return data
