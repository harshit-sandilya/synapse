import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  initialWorkspaceData,
  WorkspaceData,
} from "@/features/workspace/workspace.model";

import {
  createWorkspaceController,
  WorkspaceActions,
} from "@/features/workspace/workspace.controller";

export const useWorkspaceStore = create<WorkspaceData & WorkspaceActions>()(
  persist(
    (...a) => ({
      ...initialWorkspaceData,
      ...createWorkspaceController(...a),
    }),
    {
      name: "synapse:workspaces",
    },
  ),
);
