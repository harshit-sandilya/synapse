export interface SessionForm {
  username: string;
  runtimeURL: string;
  runtimeName: string;
}

export interface SessionEntry extends SessionForm {
  id: string;
  lastConnected: number;
}

export const initialSessionForm: SessionForm = {
  username: "",
  runtimeURL: "",
  runtimeName: "",
};

export interface SessionData {
  sessionForm: SessionForm;
  currentSession?: SessionEntry;
  savedSessions: SessionEntry[];
}

export const initialSessionData: SessionData = {
  sessionForm: initialSessionForm,
  currentSession: undefined,
  savedSessions: [],
};
