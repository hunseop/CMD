import pytest
import os
import pandas as pd
from io import BytesIO
from app import create_app, db
from app.models import Device

@pytest.fixture
def app():
    """테스트용 Flask 앱 생성"""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
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

@pytest.fixture
def sample_excel():
    """테스트용 엑셀 파일 생성"""
    data = {
        'name': ['Test-Device1', 'Test-Device2'],
        'category': ['firewall', 'switch'],
        'manufacturer': ['Vendor1', 'Vendor2'],
        'model': ['Model1', 'Model2'],
        'version': ['1.0', '2.0'],
        'ip_address': ['192.168.1.1', '192.168.1.2'],
        'port': [443, 22],
        'username': ['admin1', 'admin2'],
        'password': ['pass1', 'pass2']
    }
    df = pd.DataFrame(data)
    excel_file = BytesIO()
    df.to_excel(excel_file, index=False)
    excel_file.seek(0)
    return excel_file

def test_excel_template_download(client):
    """엑셀 템플릿 다운로드 테스트"""
    response = client.get('/devices/download-excel-template')
    assert response.status_code == 200
    assert response.headers['Content-Type'] == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    assert 'attachment' in response.headers['Content-Disposition']

def test_excel_upload(client, db_session, sample_excel):
    """엑셀 파일 업로드 테스트"""
    # 기존 데이터 삭제
    Device.query.delete()
    db_session.session.commit()
    
    response = client.post(
        '/devices/upload-excel',
        data={'file': (sample_excel, 'test.xlsx')},
        content_type='multipart/form-data'
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] == True
    
    # DB에 저장된 데이터 확인
    devices = Device.query.all()
    assert len(devices) == 2
    
    device1 = Device.query.filter_by(ip_address='192.168.1.1').first()
    assert device1.name == 'Test-Device1'
    assert device1.category == 'firewall'
    
    device2 = Device.query.filter_by(ip_address='192.168.1.2').first()
    assert device2.name == 'Test-Device2'
    assert device2.category == 'switch'

def test_excel_upload_invalid_file(client, db_session):
    """잘못된 파일 업로드 테스트"""
    # 빈 파일 전송
    response = client.post(
        '/devices/upload-excel',
        data={'file': (BytesIO(b''), 'empty.xlsx')},
        content_type='multipart/form-data'
    )
    
    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] == False

def test_excel_upload_missing_required_columns(client, db_session):
    """필수 컬럼 누락 테스트"""
    # 필수 컬럼이 누락된 데이터
    data = {
        'name': ['Test-Device'],
        # category 누락
        'ip_address': ['192.168.1.1']
        # username, password 누락
    }
    df = pd.DataFrame(data)
    excel_file = BytesIO()
    df.to_excel(excel_file, index=False)
    excel_file.seek(0)
    
    response = client.post(
        '/devices/upload-excel',
        data={'file': (excel_file, 'missing_columns.xlsx')},
        content_type='multipart/form-data'
    )
    
    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] == False
    assert '필수 컬럼이 누락되었습니다' in data['message'] 