from functions import (
    connect_workspace,
    list_workspace_experiments,
    create_experiment,
    save_dataset_config,
    validate_dataset,
)
from utils.state import StateManager

state = StateManager()


def main():
    workspace = connect_workspace("test-workspace", "harshit")
    state.set(
        {
            "workspaceId": workspace["workspaceId"],
            "memberId": workspace["memberId"],
        }
    )
    list_workspace_experiments(state.get("workspaceId"))
    experiment = create_experiment(
        state.get("workspaceId"),
        state.get("memberId"),
        "MNIST Baseline",
        "CLASSIFICATION",
        "MNIST training experiment",
    )
    state.set("experimentId", experiment["id"])
    config = save_dataset_config(state.get("experimentId"), "PYTORCH", "MNIST")
    state.set("datasetConfigId", config["datasetConfigArtifactId"])
    validate_dataset(state.get("experimentId"))


if __name__ == "__main__":
    main()
