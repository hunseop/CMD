/**
 * 객체 내보내기 모듈
 */

/**
 * 내보내기 모듈 초기화
 * @param {Function} getAllObjects - 모든 객체 데이터를 가져오는 함수
 * @returns {Object} - 내보내기 관련 메서드를 포함한 객체
 */
export function initExport(getAllObjects) {
    // DOM 요소
    const exportBtn = document.getElementById('exportBtn');
    
    // 내보내기 버튼 이벤트 리스너
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }
    
    /**
     * 내보내기 처리
     */
    async function handleExport() {
        try {
            // 데이터 가져오기
            const data = await getAllObjects();
            
            if (!data || !data.objects || data.objects.length === 0) {
                alert('내보낼 데이터가 없습니다.');
                return;
            }
            
            // 엑셀 파일 생성
            const workbook = XLSX.utils.book_new();
            
            // 워크시트 데이터 생성
            const wsData = data.objects.map((obj, index) => ({
                'No': index + 1,
                '장비명': obj.device_name,
                '객체명': obj.name || obj.group_name,
                '객체 유형': obj.type || (obj.group_name ? '그룹' : ''),
                '값': obj.value || obj.entry || '',
                '방화벽 유형': obj.firewall_type,
                '마지막 동기화': obj.last_sync_at || ''
            }));
            
            // 워크시트 생성
            const worksheet = XLSX.utils.json_to_sheet(wsData);
            
            // 열 너비 설정
            const columnWidths = [
                { wch: 5 },  // No
                { wch: 15 }, // 장비명
                { wch: 20 }, // 객체명
                { wch: 10 }, // 객체 유형
                { wch: 30 }, // 값
                { wch: 15 }, // 방화벽 유형
                { wch: 20 }  // 마지막 동기화
            ];
            worksheet['!cols'] = columnWidths;
            
            // 워크북에 워크시트 추가
            XLSX.utils.book_append_sheet(workbook, worksheet, '객체 목록');
            
            // 파일 이름 생성 (현재 시간 포함)
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '').slice(0, 15);
            const filename = `objects_${timestamp}.xlsx`;
            
            // 엑셀 파일 다운로드
            XLSX.writeFile(workbook, filename);
        } catch (error) {
            console.error('내보내기 중 오류 발생:', error);
            alert('내보내기 중 오류가 발생했습니다.');
        }
    }
    
    // 공개 메서드 반환
    return {
        handleExport
    };
} 