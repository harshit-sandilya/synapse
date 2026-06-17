from __future__ import annotations

import json
import time
from dataclasses import dataclass
from typing import Iterator

import requests


@dataclass
class SSEEvent:
    event: str
    data: str
    received_at_ms: float


def iter_sse(
    url: str, *, cookies: dict[str, str] | None = None, timeout_seconds: float = 5.0
) -> Iterator[SSEEvent]:
    with requests.get(
        url, cookies=cookies, stream=True, timeout=(5.0, timeout_seconds)
    ) as response:
        response.raise_for_status()

        event_name = "message"
        data_lines: list[str] = []

        for raw_line in response.iter_lines(decode_unicode=True):
            if raw_line is None:
                continue

            line = raw_line.strip("\r")
            if not line:
                if data_lines:
                    yield SSEEvent(
                        event=event_name,
                        data="\n".join(data_lines),
                        received_at_ms=time.time() * 1000.0,
                    )
                event_name = "message"
                data_lines = []
                continue

            if line.startswith(":"):
                continue
            if line.startswith("event:"):
                event_name = line.split(":", 1)[1].strip()
                continue
            if line.startswith("data:"):
                data_lines.append(line.split(":", 1)[1].strip())


def decode_json_event(event: SSEEvent) -> dict:
    return json.loads(event.data)
