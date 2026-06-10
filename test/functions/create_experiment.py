from utils.http import post


def create_experiment(
    workspace_id: str,
    member_id: str,
    name: str,
    task_type: str,
    description: str,
):
    """
    POST /api/v1/experiment
    """

    payload = {
        "workspaceId": workspace_id,
        "memberId": member_id,
        "name": name,
        "description": description,
        "taskType": task_type,
    }
    data = post("/api/v1/experiment", payload)

    return data
