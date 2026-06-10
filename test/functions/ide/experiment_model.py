from utils.http import get


def experiment_model(experiment_id: str):
    """
    GET /api/v1/experiment/{id}/model
    """

    url = f"/api/v1/experiment/{experiment_id}/model"
    data = get(url)
    return data
