from ast import literal_eval

from pydantic import BaseModel

from common.enums.task_type import TaskType


class ValidationResult(BaseModel):
    valid: bool
    errors: list[str]


class ModelSanityChecker:

    def validate(
        self,
        model,
        output_shape: str,
        task_type: TaskType,
    ) -> ValidationResult:

        errors: list[str] = []

        expected_shape = tuple(literal_eval(output_shape))

        actual_shape = model.output_shape

        if actual_shape is None:
            errors.append("Model output shape is unknown")

            return ValidationResult(
                valid=False,
                errors=errors,
            )

        if task_type == TaskType.CLASSIFICATION:
            self._validate_classification(
                actual_shape,
                errors,
            )

        elif task_type == TaskType.REGRESSION:
            self._validate_regression(
                expected_shape,
                actual_shape,
                errors,
            )

        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
        )

    def _validate_classification(
        self,
        actual_shape: tuple,
        errors: list[str],
    ):

        if len(actual_shape) != 1:
            errors.append(
                f"Classification model must output "
                f"[B,C]. Got [B,{','.join(map(str, actual_shape))}]"
            )
            return

        num_outputs = actual_shape[0]

        if num_outputs < 2:
            errors.append(
                "Classification model must produce " "at least 2 output logits"
            )

    def _validate_regression(
        self,
        expected_shape: tuple,
        actual_shape: tuple,
        errors: list[str],
    ):

        #
        # Dataset validation stores shape including batch:
        #
        # [B]
        # [B,1]
        # [B,3]
        # [B,3,2]
        #
        expected_without_batch = expected_shape[1:]

        #
        # Scalar regression target.
        #
        if len(expected_without_batch) == 0:

            if actual_shape not in [
                tuple(),
                (1,),
            ]:
                errors.append(
                    f"Expected regression output "
                    f"shape [B] or [B,1], "
                    f"got [B,{','.join(map(str, actual_shape))}]"
                )

            return

        #
        # Multi-dimensional regression.
        #
        if tuple(actual_shape) != tuple(expected_without_batch):
            errors.append(
                f"Expected regression output "
                f"[B,{','.join(map(str, expected_without_batch))}] "
                f"but got "
                f"[B,{','.join(map(str, actual_shape))}]"
            )
