from __future__ import annotations

import os
import time
import uuid
from typing import Any

import requests

from .models import build_three_layer_lif_model_ir

TRANSPORT_URL = os.getenv("SYNAPSE_TRANSPORT_URL", "http://localhost:8080")
UI_URL = os.getenv("SYNAPSE_UI_URL", "http://localhost:3000")
TRANSPORT_COOKIE_NAME = "synapse:transport"


class BenchmarkApiClient:
    def __init__(self, transport_url: str = TRANSPORT_URL, ui_url: str = UI_URL):
        self.transport_url = transport_url.rstrip("/")
        self.ui_url = ui_url.rstrip("/")
        self.session = requests.Session()

    def connect_workspace(self, workspace_name: str, username: str) -> dict[str, Any]:
        return self._post(
            "/api/v1/workspace/connect",
            {"workspaceName": workspace_name, "username": username},
        )

    def create_experiment(
        self,
        workspace_id: str,
        member_id: str,
        name: str,
        task_type: str = "CLASSIFICATION",
        description: str = "Benchmark experiment",
    ) -> dict[str, Any]:
        return self._post(
            "/api/v1/experiment",
            {
                "workspaceId": workspace_id,
                "memberId": member_id,
                "name": name,
                "description": description,
                "taskType": task_type,
            },
        )

    def save_dataset_config(
        self,
        experiment_id: str,
        *,
        batch_size: int,
        num_workers: int = 0,
    ) -> dict[str, Any]:
        return self._post(
            "/api/v1/dataset",
            {
                "experimentId": experiment_id,
                "provider": "PYTORCH",
                "datasetName": "MNIST",
                "batchSize": batch_size,
                "numWorkers": num_workers,
                "shuffle": True,
                "pinMemory": False,
                "dropLast": True,
                "prefetchFactor": 2,
                "persistentWorkers": False,
            },
        )

    def validate_dataset(self, experiment_id: str) -> dict[str, Any]:
        return self._post("/api/v1/dataset/validate", {"experimentId": experiment_id})

    def create_model(
        self,
        experiment_id: str,
        *,
        learning_rate: float,
        epochs: int,
        timesteps: int = 8,
    ) -> dict[str, Any]:
        model_ir = build_three_layer_lif_model_ir(timesteps=timesteps)
        return self._post(
            "/api/v1/model",
            {
                "experimentId": experiment_id,
                "modelIr": model_ir,
                "learningRate": learning_rate,
                "epochs": epochs,
                "optimizer": "ADAM",
                "lossFunction": "CROSS_ENTROPY",
            },
        )

    def run_training(self, experiment_id: str) -> dict[str, Any]:
        return self._post("/api/v1/model/train", {"experimentId": experiment_id})

    def experiment_home(self, experiment_id: str) -> dict[str, Any]:
        return self._get(f"/api/v1/experiment/{experiment_id}")

    def telemetry_sse_url(self, experiment_id: str) -> str:
        return f"{self.ui_url}/api/experiment/{experiment_id}/telemetry/stream"

    def ui_cookies(self) -> dict[str, str]:
        return {TRANSPORT_COOKIE_NAME: self.transport_url}

    def wait_for_status(
        self,
        experiment_id: str,
        *,
        field: str,
        expected: set[str],
        timeout_seconds: float = 900.0,
        poll_interval_seconds: float = 2.0,
    ) -> dict[str, Any]:
        deadline = time.time() + timeout_seconds
        while time.time() < deadline:
            payload = self.experiment_home(experiment_id)
            current = payload.get(field)
            if current in expected:
                return payload
            time.sleep(poll_interval_seconds)
        raise TimeoutError(
            f"Timed out waiting for {field} in {expected} for experiment {experiment_id}"
        )

    def prepare_training_experiment(
        self,
        *,
        workspace_id: str,
        member_id: str,
        batch_size: int,
        epochs: int,
        timesteps: int,
        name_prefix: str,
    ) -> dict[str, Any]:
        experiment = self.create_experiment(
            workspace_id=workspace_id,
            member_id=member_id,
            name=f"{name_prefix}-{uuid.uuid4().hex[:8]}",
        )
        experiment_id = experiment["experimentId"]
        self.save_dataset_config(experiment_id, batch_size=batch_size)
        self.validate_dataset(experiment_id)
        self.wait_for_status(
            experiment_id, field="datasetReady", expected={"READY", "FAILED"}
        )
        self.create_model(
            experiment_id, learning_rate=0.001, epochs=epochs, timesteps=timesteps
        )
        return experiment

    def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.session.post(
            f"{self.transport_url}{path}", json=payload, timeout=30
        )
        response.raise_for_status()
        body = response.json()
        return body.get("data", body)

    def _get(self, path: str) -> dict[str, Any]:
        response = self.session.get(f"{self.transport_url}{path}", timeout=30)
        response.raise_for_status()
        body = response.json()
        return body.get("data", body)
