/**
 * 객체 관리 필터 모듈
 */

/**
 * 필터 모듈 초기화
 * @param {Function} onFilterChange - 필터 변경 시 호출될 콜백 함수
 */
export function initFilters(onFilterChange) {
    // DOM 요소
    const filterForm = document.getElementById('filterForm');
    const clearFilterButton = document.getElementById('clearFilterBtn');
    
    // 필터 초기화 이벤트 처리
    clearFilterButton.addEventListener('click', () => {
        filterForm.reset();
        onFilterChange();
    });
    
    // 필터 변경 이벤트 처리
    filterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        onFilterChange();
    });
    
    /**
     * 활성화된 필터 값 가져오기
     * @returns {Object} - 활성화된 필터 값
     */
    function getActiveFilters() {
        const formData = new FormData(filterForm);
        const filters = {};
        
        for (const [key, value] of formData.entries()) {
            if (value) {
                filters[key] = value;
            }
        }
        
        return filters;
    }
    
    // 공개 메서드 반환
    return {
        getActiveFilters
    };
} 