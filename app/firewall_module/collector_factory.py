# firewall/collector_factory.py
from typing import Dict, Any
from .firewall_interface import FirewallInterface
from .paloalto.paloalto_collector import PaloAltoCollector
from .mf2.mf2_collector import MF2Collector
from .ngf.ngf_collector import NGFCollector
from .mock.mock_collector import MockCollector

class FirewallCollectorFactory:
    # 각 방화벽 타입별 필수 파라미터 정의
    REQUIRED_PARAMS: Dict[str, list] = {
        'paloalto': ['hostname', 'username', 'password'],
        'mf2': ['hostname', 'username', 'password'],
        'ngf': ['hostname', 'username', 'password'],
        'mock': ['hostname', 'username', 'password']
    }

    @staticmethod
    def get_collector(source_type: str, **kwargs) -> FirewallInterface:
        """방화벽 타입에 따른 Collector 객체를 생성하여 반환합니다.

        Args:
            source_type (str): 방화벽 타입 ('paloalto', 'mf2', 'ngf', 'mock' 중 하나)
            **kwargs: 방화벽 인증에 필요한 파라미터
            동일한 파라미터값으로 수정함
                - hostname: 장비 호스트명
                - username: 접속 계정
                - password: 접속 비밀번호

        Returns:
            FirewallInterface: 방화벽 타입에 맞는 Collector 객체

        Raises:
            ValueError: 알 수 없는 방화벽 타입이거나 필수 파라미터가 누락된 경우
        """
        source_type = source_type.lower()
        
        # 지원하지 않는 방화벽 타입 체크
        if source_type not in FirewallCollectorFactory.REQUIRED_PARAMS:
            raise ValueError(f"지원하지 않는 방화벽 타입입니다: {source_type}")
        
        # 필수 파라미터 체크
        required_params = FirewallCollectorFactory.REQUIRED_PARAMS[source_type]
        missing_params = [param for param in required_params if param not in kwargs]
        if missing_params:
            raise ValueError(f"{source_type} 방화벽에 필요한 파라미터가 누락되었습니다: {', '.join(missing_params)}")

        # Collector 객체 생성 및 반환
        if source_type == 'paloalto':
            return PaloAltoCollector(kwargs['hostname'], kwargs['username'], kwargs['password'])
        elif source_type == 'mf2':
            return MF2Collector(kwargs['hostname'], kwargs['username'], kwargs['password'])
        elif source_type == 'ngf':
            return NGFCollector(kwargs['hostname'], kwargs['username'], kwargs['password'])
        elif source_type == 'mock':
            return MockCollector(kwargs['hostname'], kwargs['username'], kwargs['password'])
        
        # 여기까지 오면 안되지만, 혹시 모르니 예외 처리
        raise ValueError(f"알 수 없는 방화벽 모듈 타입: {source_type}")