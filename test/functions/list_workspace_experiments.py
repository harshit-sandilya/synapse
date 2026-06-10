from utils.http import get


def list_workspace_experiments(workspace_id: str):
    """
    GET /api/v1/workspace/{id}/experiments
    """

    url = f"/api/v1/workspace/{workspace_id}/experiments"
    data = get(url)
    return data
