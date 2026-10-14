"""Initial IssueFlow schema.

Revision ID: 001
Revises:
Create Date: 2026-10-13 22:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("repository_owner", sa.String(length=150), nullable=True),
        sa.Column("repository_name", sa.String(length=150), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )
    op.create_index(op.f("ix_projects_id"), "projects", ["id"], unique=False)

    op.create_table(
        "sprints",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("goal", sa.String(length=1000), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("status", sa.Enum("Planned", "Current", "Upcoming", "Completed", name="sprintstatus"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_sprints_id"), "sprints", ["id"], unique=False)
    op.create_index(op.f("ix_sprints_project_id"), "sprints", ["project_id"], unique=False)

    op.create_table(
        "issues",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=5000), nullable=True),
        sa.Column("status", sa.Enum("Backlog", "To Do", "In Progress", "Done", name="issuestatus"), nullable=False),
        sa.Column("priority", sa.Enum("Low", "Medium", "High", "Critical", name="issuepriority"), nullable=False),
        sa.Column("issue_type", sa.Enum("Bug", "Feature", "Task", name="issuetype"), nullable=False),
        sa.Column("assignee", sa.String(length=120), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("sprint_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("closed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sprint_id"], ["sprints.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_issues_id"), "issues", ["id"], unique=False)
    op.create_index(op.f("ix_issues_project_id"), "issues", ["project_id"], unique=False)
    op.create_index(op.f("ix_issues_sprint_id"), "issues", ["sprint_id"], unique=False)

    op.create_table(
        "issue_labels",
        sa.Column("issue_id", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(["issue_id"], ["issues.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("issue_id", "label"),
    )

    op.create_table(
        "activity_events",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("issue_id", sa.Integer(), nullable=True),
        sa.Column("sprint_id", sa.Integer(), nullable=True),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("message", sa.String(length=500), nullable=False),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["issue_id"], ["issues.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["sprint_id"], ["sprints.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_activity_events_id"), "activity_events", ["id"], unique=False)
    op.create_index(op.f("ix_activity_events_project_id"), "activity_events", ["project_id"], unique=False)
    op.create_index(op.f("ix_activity_events_event_type"), "activity_events", ["event_type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_activity_events_event_type"), table_name="activity_events")
    op.drop_index(op.f("ix_activity_events_project_id"), table_name="activity_events")
    op.drop_index(op.f("ix_activity_events_id"), table_name="activity_events")
    op.drop_table("activity_events")
    op.drop_table("issue_labels")
    op.drop_index(op.f("ix_issues_sprint_id"), table_name="issues")
    op.drop_index(op.f("ix_issues_project_id"), table_name="issues")
    op.drop_index(op.f("ix_issues_id"), table_name="issues")
    op.drop_table("issues")
    op.drop_index(op.f("ix_sprints_project_id"), table_name="sprints")
    op.drop_index(op.f("ix_sprints_id"), table_name="sprints")
    op.drop_table("sprints")
    op.drop_index(op.f("ix_projects_id"), table_name="projects")
    op.drop_table("projects")
