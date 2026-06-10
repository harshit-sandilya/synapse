import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  initialSessionData,
  SessionData,
} from "@/features/session/session.model";

import {
  createSessionController,
  SessionActions,
} from "@/features/session/session.controller";

export const useSessionStore = create<SessionData & SessionActions>()(
  persist(
    (...a) => ({
      ...initialSessionData,
      ...createSessionController(...a),
    }),
    {
      name: "synapse:sessions",
    },
  ),
);
