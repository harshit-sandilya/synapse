from minio import Minio
import tempfile
import json
import os
from infrastructure.storage.object_storage import ObjectStorage
from config.runtime_properties import runtime_properties
from common.logging.logger import get_logger

logger = get_logger(__name__)


class MinioObjectStorage(ObjectStorage):

    def __init__(self):

        self.endpoint = runtime_properties.minio_endpoint.replace(
            "http://", ""
        ).replace("https://", "")

        self._client: Minio | None = None
        self._pid = None

        self.bucket = runtime_properties.minio_bucket

    @property
    def client(self) -> Minio:
        if self._client is None:
            self._client = Minio(
                self.endpoint,
                access_key=runtime_properties.minio_access_key,
                secret_key=runtime_properties.minio_secret_key,
                secure=False,
            )
        return self._client

    def upload_file(self, object_name: str, file_path: str) -> None:
        self.client.fput_object(
            self.bucket,
            object_name,
            file_path,
        )

    def download_file(self, object_name: str, file_path: str) -> None:
        self.client.fget_object(
            self.bucket,
            object_name,
            file_path,
        )

    def list_objects(self, prefix: str) -> list[str]:
        return [
            obj.object_name
            for obj in self.client.list_objects(
                self.bucket,
                prefix=prefix,
                recursive=True,
            )
        ]

    def delete_object(self, object_name: str):
        self.client.remove_object(
            self.bucket,
            object_name,
        )

    def delete_prefix(self, prefix: str):
        objects = self.client.list_objects(
            self.bucket,
            prefix=prefix,
            recursive=True,
        )
        for obj in objects:
            self.client.remove_object(
                self.bucket,
                obj.object_name,
            )

    def exists(self, object_name: str) -> bool:
        try:
            self.client.stat_object(
                self.bucket,
                object_name,
            )
            return True

        except Exception:
            return False

    def get_json(self, object_name: str):

        with tempfile.NamedTemporaryFile() as tmp:

            self.download_file(
                object_name,
                tmp.name,
            )

            return json.load(open(tmp.name))
