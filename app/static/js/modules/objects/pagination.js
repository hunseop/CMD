/**
 * 객체 관리 페이지네이션 모듈
 */

/**
 * 페이지네이션 모듈 초기화
 * @param {Function} onPageChange - 페이지 변경 시 호출될 콜백 함수
 */
export function initPagination(onPageChange) {
    // 상태 변수
    let currentPage = 1;
    
    // DOM 요소
    const perPageSelect = document.getElementById('perPage');
    
    // 페이지 크기 변경 이벤트 처리
    if (perPageSelect) {
        perPageSelect.addEventListener('change', () => {
            currentPage = 1;
            onPageChange();
        });
    }
    
    /**
     * 페이지네이션 이벤트 바인딩
     */
    function bindEvents() {
        const paginationContainer = document.getElementById('pagination');
        
        // 페이지네이션 컨테이너가 없으면 종료
        if (!paginationContainer) {
            console.log('페이지네이션 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        // 페이지 버튼 클릭 이벤트 처리
        const pageButtons = paginationContainer.querySelectorAll('[data-page]');
        pageButtons.forEach(button => {
            // 이미 이벤트가 바인딩된 버튼은 건너뛰기
            if (button.dataset.eventBound) return;
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(button.getAttribute('data-page'));
                if (!isNaN(page)) {
                    currentPage = page;
                    onPageChange();
                }
            });
            
            // 이벤트 바인딩 표시
            button.dataset.eventBound = 'true';
        });
    }
    
    /**
     * 현재 페이지 번호 가져오기
     * @returns {number} - 현재 페이지 번호
     */
    function getCurrentPage() {
        return currentPage;
    }
    
    /**
     * 페이지 크기 가져오기
     * @returns {number} - 페이지 크기
     */
    function getPageSize() {
        return perPageSelect ? parseInt(perPageSelect.value) : 10;
    }
    
    /**
     * 현재 페이지 업데이트
     */
    function updateCurrentPage() {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;
        
        const pageButtons = paginationContainer.querySelectorAll('[data-page]');
        pageButtons.forEach(button => {
            const page = parseInt(button.getAttribute('data-page'));
            if (page === currentPage) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    /**
     * 페이지네이션 상태 초기화
     */
    function resetState() {
        currentPage = 1;
    }
    
    // 공개 메서드 반환
    return {
        bindEvents,
        getCurrentPage,
        getPageSize,
        updateCurrentPage,
        resetState
    };
} 