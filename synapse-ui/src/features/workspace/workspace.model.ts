export interface WorkspaceForm {
    username: string;
    transportURL: string;
    workspaceName: string;
}

export interface WorkspaceEntry extends WorkspaceForm {
    id: string;
    memberId: string;
    lastConnected: number;
}

export const initialWorkspaceForm: WorkspaceForm = {
    username: "",
    transportURL: "",
    workspaceName: "",
};

export interface WorkspaceData {
    workspaceForm: WorkspaceForm;
    currentWorkspace?: WorkspaceEntry;
    savedWorkspaces: WorkspaceEntry[];
}

export const initialWorkspaceData: WorkspaceData = {
    workspaceForm: initialWorkspaceForm,
    currentWorkspace: undefined,
    savedWorkspaces: [],
};
