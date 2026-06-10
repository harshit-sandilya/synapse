from torchvision import datasets
from torchvision.transforms import ToTensor


class DatasetFactory:

    @staticmethod
    def create(
        dataset_name: str,
        root: str,
        train: bool,
    ):
        dataset_cls = getattr(
            datasets,
            dataset_name,
        )

        return dataset_cls(
            root=root,
            train=train,
            download=True,
            transform=ToTensor(),
        )
