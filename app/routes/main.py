from flask import Blueprint, render_template
from app.models.device import Device
from app.models.firewall import (
    FirewallPolicy, 
    FirewallNetworkObject, 
    FirewallNetworkGroup, 
    FirewallServiceObject, 
    FirewallServiceGroup
)
from sqlalchemy import func
from app import db

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
@main_bp.route('/dashboard')
def dashboard():
    # 장비 통계
    total_devices = Device.query.count()
    
    # 정책 통계
    total_policies = FirewallPolicy.query.count()
    active_policies = FirewallPolicy.query.filter(FirewallPolicy.enable == 'Y').count()
    inactive_policies = total_policies - active_policies
    allow_policies = FirewallPolicy.query.filter(FirewallPolicy.action.like('%allow%')).count()
    deny_policies = FirewallPolicy.query.filter(FirewallPolicy.action.like('%deny%')).count()
    
    # 객체 통계
    network_objects = FirewallNetworkObject.query.count()
    network_groups = FirewallNetworkGroup.query.count()
    service_objects = FirewallServiceObject.query.count()
    service_groups = FirewallServiceGroup.query.count()
    total_objects = network_objects + network_groups + service_objects + service_groups
    
    # 장비별 정책 및 객체 수 통계
    device_stats = []
    devices = Device.query.all()
    
    for device in devices:
        # 장비별 정책 수
        device_policies = FirewallPolicy.query.filter_by(device_id=device.id).count()
        
        # 장비별 활성/비활성 정책 수
        device_active_policies = FirewallPolicy.query.filter_by(device_id=device.id).filter(FirewallPolicy.enable == 'Y').count()
        device_inactive_policies = device_policies - device_active_policies
        
        # 장비별 허용/차단 정책 수
        device_allow_policies = FirewallPolicy.query.filter_by(device_id=device.id).filter(FirewallPolicy.action.like('%allow%')).count()
        device_deny_policies = FirewallPolicy.query.filter_by(device_id=device.id).filter(FirewallPolicy.action.like('%deny%')).count()
        
        # 장비별 객체 수
        device_network_objects = FirewallNetworkObject.query.filter_by(device_id=device.id).count()
        device_network_groups = FirewallNetworkGroup.query.filter_by(device_id=device.id).count()
        device_service_objects = FirewallServiceObject.query.filter_by(device_id=device.id).count()
        device_service_groups = FirewallServiceGroup.query.filter_by(device_id=device.id).count()
        device_total_objects = device_network_objects + device_network_groups + device_service_objects + device_service_groups
        
        device_stats.append({
            'id': device.id,
            'name': device.name,
            'category': device.category,
            'sub_category': device.sub_category,
            'policies': {
                'total': device_policies,
                'active': device_active_policies,
                'inactive': device_inactive_policies,
                'allow': device_allow_policies,
                'deny': device_deny_policies
            },
            'objects': {
                'total': device_total_objects,
                'network': device_network_objects,
                'network_group': device_network_groups,
                'service': device_service_objects,
                'service_group': device_service_groups
            }
        })
    
    # 대시보드 데이터
    dashboard_data = {
        'devices': {
            'total': total_devices
        },
        'policies': {
            'total': total_policies,
            'active': active_policies,
            'inactive': inactive_policies,
            'allow': allow_policies,
            'deny': deny_policies
        },
        'objects': {
            'total': total_objects,
            'network': network_objects,
            'network_group': network_groups,
            'service': service_objects,
            'service_group': service_groups
        },
        'device_stats': device_stats
    }
    
    return render_template('dashboard.html', data=dashboard_data)

@main_bp.route('/analysis')
def analysis():
    return render_template('analysis.html')

@main_bp.route('/scenarios')
def scenarios():
    return render_template('scenarios.html') 