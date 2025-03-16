from flask import request, jsonify, flash, redirect, url_for, send_file
from app import db
from app.models import Device
from app.routes.devices import devices_bp
import pandas as pd
import os
from werkzeug.utils import secure_filename
import tempfile
from app.utils.excel import create_excel_template

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
        
        # 유틸리티 함수를 사용하여 템플릿 파일 생성
        filepath = create_excel_template(data, 'device_template.xlsx')
        
        # 파일 응답 생성
        return send_file(
            filepath,
            as_attachment=True,
            download_name='device_template.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    
    except Exception as e:
        flash(f'템플릿 다운로드 중 오류가 발생했습니다: {str(e)}', 'error')
        return redirect(url_for('devices.index')) 