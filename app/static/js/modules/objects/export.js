/**
 * 객체 관리 내보내기 모듈
 */

/**
 * 내보내기 모듈 초기화
 * @param {Function} getAllObjects - 모든 객체 데이터를 가져오는 함수
 */
export function initExport(getAllObjects) {
    // DOM 요소
    const exportButton = document.getElementById('exportExcelBtn');
    
    // 내보내기 버튼 클릭 이벤트 처리
    exportButton.addEventListener('click', async () => {
        try {
            // 모든 객체 데이터 가져오기
            const data = await getAllObjects();
            
            // 엑셀 파일 생성
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(data.objects);
            
            // 워크시트 이름 설정
            XLSX.utils.book_append_sheet(workbook, worksheet, '객체 목록');
            
            // 파일 다운로드
            XLSX.writeFile(workbook, '객체_목록.xlsx');
        } catch (error) {
            console.error('엑셀 내보내기 중 오류 발생:', error);
            alert('엑셀 파일 생성 중 오류가 발생했습니다.');
        }
    });
    
    // 공개 메서드 반환
    return {};
} 