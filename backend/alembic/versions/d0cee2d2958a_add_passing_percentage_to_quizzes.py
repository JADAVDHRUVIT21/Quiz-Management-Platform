"""add passing percentage to quizzes

Revision ID: d0cee2d2958a
Revises: 80d86f4ca146
Create Date: 2026-08-08
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Revision identifiers, used by Alembic.
revision: str = "d0cee2d2958a"
down_revision: Union[str, Sequence[str], None] = "80d86f4ca146"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add passing_percentage to existing quizzes.

    Existing quizzes will receive 50 as the passing percentage.
    """

    op.add_column(
        "quizzes",
        sa.Column(
            "passing_percentage",
            sa.Integer(),
            nullable=False,
            server_default="50"
        )
    )

    # Remove the database-level default after existing
    # records have been populated.
    op.alter_column(
        "quizzes",
        "passing_percentage",
        server_default=None
    )


def downgrade() -> None:
    """
    Remove passing_percentage if the migration is rolled back.
    """

    op.drop_column(
        "quizzes",
        "passing_percentage"
    )