"""
Excel 파일 생성 유틸리티 모듈
"""
import io
import xlsxwriter
import pandas as pd
import os
import tempfile
from datetime import datetime

def generate_excel_file(headers, data, sheet_name='Sheet1'):
    """
    xlsxwriter를 사용하여 Excel 파일을 생성합니다.
    
    Args:
        headers (list): 열 제목 목록
        data (list): 행 데이터 목록 (각 행은 리스트 형태)
        sheet_name (str): 시트 이름
        
    Returns:
        BytesIO: Excel 파일 데이터를 담은 BytesIO 객체
    """
    # 메모리에 Excel 파일 생성
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output)
    worksheet = workbook.add_worksheet(sheet_name)
    
    # 스타일 정의
    header_format = workbook.add_format({
        'bold': True,
        'bg_color': '#F0F0F0',
        'border': 1,
        'align': 'center',
        'valign': 'vcenter'
    })
    
    cell_format = workbook.add_format({
        'border': 1,
        'align': 'left',
        'valign': 'vcenter'
    })
    
    # 열 너비 설정
    for i, header in enumerate(headers):
        worksheet.set_column(i, i, 20)  # 기본 너비 20
    
    # 헤더 작성
    for col, header in enumerate(headers):
        worksheet.write(0, col, header, header_format)
    
    # 데이터 작성
    for row_idx, row_data in enumerate(data):
        for col_idx, cell_data in enumerate(row_data):
            worksheet.write(row_idx + 1, col_idx, cell_data, cell_format)
    
    # 필터 추가
    worksheet.autofilter(0, 0, len(data), len(headers) - 1)
    
    # 워크북 닫기
    workbook.close()
    
    # 파일 포인터를 처음으로 이동
    output.seek(0)
    
    return output

def generate_excel_from_dataframe(df, sheet_name='Sheet1', auto_adjust_columns=True):
    """
    pandas DataFrame을 사용하여 Excel 파일을 생성합니다.
    
    Args:
        df (DataFrame): pandas DataFrame 객체
        sheet_name (str): 시트 이름
        auto_adjust_columns (bool): 열 너비 자동 조정 여부
        
    Returns:
        BytesIO: Excel 파일 데이터를 담은 BytesIO 객체
    """
    # 메모리에 Excel 파일 생성
    output = io.BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        # 열 너비 자동 조정
        if auto_adjust_columns:
            worksheet = writer.sheets[sheet_name]
            for idx, col in enumerate(df.columns):
                max_len = max(df[col].astype(str).map(len).max(), len(col)) + 2
                worksheet.column_dimensions[chr(65 + idx)].width = min(max_len, 50)  # 최대 너비 제한
    
    # 파일 포인터를 처음으로 이동
    output.seek(0)
    
    return output

def create_excel_template(data, filename='template.xlsx'):
    """
    템플릿 엑셀 파일을 생성합니다.
    
    Args:
        data (dict): 열 이름과 샘플 데이터를 담은 딕셔너리
        filename (str): 파일 이름
        
    Returns:
        str: 생성된 파일의 경로
    """
    # DataFrame 생성
    df = pd.DataFrame(data)
    
    # 임시 파일로 저장
    temp_dir = tempfile.gettempdir()
    filepath = os.path.join(temp_dir, filename)
    
    # 엑셀 파일 생성
    with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    
    return filepath

def get_excel_filename(prefix, suffix=None):
    """
    현재 날짜/시간을 포함한 엑셀 파일명을 생성합니다.
    
    Args:
        prefix (str): 파일명 접두사
        suffix (str, optional): 파일명 접미사
        
    Returns:
        str: 생성된 파일명
    """
    now = datetime.now().strftime('%Y%m%d_%H%M%S')
    if suffix:
        return f"{prefix}_{suffix}_{now}.xlsx"
    return f"{prefix}_{now}.xlsx"