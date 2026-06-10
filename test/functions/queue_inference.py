from utils.http import post


def queue_inference(experimentId: str, sampleNumber: int):
    """
    POST /api/v1/inference
    """

    payload = {"experimentId": experimentId, "sampleNumber": sampleNumber}
    data = post("/api/v1/inference", payload)

    return data
