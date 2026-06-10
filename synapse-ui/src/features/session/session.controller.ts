import { StateCreator } from "zustand";

import {
  initialSessionForm,
  SessionData,
  SessionEntry,
} from "@/features/session/session.model";

export interface SessionActions {
  handleSessionFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  connectToNewSession: (e: React.SubmitEvent<HTMLFormElement>) => void;
  connectToSavedSession: (id: string) => void;
  getSessionInfo: () => SessionEntry | undefined;
  disconnectSession: () => void;
}

export const createSessionController: StateCreator<
  SessionData & SessionActions,
  [],
  [],
  SessionActions
> = (set, get) => ({
  handleSessionFormChange: (e) => {
    const { name, value } = e.target;
    set((state) => ({
      sessionForm: {
        ...state.sessionForm,
        [name]: value,
      },
    }));
  },

  connectToNewSession: (e) => {
    e.preventDefault();
    const { sessionForm } = get();

    const newSession: SessionEntry = {
      id: crypto.randomUUID(),
      username: sessionForm.username.trim(),
      runtimeURL: sessionForm.runtimeURL.trim(),
      runtimeName: sessionForm.runtimeName.trim(),
      lastConnected: Date.now(),
    };

    set((state) => ({
      sessionForm: initialSessionForm,
      currentSession: newSession,
      savedSessions: [newSession, ...state.savedSessions],
    }));
  },

  connectToSavedSession: (id) => {
    const { savedSessions } = get();
    const selectedSession = savedSessions.find((session) => session.id === id);

    if (!selectedSession) {
      console.warn(`[SessionController] Session with id "${id}" not found.`);
      return;
    }

    const updatedSession: SessionEntry = {
      ...selectedSession,
      lastConnected: Date.now(),
    };
    const updatedSessions = savedSessions.map((session) =>
      session.id === id ? updatedSession : session,
    );

    set({
      currentSession: updatedSession,
      savedSessions: updatedSessions,
    });
  },

  getSessionInfo: () => {
    return get().currentSession;
  },

  disconnectSession: () => {
    const { currentSession } = get();
    if (currentSession == undefined) {
      return;
    }

    set({
      currentSession: undefined,
    });
  },
});
