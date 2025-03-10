from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from app import db
from app.models import Device, FirewallPolicy, FirewallNetworkObject, FirewallNetworkGroup, FirewallServiceObject, FirewallServiceGroup, SyncHistory, FirewallSystemInfo
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
    
    # 각 장비별 마지막 동기화 정보 조회
    sync_info = {}
    for device in devices:
        if device.category == 'firewall':
            # 시스템 정보 동기화 여부
            system_info = FirewallSystemInfo.query.filter_by(device_id=device.id).first()
            
            # 마지막 동기화 이력
            last_sync = SyncHistory.query.filter_by(device_id=device.id).order_by(SyncHistory.created_at.desc()).first()
            
            # 정책 수
            policy_count = FirewallPolicy.query.filter_by(device_id=device.id).count()
            
            sync_info[device.id] = {
                'system_info': system_info,
                'last_sync': last_sync,
                'policy_count': policy_count
            }
    
    return render_template('devices/index.html', devices=devices, sync_info=sync_info)

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
    
    # 동기화 유형 (여러 항목 선택 가능)
    sync_types = request.form.getlist('sync_type')
    
    # 결과 저장
    results = {}
    all_success = True
    
    # 모든 항목 동기화 요청인 경우
    if 'all' in sync_types:
        success, message = sync_all(device.id)
        results['all'] = {'success': success, 'message': message}
        all_success = all_success and success
    else:
        # 선택된 항목만 동기화
        for sync_type in sync_types:
            if sync_type == 'system_info':
                success, message = sync_system_info(device.id)
                results['system_info'] = {'success': success, 'message': message}
                all_success = all_success and success
            
            elif sync_type == 'policies':
                success, message = sync_firewall_policies(device.id)
                results['policies'] = {'success': success, 'message': message}
                all_success = all_success and success
            
            elif sync_type == 'network_objects':
                success, message = sync_network_objects(device.id)
                results['network_objects'] = {'success': success, 'message': message}
                all_success = all_success and success
            
            elif sync_type == 'network_groups':
                success, message = sync_network_groups(device.id)
                results['network_groups'] = {'success': success, 'message': message}
                all_success = all_success and success
            
            elif sync_type == 'service_objects':
                success, message = sync_service_objects(device.id)
                results['service_objects'] = {'success': success, 'message': message}
                all_success = all_success and success
            
            elif sync_type == 'service_groups':
                success, message = sync_service_groups(device.id)
                results['service_groups'] = {'success': success, 'message': message}
                all_success = all_success and success
            
            elif sync_type == 'usage_logs':
                days = request.form.get('days', 30, type=int)
                success, message = sync_usage_logs(device.id, days=days)
                results['usage_logs'] = {'success': success, 'message': message}
                all_success = all_success and success
    
    # 결과 메시지 생성
    if not sync_types:
        message = "동기화할 항목을 선택해주세요."
        success = False
    elif all_success:
        message = "선택한 항목이 성공적으로 동기화되었습니다."
        success = True
    else:
        message = "일부 항목 동기화 중 오류가 발생했습니다."
        success = False
    
    # AJAX 요청인 경우 JSON 응답 반환
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.content_type == 'application/json':
        return jsonify({
            'success': success,
            'message': message,
            'results': results
        })
    
    # 일반 요청인 경우 리다이렉트
    if success:
        flash(message, 'success')
    else:
        flash(message, 'error')
    
    return redirect(url_for('devices.index'))

@devices_bp.route('/<int:id>/detail')
def detail(id):
    """장비 상세 정보 조회"""
    device = Device.query.get_or_404(id)
    
    # 방화벽 정보 조회
    system_info = None
    sync_histories = []
    
    if device.category == 'firewall':
        system_info = device.system_info
        sync_histories = SyncHistory.query.filter_by(device_id=device.id).order_by(SyncHistory.created_at.desc()).limit(10).all()
    
    return render_template('devices/detail.html', 
                          device=device,
                          system_info=system_info,
                          sync_histories=sync_histories) 