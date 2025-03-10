"""Add firewall module related tables

Revision ID: firewall_module_tables
Revises: c6c0c885bef6
Create Date: 2023-03-10 05:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.exc import OperationalError

# revision identifiers, used by Alembic.
revision = 'firewall_module_tables'
down_revision = 'c6c0c885bef6'
branch_labels = None
depends_on = None

def table_exists(table_name):
    """테이블이 존재하는지 확인"""
    try:
        op.execute(f"SELECT 1 FROM {table_name} LIMIT 1")
        return True
    except:
        return False

def upgrade():
    # FirewallSystemInfo 테이블 생성
    if not table_exists('firewall_system_info'):
        op.create_table('firewall_system_info',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('device_id', sa.Integer(), nullable=False),
            sa.Column('hostname', sa.String(100), nullable=True, comment='호스트명'),
            sa.Column('model', sa.String(100), nullable=True, comment='모델명'),
            sa.Column('version', sa.String(100), nullable=True, comment='소프트웨어 버전'),
            sa.Column('uptime', sa.String(100), nullable=True, comment='가동 시간'),
            sa.Column('ip_address', sa.String(100), nullable=True, comment='IP 주소 (PaloAlto)'),
            sa.Column('mac_address', sa.String(100), nullable=True, comment='MAC 주소 (PaloAlto)'),
            sa.Column('serial_number', sa.String(100), nullable=True, comment='시리얼 번호 (PaloAlto)'),
            sa.Column('app_version', sa.String(100), nullable=True, comment='앱 버전 (PaloAlto)'),
            sa.Column('status', sa.String(100), nullable=True, comment='상태 (Mock)'),
            sa.Column('last_sync_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['device_id'], ['device.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('device_id')
        )
    
    # FirewallPolicy 테이블 생성
    if not table_exists('firewall_policy'):
        op.create_table('firewall_policy',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('device_id', sa.Integer(), nullable=False),
            sa.Column('rule_name', sa.String(100), nullable=False, comment='규칙 이름'),
            sa.Column('seq', sa.Integer(), nullable=True, comment='규칙 순서'),
            sa.Column('enable', sa.String(10), nullable=True, comment='활성화 여부(Y/N)'),
            sa.Column('action', sa.String(20), nullable=True, comment='동작(allow, deny 등)'),
            sa.Column('source', sa.Text(), nullable=True, comment='출발지'),
            sa.Column('destination', sa.Text(), nullable=True, comment='목적지'),
            sa.Column('service', sa.Text(), nullable=True, comment='서비스'),
            sa.Column('description', sa.Text(), nullable=True, comment='설명'),
            sa.Column('user', sa.Text(), nullable=True, comment='사용자 (PaloAlto, NGF, MF2, Mock)'),
            sa.Column('application', sa.Text(), nullable=True, comment='애플리케이션 (PaloAlto, NGF, MF2, Mock)'),
            sa.Column('vsys', sa.String(20), nullable=True, comment='가상 시스템 (PaloAlto)'),
            sa.Column('security_profile', sa.Text(), nullable=True, comment='보안 프로필 (PaloAlto)'),
            sa.Column('category', sa.Text(), nullable=True, comment='카테고리 (PaloAlto)'),
            sa.Column('last_hit_date', sa.String(50), nullable=True, comment='마지막 사용 일시'),
            sa.Column('unused_days', sa.Integer(), nullable=True, comment='미사용 일수'),
            sa.Column('usage_status', sa.String(20), nullable=True, comment='미사용여부(사용/미사용)'),
            sa.Column('firewall_type', sa.String(20), nullable=False, comment='방화벽 타입(paloalto, mf2, ngf, mock)'),
            sa.Column('last_sync_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['device_id'], ['device.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    
    # FirewallNetworkObject 테이블 생성
    if not table_exists('firewall_network_object'):
        op.create_table('firewall_network_object',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('device_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(100), nullable=False, comment='객체 이름'),
            sa.Column('type', sa.String(20), nullable=False, comment='객체 타입(ip-netmask, ip-range, fqdn 등)'),
            sa.Column('value', sa.Text(), nullable=False, comment='객체 값'),
            sa.Column('firewall_type', sa.String(20), nullable=False, comment='방화벽 타입(paloalto, mf2, ngf, mock)'),
            sa.Column('last_sync_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['device_id'], ['device.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    
    # FirewallNetworkGroup 테이블 생성
    if not table_exists('firewall_network_group'):
        op.create_table('firewall_network_group',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('device_id', sa.Integer(), nullable=False),
            sa.Column('group_name', sa.String(100), nullable=False, comment='그룹 이름'),
            sa.Column('entry', sa.Text(), nullable=False, comment='멤버 목록(콤마로 구분)'),
            sa.Column('firewall_type', sa.String(20), nullable=False, comment='방화벽 타입(paloalto, mf2, ngf, mock)'),
            sa.Column('last_sync_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['device_id'], ['device.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    
    # FirewallServiceObject 테이블 생성
    if not table_exists('firewall_service_object'):
        op.create_table('firewall_service_object',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('device_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(100), nullable=False, comment='객체 이름'),
            sa.Column('protocol', sa.String(20), nullable=False, comment='프로토콜(tcp, udp, icmp 등)'),
            sa.Column('port', sa.String(100), nullable=True, comment='포트 정보'),
            sa.Column('firewall_type', sa.String(20), nullable=False, comment='방화벽 타입(paloalto, mf2, ngf, mock)'),
            sa.Column('last_sync_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['device_id'], ['device.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    
    # FirewallServiceGroup 테이블 생성
    if not table_exists('firewall_service_group'):
        op.create_table('firewall_service_group',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('device_id', sa.Integer(), nullable=False),
            sa.Column('group_name', sa.String(100), nullable=False, comment='그룹 이름'),
            sa.Column('entry', sa.Text(), nullable=False, comment='멤버 목록(콤마로 구분)'),
            sa.Column('firewall_type', sa.String(20), nullable=False, comment='방화벽 타입(paloalto, mf2, ngf, mock)'),
            sa.Column('last_sync_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['device_id'], ['device.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    
    # SyncHistory 테이블 생성
    if not table_exists('sync_history'):
        op.create_table('sync_history',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('device_id', sa.Integer(), nullable=False),
            sa.Column('sync_type', sa.String(50), nullable=False, comment='동기화 유형(security_rules, network_objects 등)'),
            sa.Column('status', sa.String(20), nullable=False, comment='상태(success, failed)'),
            sa.Column('message', sa.Text(), nullable=True, comment='결과 메시지'),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['device_id'], ['device.id'], ),
            sa.PrimaryKeyConstraint('id')
        )

def downgrade():
    try:
        op.drop_table('sync_history')
    except:
        pass
    
    try:
        op.drop_table('firewall_service_group')
    except:
        pass
    
    try:
        op.drop_table('firewall_service_object')
    except:
        pass
    
    try:
        op.drop_table('firewall_network_group')
    except:
        pass
    
    try:
        op.drop_table('firewall_network_object')
    except:
        pass
    
    try:
        op.drop_table('firewall_policy')
    except:
        pass
    
    try:
        op.drop_table('firewall_system_info')
    except:
        pass 