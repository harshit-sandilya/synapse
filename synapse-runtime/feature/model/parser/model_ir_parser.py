from feature.model.dto.model_ir import ModelIR


class ModelIRParser:
    @staticmethod
    def parse(data: dict) -> ModelIR:
        return ModelIR.model_validate(data)
