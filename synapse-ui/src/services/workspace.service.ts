import { WorkspaceEntry, WorkspaceForm } from "@/features/workspace/workspace.model";

import { WorkspaceConnectionResponse } from "@/types/api/workspace.api.types";
import { postLocalApi } from "@/services/_helpers/api-client";
import { ServiceResult } from "@/types/service.types";

export async function connectWorkspace(form: WorkspaceForm): Promise<ServiceResult<WorkspaceEntry>> {
    const result = await postLocalApi<WorkspaceForm, WorkspaceConnectionResponse>(
        "/api/workspace/connect",
        form,
        "Unable to reach workspace runtime.",
    );

    if (result.error || result.data == null) {
        return {
            data: null,
            error: result.error ?? "Failed to connect workspace.",
        };
    }

    return {
        data: {
            id: result.data.workspaceId,
            memberId: result.data.memberId,
            username: result.data.username,
            transportURL: form.transportURL,
            workspaceName: result.data.workspaceName,
            lastConnected: Date.now(),
        },
        error: null,
    };
}

export async function disconnectWorkspace(): Promise<void> {
    await fetch("/api/workspace/disconnect", {
        method: "POST",
    });
}
