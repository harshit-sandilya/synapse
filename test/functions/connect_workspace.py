from utils.http import post


def connect_workspace(workspace_name: str, username: str):
    """
    POST /api/v1/workspace/connect
    """
    payload = {"workspaceName": workspace_name, "username": username}
    response = post("/api/v1/workspace/connect", payload)
    return response
