from utils.http import get


def experiment_home(experiment_id: str):
    """
    GET /api/v1/experiment/{id}
    """

    url = f"/api/v1/experiment/{experiment_id}"
    data = get(url)
    return data
