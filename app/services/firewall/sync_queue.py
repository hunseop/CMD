from datetime import datetime
import uuid
from app import db
from app.models import Device, SyncTask, SyncHistory, SYNC_STATUS, SYNC_PRIORITY
from sqlalchemy import func, or_

class SyncQueueService:
    """동기화 큐 관리 서비스"""
    
    @staticmethod
    def create_task(device_id, sync_types, task_name=None, priority=SYNC_PRIORITY['NORMAL'], batch_id=None):
        """
        동기화 작업 생성
        
        Args:
            device_id (int): 장비 ID
            sync_types (list): 동기화 유형 목록
            task_name (str, optional): 작업명
            priority (int, optional): 우선순위 (기본: 보통)
            batch_id (str, optional): 배치 ID
            
        Returns:
            tuple: (성공 여부, 작업 객체 또는 메시지)
        """
        try:
            # 장비 존재 여부 확인
            device = Device.query.get(device_id)
            if not device:
                return False, "존재하지 않는 장비입니다."
            
            # 동기화 유형 검증
            if not sync_types:
                return False, "동기화 유형을 선택해주세요."
            
            # 작업명 생성
            if not task_name:
                task_name = f"{device.name} 동기화"
            
            # 배치 ID 생성
            is_batch = len(sync_types) > 1
            if is_batch and not batch_id:
                batch_id = str(uuid.uuid4())
                
            # 큐 위치 계산
            max_position = db.session.query(func.max(SyncTask.queue_position)).filter(
                SyncTask.status == SYNC_STATUS['PENDING']
            ).scalar() or 0
            
            # 작업 생성
            task = SyncTask(
                device_id=device_id,
                task_name=task_name,
                sync_types=','.join(sync_types),
                priority=priority,
                queue_position=max_position + 1,
                batch_id=batch_id,
                is_batch=is_batch
            )
            
            db.session.add(task)
            db.session.commit()
            
            # 큐 정렬 (우선순위 반영)
            SyncQueueService.reorder_queue()
            
            return True, task
            
        except Exception as e:
            db.session.rollback()
            return False, f"작업 생성 중 오류 발생: {str(e)}"
    
    @staticmethod
    def get_next_task():
        """
        다음 실행할 작업 가져오기
        
        Returns:
            SyncTask or None: 다음 실행할 작업 또는 None
        """
        # 현재 실행 중인 작업이 있는지 확인
        running_task = SyncTask.query.filter_by(status=SYNC_STATUS['RUNNING']).first()
        if running_task:
            return None
            
        # 우선순위와 큐 위치를 기준으로 다음 작업 선택
        next_task = SyncTask.query.filter_by(
            status=SYNC_STATUS['PENDING']
        ).order_by(
            SyncTask.priority,     # 우선순위 높은 순 (숫자가 작을수록 높음)
            SyncTask.queue_position  # 큐 위치 순
        ).first()
        
        return next_task
    
    @staticmethod
    def start_task(task_id):
        """
        작업 시작 상태로 변경
        
        Args:
            task_id (int): 작업 ID
            
        Returns:
            tuple: (성공 여부, 작업 객체 또는 메시지)
        """
        try:
            task = SyncTask.query.get(task_id)
            if not task:
                return False, "존재하지 않는 작업입니다."
                
            if task.status != SYNC_STATUS['PENDING']:
                return False, f"작업을 시작할 수 없습니다. 현재 상태: {task.status}"
                
            # 작업 시작 정보 업데이트
            task.status = SYNC_STATUS['RUNNING']
            task.started_at = datetime.now()
            task.queue_position = 0
            task.progress = 0
            task.message = "동기화를 시작합니다."
            
            db.session.commit()
            
            return True, task
            
        except Exception as e:
            db.session.rollback()
            return False, f"작업 시작 중 오류 발생: {str(e)}"
    
    @staticmethod
    def update_task_progress(task_id, progress, current_sync_type=None, message=None):
        """
        작업 진행률 업데이트
        
        Args:
            task_id (int): 작업 ID
            progress (int): 진행률 (0-100)
            current_sync_type (str, optional): 현재 동기화 중인 유형
            message (str, optional): 상태 메시지
            
        Returns:
            tuple: (성공 여부, 작업 객체 또는 메시지)
        """
        try:
            task = SyncTask.query.get(task_id)
            if not task:
                return False, "존재하지 않는 작업입니다."
                
            if task.status != SYNC_STATUS['RUNNING']:
                return False, f"작업 진행률을 업데이트할 수 없습니다. 현재 상태: {task.status}"
                
            # 진행률 검증
            progress = min(max(0, progress), 100)
            
            # 작업 정보 업데이트
            task.progress = progress
            if current_sync_type:
                task.current_sync_type = current_sync_type
            if message:
                task.message = message
                
            db.session.commit()
            
            return True, task
            
        except Exception as e:
            db.session.rollback()
            return False, f"작업 진행률 업데이트 중 오류 발생: {str(e)}"
    
    @staticmethod
    def complete_task(task_id, success=True, message=None):
        """
        작업 완료 처리
        
        Args:
            task_id (int): 작업 ID
            success (bool): 성공 여부
            message (str, optional): 완료 메시지
            
        Returns:
            tuple: (성공 여부, 작업 객체 또는 메시지)
        """
        try:
            task = SyncTask.query.get(task_id)
            if not task:
                return False, "존재하지 않는 작업입니다."
                
            if task.status not in [SYNC_STATUS['RUNNING'], SYNC_STATUS['PENDING']]:
                return False, f"이미 완료된 작업입니다. 현재 상태: {task.status}"
                
            # 작업 완료 정보 업데이트
            task.status = SYNC_STATUS['COMPLETED'] if success else SYNC_STATUS['FAILED']
            task.completed_at = datetime.now()
            task.progress = 100 if success else task.progress
            
            if message:
                task.message = message
            else:
                task.message = "동기화가 완료되었습니다." if success else "동기화 중 오류가 발생했습니다."
                
            db.session.commit()
            
            return True, task
            
        except Exception as e:
            db.session.rollback()
            return False, f"작업 완료 처리 중 오류 발생: {str(e)}"
    
    @staticmethod
    def cancel_task(task_id):
        """
        작업 취소
        
        Args:
            task_id (int): 작업 ID
            
        Returns:
            tuple: (성공 여부, 작업 객체 또는 메시지)
        """
        try:
            task = SyncTask.query.get(task_id)
            if not task:
                return False, "존재하지 않는 작업입니다."
                
            if not task.can_cancel:
                return False, f"취소할 수 없는 작업입니다. 현재 상태: {task.status}"
            
            # 작업 취소 정보 업데이트
            prev_status = task.status
            task.status = SYNC_STATUS['CANCELED']
            task.completed_at = datetime.now()
            task.message = "사용자에 의해 취소되었습니다."
            
            # 대기 중인 작업이었으면 큐에서 제거
            if prev_status == SYNC_STATUS['PENDING']:
                task.queue_position = 0
                
            db.session.commit()
            
            # 다른 작업들의 큐 위치 재조정
            if prev_status == SYNC_STATUS['PENDING']:
                SyncQueueService.reorder_queue()
            
            return True, task
            
        except Exception as e:
            db.session.rollback()
            return False, f"작업 취소 중 오류 발생: {str(e)}"
    
    @staticmethod
    def get_device_tasks(device_id, limit=10, include_completed=False):
        """
        특정 장비의 작업 목록 조회
        
        Args:
            device_id (int): 장비 ID
            limit (int): 조회할 최대 갯수
            include_completed (bool): 완료된 작업 포함 여부
            
        Returns:
            list: 작업 목록
        """
        query = SyncTask.query.filter_by(device_id=device_id)
        
        if not include_completed:
            query = query.filter(or_(
                SyncTask.status == SYNC_STATUS['PENDING'],
                SyncTask.status == SYNC_STATUS['RUNNING']
            ))
            
        return query.order_by(SyncTask.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_queue_status():
        """
        큐 상태 조회
        
        Returns:
            dict: 큐 상태 정보
        """
        # 실행 중인 작업 수
        running_count = SyncTask.query.filter_by(status=SYNC_STATUS['RUNNING']).count()
        
        # 대기 중인 작업 수
        pending_count = SyncTask.query.filter_by(status=SYNC_STATUS['PENDING']).count()
        
        # 현재 실행 중인 작업
        current_task = SyncTask.query.filter_by(status=SYNC_STATUS['RUNNING']).first()
        
        # 최근 완료된 작업 (성공/실패/취소 포함)
        recent_completed = SyncTask.query.filter(
            SyncTask.status.in_([SYNC_STATUS['COMPLETED'], SYNC_STATUS['FAILED'], SYNC_STATUS['CANCELED']])
        ).order_by(SyncTask.completed_at.desc()).limit(5).all()
        
        return {
            'running_count': running_count,
            'pending_count': pending_count,
            'current_task': current_task,
            'recent_completed': recent_completed
        }
    
    @staticmethod
    def reorder_queue():
        """
        큐 순서 재조정 (우선순위 반영)
        """
        try:
            # 대기 중인 모든 작업 조회
            pending_tasks = SyncTask.query.filter_by(
                status=SYNC_STATUS['PENDING']
            ).order_by(
                SyncTask.priority,
                SyncTask.created_at
            ).all()
            
            # 큐 위치 재할당
            for i, task in enumerate(pending_tasks, 1):
                task.queue_position = i
                
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            return False, f"큐 재조정 중 오류 발생: {str(e)}"
            
        return True, "큐 재조정이 완료되었습니다." 