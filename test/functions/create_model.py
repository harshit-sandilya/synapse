from utils.http import post


def create_model(
    experimentId: str,
    modelIr: dict,
    learningRate: float,
    epochs: int,
    optimizer: str = "ADAM",
    lossFunction: str = "CROSS_ENTROPY",
):
    """
    POST /api/v1/model
    """

    payload = {
        "experimentId": experimentId,
        "modelIr": modelIr,
        "learningRate": learningRate,
        "epochs": epochs,
        "optimizer": optimizer,
        "lossFunction": lossFunction,
    }
    data = post("/api/v1/model", payload)

    return data
