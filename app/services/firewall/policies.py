from app import db
from app.models import FirewallPolicy
from app.services.firewall.common import get_device_and_collector, create_sync_history, handle_sync_exception

def sync_firewall_policies(device_id, is_batch=False, batch_id=None):
    """방화벽 정책을 동기화합니다.
    
    Args:
        device_id: 장비 ID
        is_batch: 배치 동기화 여부
        batch_id: 배치 동기화 ID
        
    Returns:
        tuple: (success, message)
    """
    # 장비 및 수집기 가져오기
    device, collector, error = get_device_and_collector(device_id)
    if error:
        return False, error
    
    try:
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
        create_sync_history(
            device_id=device.id,
            sync_type='security_rules',
            status='success',
            message=f'{len(policies_df)} 개의 정책을 동기화했습니다.',
            is_batch=is_batch,
            batch_id=batch_id
        )
        db.session.commit()
        
        return True, f'{len(policies_df)} 개의 정책을 동기화했습니다.'
    
    except Exception as e:
        # 예외 처리 시에도 배치 정보 전달
        if is_batch and batch_id:
            return handle_sync_exception(device.id, 'security_rules', e, is_batch, batch_id)
        else:
            return handle_sync_exception(device.id, 'security_rules', e) 