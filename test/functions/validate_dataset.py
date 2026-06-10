from utils.http import post


def validate_dataset(experiment_id: str):
    """
    POST /api/v1/dataset/validate
    """

    payload = {"experimentId": experiment_id}
    data = post("/api/v1/dataset/validate", payload)

    return data
