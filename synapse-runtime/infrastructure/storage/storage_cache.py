from pathlib import Path
from config.runtime_properties import runtime_properties
import shutil


class StorageCache:

    def __init__(self):
        self.root = Path(runtime_properties.runtime_cache_dir)
        self.root.mkdir(
            parents=True,
            exist_ok=True,
        )

    def resolve(self, key: str) -> Path:
        return self.root / key

    def ensure_parent(self, key: str) -> Path:
        path = self.resolve(key)
        path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )
        return path

    def remove(self, key: str):
        path = self.resolve(key)
        if not path.exists():
            return
        if path.is_dir():
            shutil.rmtree(path)
        else:
            path.unlink()

    def ensure_directory(self, key: str) -> Path:
        path = self.resolve(key)
        path.mkdir(
            parents=True,
            exist_ok=True,
        )

        return path
