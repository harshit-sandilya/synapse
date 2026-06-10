# mnist_sj/logger.py

import json
from pathlib import Path
from datetime import datetime


class ExperimentLogger:

    def __init__(
        self,
        experiment_dir: str = "experiments",
        experiment_name: str | None = None,
    ):

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        if experiment_name is None:
            experiment_name = f"exp_{timestamp}"

        self.experiment_path = Path(experiment_dir) / experiment_name

        self.experiment_path.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.metrics_file = self.experiment_path / "metrics.jsonl"

    def log(self, data: dict):

        with open(
            self.metrics_file,
            "a",
        ) as f:

            json.dump(data, f)

            f.write("\n")

    def get_experiment_path(self):

        return self.experiment_path
