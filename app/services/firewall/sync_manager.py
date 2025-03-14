from app.models import Device
from app.services.firewall.system_info import sync_system_info
from app.services.firewall.policies import sync_firewall_policies
from app.services.firewall.network_objects import sync_network_objects, sync_network_groups
from app.services.firewall.service_objects import sync_service_objects, sync_service_groups
from app.services.firewall.usage_logs import sync_usage_logs

def sync_all(device_id):
    """방화벽의 모든 정보를 동기화합니다.
    
    Args:
        device_id: 장비 ID
        
    Returns:
        tuple: (success, results)
    """
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
    
    # 정책 사용 이력 동기화 (기본 30일)
    success, message = sync_usage_logs(device_id, days=30)
    results.append({"type": "usage_logs", "success": success, "message": message})
    
    # 전체 결과 확인
    all_success = all(result["success"] for result in results)
    
    return all_success, results 