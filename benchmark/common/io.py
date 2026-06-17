from __future__ import annotations

import json
import statistics
from datetime import datetime
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BENCHMARK_ROOT = PROJECT_ROOT / "benchmark"
RESULTS_ROOT = BENCHMARK_ROOT / "results"
DATA_ROOT = BENCHMARK_ROOT / ".data"


def timestamp_slug() -> str:
    return datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")


def ensure_directory(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def result_directory(name: str) -> Path:
    return ensure_directory(RESULTS_ROOT / name / timestamp_slug())


def write_json(path: Path, payload: dict[str, Any]) -> None:
    ensure_directory(path.parent)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


def sum_file_sizes(path: Path) -> int:
    if path.is_file():
        return path.stat().st_size

    total = 0
    for file_path in path.rglob("*"):
        if file_path.is_file():
            total += file_path.stat().st_size
    return total


def mean_std(values: list[float]) -> tuple[float, float]:
    if not values:
        return 0.0, 0.0

    if len(values) == 1:
        return values[0], 0.0

    return statistics.mean(values), statistics.stdev(values)


def percentile(values: list[float], percent: float) -> float:
    if not values:
        return 0.0

    ordered = sorted(values)

    if len(ordered) == 1:
        return ordered[0]

    rank = (len(ordered) - 1) * (percent / 100.0)
    lower = int(rank)
    upper = min(lower + 1, len(ordered) - 1)
    fraction = rank - lower
    return ordered[lower] + (ordered[upper] - ordered[lower]) * fraction
