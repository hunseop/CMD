from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from app import db
from app.models import Device, FirewallPolicy, FirewallNetworkObject, FirewallNetworkGroup, FirewallServiceObject, FirewallServiceGroup, SyncHistory
import pandas as pd
import os
from werkzeug.utils import secure_filename
import tempfile
from app.services.firewall_sync import (
    sync_system_info,
    sync_firewall_policies,
    sync_network_objects,
    sync_network_groups,
    sync_service_objects,
    sync_service_groups,
    sync_usage_logs,
    sync_all
)

devices_bp = Blueprint('devices', __name__, url_prefix='/devices')

@devices_bp.route('/')
def index():
    """장비 목록 조회"""
    devices = Device.query.all()
    return render_template('devices/index.html', devices=devices)

@devices_bp.route('/create', methods=['GET', 'POST'])
def create():
    """장비 등록"""
    if request.method == 'POST':
        try:
            device = Device(
                name=request.form['name'],
                category=request.form['category'],
                sub_category=request.form['sub_category'],
                manufacturer=request.form['manufacturer'],
                model=request.form['model'],
                version=request.form['version'],
                ip_address=request.form['ip_address'],
                port=int(request.form['port']),
                username=request.form['username'],
                password=request.form['password']
            )
            db.session.add(device)
            db.session.commit()
            flash('장비가 성공적으로 등록되었습니다.', 'success')
            return redirect(url_for('devices.index'))
        except ValueError as e:
            flash(f'입력 값 오류: {str(e)}', 'error')
            db.session.rollback()
        except Exception as e:
            flash('장비 등록 중 오류가 발생했습니다.', 'error')
            db.session.rollback()
    return render_template('devices/create.html')

@devices_bp.route('/<int:id>/edit', methods=['GET', 'POST'])
def edit(id):
    """장비 정보 수정"""
    device = Device.query.get_or_404(id)
    if request.method == 'POST':
        try:
            device.name = request.form['name']
            device.category = request.form['category']
            device.sub_category = request.form['sub_category']
            device.manufacturer = request.form['manufacturer']
            device.model = request.form['model']
            device.version = request.form['version']
            device.ip_address = request.form['ip_address']
            device.port = int(request.form['port'])
            device.username = request.form['username']
            if request.form['password']:  # 비밀번호는 입력시에만 업데이트
                device.password = request.form['password']
            db.session.commit()
            flash('장비 정보가 수정되었습니다.', 'success')
            return redirect(url_for('devices.index'))
        except ValueError as e:
            flash(f'입력 값 오류: {str(e)}', 'error')
            db.session.rollback()
        except Exception as e:
            flash('장비 정보 수정 중 오류가 발생했습니다.', 'error')
            db.session.rollback()
    return render_template('devices/edit.html', device=device)

@devices_bp.route('/<int:id>/delete', methods=['POST'])
def delete(id):
    """장비 삭제"""
    device = Device.query.get_or_404(id)
    try:
        db.session.delete(device)
        db.session.commit()
        flash('장비가 삭제되었습니다.', 'success')
    except Exception as e:
        flash('장비 삭제 중 오류가 발생했습니다.', 'error')
        db.session.rollback()
    return redirect(url_for('devices.index'))

@devices_bp.route('/upload-excel', methods=['POST'])
def upload_excel():
    """엑셀 파일 업로드 처리"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': '파일이 없습니다.'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'success': False, 'message': '선택된 파일이 없습니다.'}), 400
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        return jsonify({'success': False, 'message': '엑셀 파일만 업로드 가능합니다.'}), 400
    
    try:
        # 파일 크기가 0인 경우 체크
        file.seek(0, 2)  # 파일 끝으로 이동
        if file.tell() == 0:  # 파일 크기가 0인지 확인
            return jsonify({'success': False, 'message': '빈 파일입니다.'}), 400
        file.seek(0)  # 파일 포인터를 다시 처음으로
        
        # 임시 파일로 저장
        temp_dir = tempfile.gettempdir()
        filename = secure_filename(file.filename)
        filepath = os.path.join(temp_dir, filename)
        file.save(filepath)
        
        try:
            # 엑셀 파일 읽기
            df = pd.read_excel(filepath)
        except Exception as e:
            return jsonify({'success': False, 'message': f'엑셀 파일을 읽을 수 없습니다: {str(e)}'}), 400
        
        # 필수 컬럼 확인
        required_columns = ['name', 'category', 'sub_category', 'ip_address', 'username', 'password']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return jsonify({
                'success': False, 
                'message': f'필수 컬럼이 누락되었습니다: {", ".join(missing_columns)}'
            }), 400
        
        # 데이터 처리
        success_count = 0
        error_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # 카테고리 검증
                if row['category'] != 'firewall':
                    raise ValueError("장비 분류는 'firewall'만 가능합니다.")
                
                # 세부 분류 검증
                if row['sub_category'] not in ['paloalto', 'mf2', 'ngf', 'mock']:
                    raise ValueError("세부 분류는 'paloalto', 'mf2', 'ngf', 'mock' 중 하나여야 합니다.")
                
                # 기존 장비 확인 (IP 주소로 중복 체크)
                existing_device = Device.query.filter_by(ip_address=row['ip_address']).first()
                
                if existing_device:
                    # 기존 장비 업데이트
                    existing_device.name = row['name']
                    existing_device.category = row['category']
                    existing_device.sub_category = row['sub_category']
                    existing_device.manufacturer = row.get('manufacturer', '')
                    existing_device.model = row.get('model', '')
                    existing_device.version = row.get('version', '')
                    existing_device.port = int(row.get('port', 443))
                    existing_device.username = row['username']
                    existing_device.password = row['password']
                else:
                    # 새 장비 생성
                    device = Device(
                        name=row['name'],
                        category=row['category'],
                        sub_category=row['sub_category'],
                        manufacturer=row.get('manufacturer', ''),
                        model=row.get('model', ''),
                        version=row.get('version', ''),
                        ip_address=row['ip_address'],
                        port=int(row.get('port', 443)),
                        username=row['username'],
                        password=row['password']
                    )
                    db.session.add(device)
                
                success_count += 1
            except Exception as e:
                error_count += 1
                errors.append(f"행 {index+2}: {str(e)}")
        
        # 변경사항 저장
        db.session.commit()
        
        # 임시 파일 삭제
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'message': f'총 {success_count}개 장비가 처리되었습니다. (오류: {error_count}개)',
            'errors': errors
        })
    
    except Exception as e:
        # 임시 파일이 존재하면 삭제
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        
        return jsonify({'success': False, 'message': f'파일 처리 중 오류가 발생했습니다: {str(e)}'}), 400

@devices_bp.route('/download-excel-template')
def download_excel_template():
    """엑셀 템플릿 다운로드"""
    try:
        # 템플릿 데이터 생성
        data = {
            'name': ['장비명 (필수)'],
            'category': ['firewall (필수)'],
            'sub_category': ['paloalto, mf2, ngf, mock 중 선택 (필수)'],
            'manufacturer': ['제조사 (선택)'],
            'model': ['모델명 (선택)'],
            'version': ['버전 (선택)'],
            'ip_address': ['192.168.0.1 (필수)'],
            'port': [443],
            'username': ['admin (필수)'],
            'password': ['password (필수)']
        }
        
        df = pd.DataFrame(data)
        
        # 임시 파일로 저장
        temp_dir = tempfile.gettempdir()
        filepath = os.path.join(temp_dir, 'device_template.xlsx')
        
        # 엑셀 파일 생성
        with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
            df.to_excel(writer, index=False)
        
        # 파일 응답 생성
        from flask import send_file
        return send_file(
            filepath,
            as_attachment=True,
            download_name='device_template.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    
    except Exception as e:
        flash(f'템플릿 다운로드 중 오류가 발생했습니다: {str(e)}', 'error')
        return redirect(url_for('devices.index'))

@devices_bp.route('/<int:id>/sync', methods=['POST'])
def sync_device(id):
    """장비 정보 동기화"""
    device = Device.query.get_or_404(id)
    
    sync_type = request.form.get('sync_type', 'all')
    
    if sync_type == 'all':
        success, results = sync_all(device.id)
        if success:
            flash('모든 정보가 성공적으로 동기화되었습니다.', 'success')
        else:
            flash('일부 정보 동기화 중 오류가 발생했습니다.', 'warning')
    elif sync_type == 'system_info':
        success, message = sync_system_info(device.id)
        if success:
            flash('시스템 정보가 성공적으로 동기화되었습니다.', 'success')
        else:
            flash(f'시스템 정보 동기화 중 오류가 발생했습니다: {message}', 'error')
    elif sync_type == 'policies':
        success, message = sync_firewall_policies(device.id)
        if success:
            flash('정책 정보가 성공적으로 동기화되었습니다.', 'success')
        else:
            flash(f'정책 정보 동기화 중 오류가 발생했습니다: {message}', 'error')
    elif sync_type == 'network_objects':
        success, message = sync_network_objects(device.id)
        if success:
            flash('네트워크 객체가 성공적으로 동기화되었습니다.', 'success')
        else:
            flash(f'네트워크 객체 동기화 중 오류가 발생했습니다: {message}', 'error')
    elif sync_type == 'network_groups':
        success, message = sync_network_groups(device.id)
        if success:
            flash('네트워크 그룹이 성공적으로 동기화되었습니다.', 'success')
        else:
            flash(f'네트워크 그룹 동기화 중 오류가 발생했습니다: {message}', 'error')
    elif sync_type == 'service_objects':
        success, message = sync_service_objects(device.id)
        if success:
            flash('서비스 객체가 성공적으로 동기화되었습니다.', 'success')
        else:
            flash(f'서비스 객체 동기화 중 오류가 발생했습니다: {message}', 'error')
    elif sync_type == 'service_groups':
        success, message = sync_service_groups(device.id)
        if success:
            flash('서비스 그룹이 성공적으로 동기화되었습니다.', 'success')
        else:
            flash(f'서비스 그룹 동기화 중 오류가 발생했습니다: {message}', 'error')
    elif sync_type == 'usage_logs':
        days = request.form.get('days', 30, type=int)
        success, message = sync_usage_logs(device.id, days=days)
        if success:
            flash('사용 이력이 성공적으로 동기화되었습니다.', 'success')
        else:
            flash(f'사용 이력 동기화 중 오류가 발생했습니다: {message}', 'error')
    else:
        flash('유효하지 않은 동기화 유형입니다.', 'error')
    
    return redirect(url_for('devices.detail', id=device.id))

@devices_bp.route('/<int:id>/detail')
def detail(id):
    """장비 상세 정보 조회"""
    device = Device.query.get_or_404(id)
    
    # 방화벽 정보 조회
    system_info = None
    policies = []
    network_objects = []
    network_groups = []
    service_objects = []
    service_groups = []
    sync_histories = []
    
    if device.category == 'firewall':
        system_info = device.system_info
        policies = FirewallPolicy.query.filter_by(device_id=device.id).all()
        network_objects = FirewallNetworkObject.query.filter_by(device_id=device.id).all()
        network_groups = FirewallNetworkGroup.query.filter_by(device_id=device.id).all()
        service_objects = FirewallServiceObject.query.filter_by(device_id=device.id).all()
        service_groups = FirewallServiceGroup.query.filter_by(device_id=device.id).all()
        sync_histories = SyncHistory.query.filter_by(device_id=device.id).order_by(SyncHistory.created_at.desc()).limit(10).all()
    
    return render_template('devices/detail.html', 
                          device=device,
                          system_info=system_info,
                          policies=policies,
                          network_objects=network_objects,
                          network_groups=network_groups,
                          service_objects=service_objects,
                          service_groups=service_groups,
                          sync_histories=sync_histories) 