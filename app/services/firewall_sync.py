from app import db
from app.models import (
    Device,
    FirewallSystemInfo,
    FirewallPolicy,
    FirewallNetworkObject,
    FirewallNetworkGroup,
    FirewallServiceObject,
    FirewallServiceGroup,
    SyncHistory
)
from app.firewall_module.collector_factory import FirewallCollectorFactory

def sync_system_info(device_id):
    """방화벽 시스템 정보를 동기화합니다."""
    device = Device.query.get(device_id)
    if not device or device.category != 'firewall':
        return False, "유효한 방화벽 장비가 아닙니다."
    
    try:
        # 방화벽 Collector 생성
        collector = FirewallCollectorFactory.get_collector(
            device.sub_category,
            **device.get_connection_config()
        )
        
        # 시스템 정보 가져오기
        system_info_df = collector.get_system_info()
        
        if system_info_df.empty:
            return False, "시스템 정보를 가져올 수 없습니다."
        
        # 기존 시스템 정보 조회 또는 새로 생성
        system_info = FirewallSystemInfo.query.filter_by(device_id=device.id).first()
        if not system_info:
            system_info = FirewallSystemInfo(device_id=device.id)
        
        # 시스템 정보 업데이트
        row = system_info_df.iloc[0]
        for column in system_info_df.columns:
            field_name = column.lower().replace('-', '_').replace(' ', '_')
            if hasattr(system_info, field_name):
                setattr(system_info, field_name, row.get(column))
        
        db.session.add(system_info)
        
        # 동기화 이력 저장
        sync_history = SyncHistory(
            device_id=device.id,
            sync_type='system_info',
            status='success',
            message='시스템 정보를 동기화했습니다.'
        )
        db.session.add(sync_history)
        db.session.commit()
        
        return True, '시스템 정보를 동기화했습니다.'
    
    except Exception as e:
        db.session.rollback()
        
        # 오류 이력 저장
        sync_history = SyncHistory(
            device_id=device.id,
            sync_type='system_info',
            status='failed',
            message=str(e)
        )
        db.session.add(sync_history)
        db.session.commit()
        
        return False, f'동기화 중 오류 발생: {str(e)}'

def sync_firewall_policies(device_id):
    """방화벽 정책을 동기화합니다."""
    device = Device.query.get(device_id)
    if not device or device.category != 'firewall':
        return False, "유효한 방화벽 장비가 아닙니다."
    
    try:
        # 방화벽 Collector 생성
        collector = FirewallCollectorFactory.get_collector(
            device.sub_category,
            **device.get_connection_config()
        )
        
        # 정책 가져오기
        policies_df = collector.export_security_rules()
        
        # 기존 정책 삭제
        FirewallPolicy.query.filter_by(device_id=device.id).delete()
        
        # 새 정책 저장
        for _, row in policies_df.iterrows():
            policy = FirewallPolicy(
                device_id=device.id,
                firewall_type=device.sub_category
            )
            
            # DataFrame의 컬럼을 모델 필드에 매핑
            for column in policies_df.columns:
                # 컬럼명을 필드명으로 변환 (예: 'Rule Name' -> 'rule_name')
                field_name = column.lower().replace(' ', '_')
                
                # 특수 케이스 처리
                if column == 'Rule Name':
                    policy.rule_name = row.get(column, '')
                elif hasattr(policy, field_name):
                    setattr(policy, field_name, row.get(column))
            
            db.session.add(policy)
        
        # 동기화 이력 저장
        sync_history = SyncHistory(
            device_id=device.id,
            sync_type='security_rules',
            status='success',
            message=f'{len(policies_df)} 개의 정책을 동기화했습니다.'
        )
        db.session.add(sync_history)
        db.session.commit()
        
        return True, f'{len(policies_df)} 개의 정책을 동기화했습니다.'
    
    except Exception as e:
        db.session.rollback()
        
        # 오류 이력 저장
        sync_history = SyncHistory(
            device_id=device.id,
            sync_type='security_rules',
            status='failed',
            message=str(e)
        )
        db.session.add(sync_history)
        db.session.commit()
        
        return False, f'동기화 중 오류 발생: {str(e)}'

def sync_network_objects(device_id):
    """방화벽 네트워크 객체를 동기화합니다."""
    device = Device.query.get(device_id)
    if not device or device.category != 'firewall':
        return False, "유효한 방화벽 장비가 아닙니다."
    
    try:
        # 방화벽 Collector 생성
        collector = FirewallCollectorFactory.get_collector(
            device.sub_category,
            **device.get_connection_config()
        )
        
        # 네트워크 객체 가져오기
        objects_df = collector.export_network_objects()
        
        # 기존 객체 삭제
        FirewallNetworkObject.query.filter_by(device_id=device.id).delete()
        
        # 새 객체 저장
        for _, row in objects_df.iterrows():
            obj = FirewallNetworkObject(
                device_id=device.id,
                firewall_type=device.sub_category,
                name=row.get('Name', ''),
                type=row.get('Type', ''),
                value=row.get('Value', '')
            )
            db.session.add(obj)
        
        # 동기화 이력 저장
        sync_history = SyncHistory(
            device_id=device.id,
            sync_type='network_objects',
            status='success',
            message=f'{len(objects_df)} 개의 네트워크 객체를 동기화했습니다.'
        )
        db.session.add(sync_history)
        db.session.commit()
        
        return True, f'{len(objects_df)} 개의 네트워크 객체를 동기화했습니다.'
    
    except Exception as e:
        db.session.rollback()
        
        # 오류 이력 저장
        sync_history = SyncHistory(
            device_id=device.id,
            sync_type='network_objects',
            status='failed',
            message=str(e)
        )
        db.session.add(sync_history)
        db.session.commit()
        
        return False, f'동기화 중 오류 발생: {str(e)}'

def sync_network_groups(device_id):
    """방화벽 네트워크 그룹 객체를 동기화합니다."""
    device = Device.query.get(device_id)
    if not device or device.category != 'firewall':
        return False, "유효한 방화벽 장비가 아닙니다."
    
    try:
        # 방화벽 Collector 생성
        collector = FirewallCollectorFactory.get_collector(
            device.sub_category,
            **device.get_connection_config()
        )
        
        # 네트워크 그룹 객체 가져오기
        groups_df = collector.export_network_group_objects()
        
        # 기존 그룹 삭제
        FirewallNetworkGroup.query.filter_by(device_id=device.id).delete()
        
        # 새 그룹 저장
        for _, row in groups_df.iterrows():
            group = FirewallNetworkGroup(
                device_id=device.id,
                firewall_type=device.sub_category,
                group_name=row.get('Group Name', ''),
                entry=row.get('Entry', '')
            )
            db.session.add(group)
        
        # 동기화 이력 저장
        sync_history = SyncHistory(
            device_id=device.id,
            sync_type='network_groups',
            status='success',
            message=f'{len(groups_df)} 개의 네트워크 그룹을 동기화했습니다.'
        )
        db.session.add(sync_history)
        db.session.commit()
        
        return True, f'{len(groups_df)} 개의 네트워크 그룹을 동기화했습니다.'
    
    except Exception as e:
        db.session.rollback()
        
        # 오류 이력 저장
        sync_history = SyncHistory(
            device_id=device.id,
            sync_type='network_groups',
            status='failed',
            message=str(e)
        )
        db.session.add(sync_history)
        db.session.commit()
        
        return False, f'동기화 중 오류 발생: {str(e)}'

def sync_service_objects(device_id):
    """방화벽 서비스 객체를 동기화합니다."""
    device = Device.query.get(device_id)
    if not device or device.category != 'firewall':
        return False, "유효한 방화벽 장비가 아닙니다."
    
    try:
        # 방화벽 Collector 생성
        collector = FirewallCollectorFactory.get_collector(
            device.sub_category,
            **device.get_connection_config()
        )
        
        # 서비스 객체 가져오기
        services_df = collector.export_service_objects()
        
        # 기존 객체 삭제
        FirewallServiceObject.query.filter_by(device_id=device.id).delete()
        
        # 새 객체 저장
        for _, row in services_df.iterrows():
            service = FirewallServiceObject(
                device_id=device.id,
                firewall_type=device.sub_category,
                name=row.get('Name', ''),
                protocol=row.get('Protocol', ''),
                port=row.get('Port', '')
            )
            db.session.add(service)
        
        # 동기화 이력 저장
        sync_history = SyncHistory(
            device_id=device.id,
            sync_type='service_objects',
            status='success',
            message=f'{len(services_df)} 개의 서비스 객체를 동기화했습니다.'
        )
        db.session.add(sync_history)
        db.session.commit()
        
        return True, f'{len(services_df)} 개의 서비스 객체를 동기화했습니다.'
    
    except Exception as e:
        db.session.rollback()
        
        # 오류 이력 저장
        sync_history = SyncHistory(
            device_id=device.id,
            sync_type='service_objects',
            status='failed',
            message=str(e)
        )
        db.session.add(sync_history)
        db.session.commit()
        
        return False, f'동기화 중 오류 발생: {str(e)}'

def sync_service_groups(device_id):
    """방화벽 서비스 그룹 객체를 동기화합니다."""
    device = Device.query.get(device_id)
    if not device or device.category != 'firewall':
        return False, "유효한 방화벽 장비가 아닙니다."
    
    try:
        # 방화벽 Collector 생성
        collector = FirewallCollectorFactory.get_collector(
            device.sub_category,
            **device.get_connection_config()
        )
        
        # 서비스 그룹 객체 가져오기
        groups_df = collector.export_service_group_objects()
        
        # 기존 그룹 삭제
        FirewallServiceGroup.query.filter_by(device_id=device.id).delete()
        
        # 새 그룹 저장
        for _, row in groups_df.iterrows():
            group = FirewallServiceGroup(
                device_id=device.id,
                firewall_type=device.sub_category,
                group_name=row.get('Group Name', ''),
                entry=row.get('Entry', '')
            )
            db.session.add(group)
        
        # 동기화 이력 저장
        sync_history = SyncHistory(
            device_id=device.id,
            sync_type='service_groups',
            status='success',
            message=f'{len(groups_df)} 개의 서비스 그룹을 동기화했습니다.'
        )
        db.session.add(sync_history)
        db.session.commit()
        
        return True, f'{len(groups_df)} 개의 서비스 그룹을 동기화했습니다.'
    
    except Exception as e:
        db.session.rollback()
        
        # 오류 이력 저장
        sync_history = SyncHistory(
            device_id=device.id,
            sync_type='service_groups',
            status='failed',
            message=str(e)
        )
        db.session.add(sync_history)
        db.session.commit()
        
        return False, f'동기화 중 오류 발생: {str(e)}'

def sync_usage_logs(device_id, days=30):
    """방화벽 정책 사용 이력을 동기화합니다."""
    device = Device.query.get(device_id)
    if not device or device.category != 'firewall':
        return False, "유효한 방화벽 장비가 아닙니다."
    
    try:
        # 방화벽 Collector 생성
        collector = FirewallCollectorFactory.get_collector(
            device.sub_category,
            **device.get_connection_config()
        )
        
        # 정책 사용 이력 가져오기
        usage_logs_df = collector.export_usage_logs(days=days)
        
        # 기존 정책 업데이트
        for _, row in usage_logs_df.iterrows():
            rule_name = row.get('Rule Name')
            if not rule_name:
                continue
                
            # 해당 정책 찾기
            policy = FirewallPolicy.query.filter_by(
                device_id=device.id,
                rule_name=rule_name
            ).first()
            
            if policy:
                # 사용 이력 업데이트
                policy.last_hit_date = row.get('Last Hit Date')
                policy.unused_days = row.get('Unused Days')
                policy.usage_status = row.get('미사용여부')
                db.session.add(policy)
        
        # 동기화 이력 저장
        sync_history = SyncHistory(
            device_id=device.id,
            sync_type='usage_logs',
            status='success',
            message=f'{len(usage_logs_df)} 개의 정책 사용 이력을 동기화했습니다.'
        )
        db.session.add(sync_history)
        db.session.commit()
        
        return True, f'{len(usage_logs_df)} 개의 정책 사용 이력을 동기화했습니다.'
    
    except Exception as e:
        db.session.rollback()
        
        # 오류 이력 저장
        sync_history = SyncHistory(
            device_id=device.id,
            sync_type='usage_logs',
            status='failed',
            message=str(e)
        )
        db.session.add(sync_history)
        db.session.commit()
        
        return False, f'동기화 중 오류 발생: {str(e)}'

def sync_all(device_id):
    """방화벽의 모든 정보를 동기화합니다."""
    device = Device.query.get(device_id)
    if not device or device.category != 'firewall':
        return False, "유효한 방화벽 장비가 아닙니다."
    
    results = []
    
    # 시스템 정보 동기화
    success, message = sync_system_info(device_id)
    results.append({"type": "system_info", "success": success, "message": message})
    
    # 정책 동기화
    success, message = sync_firewall_policies(device_id)
    results.append({"type": "policies", "success": success, "message": message})
    
    # 네트워크 객체 동기화
    success, message = sync_network_objects(device_id)
    results.append({"type": "network_objects", "success": success, "message": message})
    
    # 네트워크 그룹 동기화
    success, message = sync_network_groups(device_id)
    results.append({"type": "network_groups", "success": success, "message": message})
    
    # 서비스 객체 동기화
    success, message = sync_service_objects(device_id)
    results.append({"type": "service_objects", "success": success, "message": message})
    
    # 서비스 그룹 동기화
    success, message = sync_service_groups(device_id)
    results.append({"type": "service_groups", "success": success, "message": message})
    
    # 정책 사용 이력 동기화
    success, message = sync_usage_logs(device_id)
    results.append({"type": "usage_logs", "success": success, "message": message})
    
    # 전체 결과 확인
    all_success = all(result["success"] for result in results)
    
    return all_success, results 