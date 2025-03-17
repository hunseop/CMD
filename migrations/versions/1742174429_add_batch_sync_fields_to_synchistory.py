"""Add batch sync fields to SyncHistory

Revision ID: 1742174429
Revises: firewall_module_tables
Create Date: 2023-03-17 01:20:29.123456

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1742174429'
down_revision = 'firewall_module_tables'
branch_labels = None
depends_on = None


def upgrade():
    # 배치 동기화 관련 필드 추가
    op.add_column('sync_history', sa.Column('is_batch', sa.Boolean(), nullable=True, default=False))
    op.add_column('sync_history', sa.Column('batch_id', sa.String(36), nullable=True))
    
    # 기존 데이터 업데이트
    op.execute("UPDATE sync_history SET is_batch = 0")


def downgrade():
    # 배치 동기화 관련 필드 제거
    op.drop_column('sync_history', 'batch_id')
    op.drop_column('sync_history', 'is_batch') 