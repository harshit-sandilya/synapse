from abc import ABC, abstractmethod


class ObjectStorage(ABC):

    @abstractmethod
    def upload_file(
        self,
        object_name: str,
        file_path: str,
    ) -> None:
        pass

    @abstractmethod
    def download_file(
        self,
        object_name: str,
        file_path: str,
    ) -> None:
        pass

    @abstractmethod
    def list_objects(
        self,
        prefix: str,
    ) -> list[str]:
        pass

    @abstractmethod
    def delete_object(
        self,
        object_name: str,
    ) -> None:
        pass

    @abstractmethod
    def delete_prefix(
        self,
        prefix: str,
    ) -> None:
        pass

    @abstractmethod
    def exists(
        self,
        object_name: str,
    ) -> bool:
        pass

    @abstractmethod
    def get_json(
        self,
        object_name: str,
    ) -> dict:
        pass
