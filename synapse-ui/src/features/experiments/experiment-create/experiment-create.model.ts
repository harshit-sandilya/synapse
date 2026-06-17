import { ExperimentTaskType } from "@/types/enums/transport.enums";

export interface ExperimentCreateForm {
  name: string;
  description: string;
  taskType: ExperimentTaskType;
}

export interface ExperimentCreateData {
  form: ExperimentCreateForm;
  submitting: boolean;
  error: string | null;
}

export const initialExperimentCreateForm: ExperimentCreateForm = {
  name: "",
  description: "",
  taskType: ExperimentTaskType.CLASSIFICATION,
};

export const initialExperimentCreateData: ExperimentCreateData = {
  form: initialExperimentCreateForm,
  submitting: false,
  error: null,
};
