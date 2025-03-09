import pytest
from app import create_app, db
from app.models import Device
from sqlalchemy.exc import IntegrityError

@pytest.fixture
def app():
    """테스트용 Flask 앱 생성"""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'  # 메모리 DB 사용
    return app

@pytest.fixture
def client(app):
    """테스트용 클라이언트"""
    return app.test_client()

@pytest.fixture
def db_session(app):
    """테스트용 데이터베이스 세션"""
    with app.app_context():
        db.create_all()
        yield db
        db.session.remove()
        db.drop_all()

def test_create_device(db_session):
    """장비 생성 테스트"""
    device = Device(
        name='Test-Firewall',
        category='firewall',
        manufacturer='Palo Alto',
        model='PA-5250',
        version='10.1.0',
        ip_address='192.168.1.1',
        port=443,
        username='admin',
        password='test123!'
    )
    
    db_session.session.add(device)
    db_session.session.commit()
    
    saved_device = Device.query.first()
    assert saved_device.name == 'Test-Firewall'
    assert saved_device.ip_address == '192.168.1.1'

def test_device_connection_string(db_session):
    """장비 연결 문자열 테스트"""
    device = Device(
        name='Test-Device',
        category='switch',
        ip_address='192.168.1.10',
        port=22,
        username='admin',
        password='test123!'
    )
    
    assert device.connection_string == '192.168.1.10:22'

def test_device_validation(db_session):
    """장비 유효성 검사 테스트"""
    # 필수 필드 누락 테스트 (category 누락)
    device = Device(
        name='Test-Device',
        ip_address='192.168.1.1',
        username='admin',
        password='test123!'
    )
    
    with pytest.raises(IntegrityError):
        db_session.session.add(device)
        db_session.session.commit()
    
    db_session.session.rollback()
    
    # 중복 IP 주소 테스트
    device1 = Device(
        name='Device1',
        category='firewall',
        ip_address='192.168.1.1',
        username='admin',
        password='test123!'
    )
    
    device2 = Device(
        name='Device2',
        category='firewall',
        ip_address='192.168.1.1',  # 같은 IP 주소
        username='admin',
        password='test123!'
    )
    
    db_session.session.add(device1)
    db_session.session.commit()
    
    with pytest.raises(IntegrityError):
        db_session.session.add(device2)
        db_session.session.commit() 