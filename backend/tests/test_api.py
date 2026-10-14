import os

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DATABASE_URL", "sqlite:///./issueflow_test.db")

from fastapi.testclient import TestClient

from backend.app.database import Base, engine
from backend.app.main import app

Base.metadata.create_all(bind=engine)
client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"


def test_project_and_issue_flow() -> None:
    project_response = client.post(
        "/api/v1/projects",
        json={
            "name": "IssueFlow Core",
            "description": "Core platform issues",
            "repository_owner": "acme",
            "repository_name": "issueflow-web",
        },
    )
    assert project_response.status_code == 201, project_response.text
    project = project_response.json()
    project_id = project["id"]

    issue_response = client.post(
        f"/api/v1/projects/{project_id}/issues",
        json={
            "title": "Fix login redirect",
            "description": "Resolve expired-token redirects.",
            "status": "In Progress",
            "priority": "Critical",
            "type": "Bug",
            "assignee": "Maya Chen",
            "labels": ["auth", "ui"],
            "due_date": "2026-10-20",
        },
    )
    assert issue_response.status_code == 201, issue_response.text
    issue = issue_response.json()
    assert issue["labels"] == ["auth", "ui"]
    assert issue["project_id"] == project_id

    list_response = client.get(f"/api/v1/projects/{project_id}/issues?status=In%20Progress&label=auth")
    assert list_response.status_code == 200, list_response.text
    assert len(list_response.json()) == 1

    dashboard_response = client.get(f"/api/v1/projects/{project_id}/dashboard")
    assert dashboard_response.status_code == 200, dashboard_response.text
    dashboard = dashboard_response.json()
    assert dashboard["issue_count"] >= 1
    assert dashboard["by_status"]["In Progress"] >= 1

    activity_response = client.get(f"/api/v1/projects/{project_id}/activity")
    assert activity_response.status_code == 200, activity_response.text
    assert len(activity_response.json()) >= 2


def test_invalid_filters_rejected() -> None:
    create_project = client.post(
        "/api/v1/projects",
        json={"name": "Filter validation"},
    )
    project_id = create_project.json()["id"]
    response = client.get(f"/api/v1/projects/{project_id}/issues?status=Invalid")
    assert response.status_code == 400


def test_delete_sprint_does_not_break_activity_fk() -> None:
    project = client.post(
        "/api/v1/projects",
        json={"name": "Sprint deletion validation", "description": "Confirm sprint deletion remains valid."},
    )
    project_id = project.json()["id"]

    sprint = client.post(
        f"/api/v1/projects/{project_id}/sprints",
        json={
            "name": "Sprint to delete",
            "goal": "Regression coverage",
            "start_date": "2026-11-01",
            "end_date": "2026-11-07",
            "status": "Current",
        },
    )
    sprint_id = sprint.json()["id"]

    issue = client.post(
        f"/api/v1/projects/{project_id}/issues",
        json={
            "title": "Issue linked to sprint",
            "description": "Ensure the delete path handles sprint-linked issues and activity rows.",
            "status": "In Progress",
            "priority": "Medium",
            "type": "Task",
            "labels": ["regression"],
        },
    )
    issue_id = issue.json()["id"]
    assert client.patch(f"/api/v1/issues/{issue_id}", json={"sprint_id": sprint_id}).status_code == 200

    delete_response = client.delete(f"/api/v1/sprints/{sprint_id}")
    assert delete_response.status_code == 204, delete_response.text
    assert client.get(f"/api/v1/issues/{issue_id}").json()["sprint_id"] is None
