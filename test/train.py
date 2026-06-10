from functions import create_model, run_training
from utils.state import StateManager

state = StateManager()


def build_mnist_model():
    return {
        "simulation": {
            "timesteps": 32,
        },
        "encoder": {
            "type": "poisson",
        },
        "surrogate": {
            "type": "atan",
        },
        "layers": [
            {
                "type": "Flatten",
            },
            {
                "type": "Linear",
                "out_features": 256,
                "neuron": {
                    "type": "LIF",
                    "tau": 2.0,
                    "detach_reset": True,
                },
            },
            {
                "type": "Linear",
                "out_features": 10,
                "neuron": {
                    "type": "LIF",
                    "tau": 2.0,
                    "detach_reset": True,
                },
            },
        ],
    }


def main():
    model = create_model(state.get("experimentId"), build_mnist_model(), 0.01, 5)
    state.set(
        {
            "modelIrArtifactId": model["modelIrArtifactId"],
            "trainingConfigArtifactId": model["trainingConfigArtifactId"],
            "modelIr": build_mnist_model(),
        }
    )
    run_training(state.get("experimentId"))


if __name__ == "__main__":
    main()
