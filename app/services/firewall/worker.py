import threading
import time
import logging
from app import db
from app.models import SyncTask, SYNC_STATUS
from app.services.firewall import SyncManager, SyncQueueService

logger = logging.getLogger(__name__)

class SyncWorker:
    """동기화 작업 워커 클래스"""
    
    def __init__(self, poll_interval=5):
        """
        초기화
        
        Args:
            poll_interval (int): 큐 확인 간격 (초)
        """
        self.poll_interval = poll_interval
        self.running = False
        self.thread = None
    
    def start(self):
        """워커 시작"""
        if self.running:
            logger.warning("이미 실행 중인 워커가 있습니다.")
            return False
            
        self.running = True
        self.thread = threading.Thread(target=self._worker_loop)
        self.thread.daemon = True  # 메인 스레드 종료 시 함께 종료
        self.thread.start()
        
        logger.info("동기화 워커가 시작되었습니다.")
        return True
    
    def stop(self):
        """워커 중지"""
        if not self.running:
            logger.warning("실행 중인 워커가 없습니다.")
            return False
            
        self.running = False
        if self.thread:
            self.thread.join(timeout=10)  # 최대 10초간 기다림
        
        logger.info("동기화 워커가 중지되었습니다.")
        return True
    
    def _worker_loop(self):
        """워커 메인 루프"""
        logger.info("동기화 워커 루프 시작")
        
        while self.running:
            try:
                # 현재 실행 중인 작업 확인
                with db.app.app_context():
                    running_task = SyncTask.query.filter_by(status=SYNC_STATUS['RUNNING']).first()
                    
                    if running_task:
                        # 이미 실행 중인 작업이 있으면 패스
                        logger.debug(f"실행 중인 작업이 있습니다: {running_task.id} ({running_task.task_name})")
                        time.sleep(self.poll_interval)
                        continue
                    
                    # 다음 작업 가져오기
                    next_task = SyncQueueService.get_next_task()
                    
                    if next_task:
                        logger.info(f"새 작업 시작: {next_task.id} ({next_task.task_name})")
                        
                        # 작업 처리
                        success, message = SyncManager.process_task(next_task.id)
                        
                        if success:
                            logger.info(f"작업 성공: {next_task.id} - {message}")
                        else:
                            logger.warning(f"작업 실패: {next_task.id} - {message}")
                    else:
                        # 처리할 작업이 없으면 대기
                        logger.debug("처리할 작업이 없습니다.")
                
            except Exception as e:
                logger.error(f"워커 처리 중 오류 발생: {str(e)}")
                
            # 다음 폴링 전 대기
            time.sleep(self.poll_interval)
        
        logger.info("동기화 워커 루프 종료")

# 싱글톤 인스턴스
_worker_instance = None

def get_worker(poll_interval=5):
    """
    워커 인스턴스 반환 (싱글톤)
    
    Args:
        poll_interval (int): 큐 확인 간격 (초)
        
    Returns:
        SyncWorker: 워커 인스턴스
    """
    global _worker_instance
    if _worker_instance is None:
        _worker_instance = SyncWorker(poll_interval=poll_interval)
    return _worker_instance 