import { StateCreator } from "zustand";

import {
  initialWorkspaceForm,
  WorkspaceData,
  WorkspaceEntry,
} from "@/features/workspace/workspace.model";
import {
  connectWorkspace,
  disconnectWorkspace as disconnectWorkspaceService,
} from "@/services/workspace.service";

export interface WorkspaceActions {
  handleWorkspaceFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  connectToNewWorkspace: () => Promise<string | null>;
  connectToSavedWorkspace: (id: string) => Promise<string | null>;
  getWorkspaceInfo: () => WorkspaceEntry | undefined;
  disconnectWorkspace: () => Promise<void>;
}

export const createWorkspaceController: StateCreator<
  WorkspaceData & WorkspaceActions,
  [],
  [],
  WorkspaceActions
> = (set, get) => ({
  handleWorkspaceFormChange: (e) => {
    const { name, value } = e.target;
    set((state) => ({
      workspaceForm: {
        ...state.workspaceForm,
        [name]: value,
      },
    }));
  },

  connectToNewWorkspace: async () => {
    const { workspaceForm } = get();

    const result = await connectWorkspace(workspaceForm);

    if (result.error || result.data == null) {
      return result.error ?? "Failed to connect workspace.";
    }
    const workspace = result.data;

    set((state) => ({
      workspaceForm: initialWorkspaceForm,
      currentWorkspace: workspace,
      savedWorkspaces: [
        workspace,
        ...state.savedWorkspaces.filter(
          (savedWorkspace) => savedWorkspace.id !== workspace.id,
        ),
      ],
    }));

    return null;
  },

  connectToSavedWorkspace: async (id) => {
    const { savedWorkspaces } = get();

    const selectedWorkspace = savedWorkspaces.find(
      (workspace) => workspace.id === id,
    );

    if (!selectedWorkspace) {
      return `Workspace with id "${id}" not found.`;
    }

    const result = await connectWorkspace(selectedWorkspace);

    if (result.error || result.data == null) {
      return result.error ?? "Failed to connect workspace.";
    }
    const workspace = result.data;
    const updatedWorkspaces = savedWorkspaces.map((savedWorkspace) =>
      savedWorkspace.id === id ? workspace : savedWorkspace,
    );

    set({
      currentWorkspace: workspace,
      savedWorkspaces: updatedWorkspaces,
    });

    return null;
  },

  getWorkspaceInfo: () => {
    return get().currentWorkspace;
  },

  disconnectWorkspace: async () => {
    const { currentWorkspace } = get();

    if (currentWorkspace == undefined) {
      return;
    }

    try {
      await disconnectWorkspaceService();
    } finally {
      set({
        currentWorkspace: undefined,
      });
    }
  },
});
