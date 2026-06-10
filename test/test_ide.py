from functions.ide import (
    experiment_home,
    experiment_dataset,
    experiment_model,
    experiment_metrics,
    experiment_telemetry,
    experiment_inference,
)
from utils.state import StateManager

state = StateManager()


def main():
    experiment_id = state.get("experimentId")
    experiment_home(experiment_id)
    experiment_dataset(experiment_id)
    experiment_model(experiment_id)
    experiment_metrics(experiment_id)
    experiment_telemetry(experiment_id)
    experiment_inference(experiment_id)


if __name__ == "__main__":
    main()
