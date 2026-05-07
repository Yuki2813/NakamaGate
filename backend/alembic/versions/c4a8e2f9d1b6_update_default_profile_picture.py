"""update default profile picture to cloudinary url

Revision ID: c4a8e2f9d1b6
Revises: 1b637cdc522f
Create Date: 2026-05-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'c4a8e2f9d1b6'
down_revision: Union[str, Sequence[str], None] = '1b637cdc522f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


OLD_DEFAULT = "/static/profile_pics/default.jpg"
NEW_DEFAULT = "https://res.cloudinary.com/dlalpfup4/image/upload/v1776712618/default_ysnuey.jpg"


def upgrade() -> None:
    """Migra usuarios con la foto por defecto antigua a la URL nueva de Cloudinary.
    Los usuarios que ya hayan subido su propia foto NO se tocan."""
    op.execute(
        f"UPDATE users SET picture = '{NEW_DEFAULT}' WHERE picture = '{OLD_DEFAULT}'"
    )


def downgrade() -> None:
    """Revierte solo los usuarios con la URL nueva por defecto al path antiguo."""
    op.execute(
        f"UPDATE users SET picture = '{OLD_DEFAULT}' WHERE picture = '{NEW_DEFAULT}'"
    )
