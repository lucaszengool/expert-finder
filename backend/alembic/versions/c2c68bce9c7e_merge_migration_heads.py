"""merge_migration_heads

Revision ID: c2c68bce9c7e
Revises: 002, add_outreach_tables_001
Create Date: 2025-07-28 15:34:56.354344

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2c68bce9c7e'
down_revision: Union[str, None] = ('002', 'add_outreach_tables_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
