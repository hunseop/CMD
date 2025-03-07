/**
 * 테이블 검색 기능
 * @param {string} inputId - 검색 입력 필드 ID
 * @param {string} tableSelector - 검색 대상 테이블 선택자
 */
function initTableSearch(inputId, tableSelector) {
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;
    
    searchInput.addEventListener('keyup', function() {
        const searchTerm = this.value.toLowerCase();
        const table = document.querySelector(tableSelector);
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// 전역 스코프로 내보내기
window.SearchModule = {
    initTableSearch
}; 