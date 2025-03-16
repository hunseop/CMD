/**
 * 방화벽 객체 Excel 내보내기 JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportToExcel');
    
    if (!exportBtn) return;
    
    exportBtn.addEventListener('click', exportToExcel);
    
    /**
     * Excel 내보내기 함수
     */
    async function exportToExcel() {
        // 현재 선택된 객체 유형 가져오기
        const activeButton = document.querySelector('[data-object-type].active');
        if (!activeButton) {
            showErrorMessage('객체 유형을 선택해주세요.');
            return;
        }
        
        const objectType = activeButton.getAttribute('data-object-type');
        
        // 버튼 상태 업데이트
        updateExportButton(true, '내보내는 중...');
        
        try {
            // 현재 필터 및 검색어 가져오기
            const filters = getCurrentFilters();
            const searchQuery = document.getElementById('searchInput')?.value || '';
            
            // API 요청 URL 구성
            let url = `/objects/api/objects/export?type=${objectType}`;
            
            // 검색어 추가
            if (searchQuery) {
                url += `&search=${encodeURIComponent(searchQuery)}`;
            }
            
            // 필터 추가
            if (filters.length > 0) {
                url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
            }
            
            // API 요청
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('내보내기 요청 실패');
            }
            
            // 응답 유형에 따라 처리
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                // JSON 응답 (오류 메시지)
                const data = await response.json();
                showErrorMessage(data.message || '내보내기 실패');
            } else {
                // Blob 응답 (파일)
                const blob = await response.blob();
                
                // 파일명 가져오기
                let filename = 'firewall_objects.xlsx';
                const disposition = response.headers.get('content-disposition');
                if (disposition && disposition.includes('filename=')) {
                    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    const matches = filenameRegex.exec(disposition);
                    if (matches && matches[1]) {
                        filename = matches[1].replace(/['"]/g, '');
                    }
                }
                
                // 파일 다운로드
                downloadFile(blob, filename);
            }
        } catch (error) {
            console.error('Excel 내보내기 오류:', error);
            showErrorMessage('Excel 내보내기 중 오류가 발생했습니다.');
        } finally {
            // 버튼 상태 복원
            updateExportButton(false, 'Excel로 내보내기');
        }
    }
    
    /**
     * 현재 필터 가져오기
     */
    function getCurrentFilters() {
        // filtersUpdated 이벤트에서 설정된 필터 가져오기
        // 이 예제에서는 전역 변수나 데이터 속성에서 필터를 가져온다고 가정
        const filtersEvent = new CustomEvent('getFilters', {
            detail: { filters: [] }
        });
        document.dispatchEvent(filtersEvent);
        
        return filtersEvent.detail.filters;
    }
    
    /**
     * 파일 다운로드 함수
     */
    function downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }
    
    /**
     * 오류 메시지 표시 함수
     */
    function showErrorMessage(message) {
        alert(message);
    }
    
    /**
     * 내보내기 버튼 상태 업데이트 함수
     */
    function updateExportButton(isLoading, text) {
        if (isLoading) {
            exportBtn.disabled = true;
            exportBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${text}`;
        } else {
            exportBtn.disabled = false;
            exportBtn.innerHTML = `<i class="fas fa-file-excel me-1"></i>${text}`;
        }
    }
}); 