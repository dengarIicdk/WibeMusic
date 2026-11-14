"""Access requests: an email asks for an account, the owner approves it by a link in a letter."""
from alembic import op
import sqlalchemy as sa

revision = "e5d9a3b7c104"
down_revision = "a3c8e5f17b92"
branch_labels = depends_on = None


def upgrade():
    op.create_table("access_requests",
                    sa.Column("id", sa.Integer(), nullable=False),
                    sa.Column("email", sa.String(length=320), nullable=False),
                    sa.Column("token_hash", sa.String(length=64), nullable=False),
                    sa.Column("status", sa.String(length=16), nullable=False),
                    sa.Column("created_at", sa.DateTime(), nullable=False),
                    sa.Column("decided_at", sa.DateTime(), nullable=True),
                    sa.Column("user_id", sa.Integer(), nullable=True),
                    sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
                    sa.PrimaryKeyConstraint("id"),
                    sa.UniqueConstraint("token_hash"))
    op.create_index("ix_access_requests_email", "access_requests", ["email"])
    op.create_index("ix_access_requests_created_at", "access_requests", ["created_at"])


def downgrade():
    op.drop_index("ix_access_requests_created_at", "access_requests")
    op.drop_index("ix_access_requests_email", "access_requests")
    op.drop_table("access_requests")
