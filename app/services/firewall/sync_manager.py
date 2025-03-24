from app import db
from app.models import Device, SyncHistory, SyncTask, SYNC_STATUS
from app.services.firewall.common import generate_batch_id
from app.services.firewall.sync_queue import SyncQueueService
from app.services.firewall.system_info import sync_system_info
from app.services.firewall.policies import sync_firewall_policies
from app.services.firewall.network_objects import sync_network_objects, sync_network_groups
from app.services.firewall.service_objects import sync_service_objects, sync_service_groups
from app.services.firewall.usage_logs import sync_usage_logs
import uuid
import logging

logger = logging.getLogger(__name__)

# 동기화 작업 타입 정의
SYNC_TYPES = {
    'SYSTEM_INFO': 'system_info',
    'POLICIES': 'policies',
    'NETWORK_OBJECTS': 'network_objects',
    'NETWORK_GROUPS': 'network_groups',
    'SERVICE_OBJECTS': 'service_objects',
    'SERVICE_GROUPS': 'service_groups',
    'USAGE_LOGS': 'usage_logs'
}

# 동기화 타입별 가중치 (진행률 계산용)
SYNC_WEIGHTS = {
    SYNC_TYPES['SYSTEM_INFO']: 5,      # 시스템 정보는 동기화가 비교적 빠름
    SYNC_TYPES['POLICIES']: 30,        # 정책은 많은 데이터를 처리
    SYNC_TYPES['NETWORK_OBJECTS']: 20, # 네트워크 객체는 중간 정도의 데이터 처리
    SYNC_TYPES['NETWORK_GROUPS']: 15,  # 네트워크 그룹은 중간 정도의 데이터 처리
    SYNC_TYPES['SERVICE_OBJECTS']: 15, # 서비스 객체는 중간 정도의 데이터 처리
    SYNC_TYPES['SERVICE_GROUPS']: 10,  # 서비스 그룹은 비교적 적은 데이터 처리
    SYNC_TYPES['USAGE_LOGS']: 5        # 사용 이력은 읽기 작업 위주로 비교적 빠름
}

def sync_all(device_id, days=90):
    """
    모든 항목 동기화 (큐에 작업 추가)
    
    Args:
        device_id (int): 장비 ID
        days (int): 사용 이력 조회 기간 (일)
        
    Returns:
        tuple: (성공 여부, 메시지)
    """
    try:
        # 장비 존재 여부 확인
        device = Device.query.get(device_id)
        if not device:
            return False, "존재하지 않는 장비입니다."
            
        # 지원하는 장비인지 확인
        if device.category != 'firewall':
            return False, f"'{device.category}' 타입 장비는 동기화를 지원하지 않습니다."
            
        # 모든 동기화 항목 리스트
        sync_types = [
            SYNC_TYPES['SYSTEM_INFO'],
            SYNC_TYPES['POLICIES'],
            SYNC_TYPES['NETWORK_OBJECTS'],
            SYNC_TYPES['NETWORK_GROUPS'],
            SYNC_TYPES['SERVICE_OBJECTS'],
            SYNC_TYPES['SERVICE_GROUPS'],
            SYNC_TYPES['USAGE_LOGS']
        ]
        
        # 배치 작업 ID 생성
        batch_id = str(uuid.uuid4())
        
        # 작업 생성
        success, result = SyncQueueService.create_task(
            device_id=device_id,
            sync_types=sync_types,
            task_name=f"{device.name} 전체 동기화",
            batch_id=batch_id,
            priority=1  # 높은 우선순위
        )
        
        if not success:
            return False, result
            
        return True, f"전체 동기화 작업이 큐에 추가되었습니다. (작업 ID: {result.id})"
            
    except Exception as e:
        logger.error(f"전체 동기화 작업 생성 중 오류 발생: {str(e)}")
        return False, f"전체 동기화 작업 생성 중 오류 발생: {str(e)}"

class SyncManager:
    """동기화 작업 관리자"""
    
    @classmethod
    def process_task(cls, task_id):
        """
        동기화 작업 처리
        
        Args:
            task_id (int): 작업 ID
            
        Returns:
            tuple: (성공 여부, 메시지)
        """
        # 작업 시작
        success, task = SyncQueueService.start_task(task_id)
        if not success:
            return False, task
        
        try:
            # 장비 정보 조회
            device = Device.query.get(task.device_id)
            if not device:
                SyncQueueService.complete_task(task_id, False, "존재하지 않는 장비입니다.")
                return False, "존재하지 않는 장비입니다."
                
            # 동기화 유형 목록 파싱
            sync_types = task.sync_types.split(',')
            
            # 전체 가중치 계산
            total_weight = sum(SYNC_WEIGHTS.get(sync_type, 10) for sync_type in sync_types)
            current_weight = 0
            
            # 배치 ID 생성 또는 사용
            batch_id = task.batch_id or str(uuid.uuid4())
            
            # 각 동기화 유형별 처리
            all_success = True
            
            for sync_type in sync_types:
                # 취소 확인
                updated_task = SyncTask.query.get(task_id)
                if updated_task.status == SYNC_STATUS['CANCELED']:
                    return False, "작업이 취소되었습니다."
                
                # 진행 상태 업데이트
                weight = SYNC_WEIGHTS.get(sync_type, 10)
                progress_start = int((current_weight / total_weight) * 100)
                
                # 현재 작업 유형 업데이트
                SyncQueueService.update_task_progress(
                    task_id=task_id,
                    progress=progress_start,
                    current_sync_type=sync_type,
                    message=f"{cls._get_sync_type_name(sync_type)} 동기화 중..."
                )
                
                # 동기화 수행
                success, message = cls._perform_sync(device.id, sync_type, batch_id)
                all_success = all_success and success
                
                # 현재 작업 가중치 반영
                current_weight += weight
                progress_end = int((current_weight / total_weight) * 100)
                
                # 진행 상태 업데이트
                SyncQueueService.update_task_progress(
                    task_id=task_id,
                    progress=progress_end,
                    current_sync_type=sync_type,
                    message=message
                )
            
            # 작업 완료 처리
            if all_success:
                SyncQueueService.complete_task(
                    task_id=task_id, 
                    success=True, 
                    message="모든 동기화 작업이 완료되었습니다."
                )
                return True, "모든 동기화 작업이 완료되었습니다."
            else:
                SyncQueueService.complete_task(
                    task_id=task_id, 
                    success=False, 
                    message="일부 동기화 작업 중 오류가 발생했습니다."
                )
                return False, "일부 동기화 작업 중 오류가 발생했습니다."
                
        except Exception as e:
            logger.error(f"동기화 작업 처리 중 오류 발생: {str(e)}")
            SyncQueueService.complete_task(
                task_id=task_id, 
                success=False, 
                message=f"동기화 작업 처리 중 오류 발생: {str(e)}"
            )
            return False, f"동기화 작업 처리 중 오류 발생: {str(e)}"
    
    @staticmethod
    def _perform_sync(device_id, sync_type, batch_id):
        """
        특정 유형의 동기화 수행
        
        Args:
            device_id (int): 장비 ID
            sync_type (str): 동기화 유형
            batch_id (str): 배치 ID
            
        Returns:
            tuple: (성공 여부, 메시지)
        """
        is_batch = True
        
        if sync_type == SYNC_TYPES['SYSTEM_INFO']:
            return sync_system_info(device_id, is_batch=is_batch, batch_id=batch_id)
            
        elif sync_type == SYNC_TYPES['POLICIES']:
            return sync_firewall_policies(device_id, is_batch=is_batch, batch_id=batch_id)
            
        elif sync_type == SYNC_TYPES['NETWORK_OBJECTS']:
            return sync_network_objects(device_id, is_batch=is_batch, batch_id=batch_id)
            
        elif sync_type == SYNC_TYPES['NETWORK_GROUPS']:
            return sync_network_groups(device_id, is_batch=is_batch, batch_id=batch_id)
            
        elif sync_type == SYNC_TYPES['SERVICE_OBJECTS']:
            return sync_service_objects(device_id, is_batch=is_batch, batch_id=batch_id)
            
        elif sync_type == SYNC_TYPES['SERVICE_GROUPS']:
            return sync_service_groups(device_id, is_batch=is_batch, batch_id=batch_id)
            
        elif sync_type == SYNC_TYPES['USAGE_LOGS']:
            return sync_usage_logs(device_id, days=90, is_batch=is_batch, batch_id=batch_id)
            
        return False, f"알 수 없는 동기화 유형: {sync_type}"
    
    @staticmethod
    def _get_sync_type_name(sync_type):
        """
        동기화 유형의 한글 이름 반환
        
        Args:
            sync_type (str): 동기화 유형
            
        Returns:
            str: 한글 이름
        """
        names = {
            SYNC_TYPES['SYSTEM_INFO']: '시스템 정보',
            SYNC_TYPES['POLICIES']: '정책',
            SYNC_TYPES['NETWORK_OBJECTS']: '네트워크 객체',
            SYNC_TYPES['NETWORK_GROUPS']: '네트워크 그룹',
            SYNC_TYPES['SERVICE_OBJECTS']: '서비스 객체',
            SYNC_TYPES['SERVICE_GROUPS']: '서비스 그룹',
            SYNC_TYPES['USAGE_LOGS']: '사용 이력'
        }
        
        return names.get(sync_type, sync_type) 