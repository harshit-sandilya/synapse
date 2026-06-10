import json
from pathlib import Path


class StateManager:
    def __init__(self, path: str = "state.json"):
        self.path = Path(path)

        if self.path.exists():
            with open(self.path, "r") as f:
                self._data = json.load(f)
        else:
            self._data = {}

    def _save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)

        with open(self.path, "w") as f:
            json.dump(self._data, f, indent=2)

    def get(self, key: str, default=None):
        return self._data.get(key, default)

    def require(self, key: str):
        value = self.get(key)

        if value is None:
            raise KeyError(f"Required state key '{key}' not found.")

        return value

    def set(self, key, value=None):
        if isinstance(key, dict):
            self._data.update(key)
        else:
            self._data[key] = value

        self._save()

    def delete(self, key: str):
        if key in self._data:
            del self._data[key]
            self._save()

    def clear(self):
        self._data = {}
        self._save()

    def exists(self, key: str) -> bool:
        return key in self._data

    def all(self) -> dict:
        return dict(self._data)

    def pretty_print(self):
        print(json.dumps(self._data, indent=2))
