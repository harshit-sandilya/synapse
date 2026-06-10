from utils.http import post


def run_training(experimentId: str):
    """
    POST /api/v1/model/train
    """

    payload = {"experimentId": experimentId}
    data = post("/api/v1/model/train", payload)

    return data
