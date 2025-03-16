/**
 * 정책 페이지네이션 관련 기능을 담당하는 모듈
 */

/**
 * 페이지네이션 모듈 초기화
 * @param {Function} onPageChange - 페이지 변경 시 호출될 콜백 함수
 * @returns {Object} - 페이지네이션 관련 메서드를 포함한 객체
 */
export function initPagination(onPageChange) {
    // 페이지네이션 상태
    let currentPage = 1;
    let totalPages = 1;
    let pageSize = 10;
    
    // 저장된 페이지 크기 불러오기
    const savedPageSize = localStorage.getItem('pageSize');
    if (savedPageSize) {
        pageSize = parseInt(savedPageSize);
        
        // 페이지 크기 선택 요소 업데이트
        const perPageSelect = document.getElementById('perPage');
        if (perPageSelect) {
            perPageSelect.value = pageSize;
        }
    }
    
    /**
     * 페이지 설정
     * @param {number} page - 설정할 페이지 번호
     */
    function setPage(page) {
        if (page < 1) {
            return;
        }
        
        // 현재 페이지가 같더라도 강제로 새로고침 (페이지 크기 변경 시 필요)
        currentPage = page;
        
        // 콜백 호출
        if (typeof onPageChange === 'function') {
            onPageChange();
        }
    }
    
    /**
     * 페이지 크기 설정
     * @param {number} size - 설정할 페이지 크기
     */
    function setPageSize(size) {
        if (size <= 0) return;
        
        pageSize = size;
        localStorage.setItem('pageSize', size);
        
        // 페이지 크기가 변경되면 첫 페이지로 이동
        setPage(1);
    }
    
    /**
     * 페이지네이션 이벤트 바인딩
     * 서버에서 반환된 페이지네이션 HTML에 이벤트를 연결합니다.
     */
    function bindEvents() {
        const paginationContainer = document.querySelector('.pagination-container');
        if (!paginationContainer) return;
        
        // 페이지 링크 이벤트
        paginationContainer.querySelectorAll('.page-link').forEach(link => {
            // 이미 이벤트가 바인딩되어 있는지 확인
            if (link.dataset.bound === 'true') return;
            
            link.dataset.bound = 'true';
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 페이지 번호 가져오기
                let targetPage;
                if (this.dataset.page === 'prev') {
                    targetPage = currentPage - 1;
                } else if (this.dataset.page === 'next') {
                    targetPage = currentPage + 1;
                } else {
                    targetPage = parseInt(this.dataset.page || this.textContent);
                }
                
                if (isNaN(targetPage) || targetPage < 1) return;
                
                // 페이지 설정
                setPage(targetPage);
            });
        });
        
        // 페이지당 항목 수 변경 이벤트
        const perPageSelect = document.getElementById('perPage');
        if (perPageSelect) {
            // 이미 이벤트가 바인딩되어 있는지 확인
            if (perPageSelect.dataset.bound === 'true') return;
            
            perPageSelect.dataset.bound = 'true';
            perPageSelect.addEventListener('change', function() {
                const newPageSize = parseInt(this.value);
                if (!isNaN(newPageSize) && newPageSize > 0) {
                    setPageSize(newPageSize);
                }
            });
            
            // 현재 저장된 페이지 크기로 설정
            perPageSelect.value = pageSize;
        }
    }
    
    /**
     * 현재 페이지 업데이트
     * 서버에서 반환된 페이지네이션 HTML에서 현재 페이지를 추출합니다.
     */
    function updateCurrentPage() {
        const activePage = document.querySelector('.pagination .active .page-link');
        if (activePage) {
            const page = parseInt(activePage.textContent);
            if (!isNaN(page)) {
                currentPage = page;
            }
        }
    }
    
    /**
     * 페이지네이션 상태 초기화
     * 페이지 크기 변경 후 새로고침 시 필요
     */
    function resetState() {
        // 페이지 크기가 변경된 경우에만 첫 페이지로 이동
        const perPageSelect = document.getElementById('perPage');
        if (perPageSelect) {
            const selectedPageSize = parseInt(perPageSelect.value);
            if (!isNaN(selectedPageSize) && selectedPageSize > 0 && selectedPageSize !== pageSize) {
                console.log(`페이지 크기 변경: ${pageSize} -> ${selectedPageSize}`);
                pageSize = selectedPageSize;
                localStorage.setItem('pageSize', pageSize);
                currentPage = 1; // 페이지 크기가 변경된 경우에만 첫 페이지로 이동
            }
        }
    }
    
    // 초기화 시 상태 리셋
    resetState();
    
    // 공개 메서드 반환
    return {
        getCurrentPage: () => currentPage,
        getPageSize: () => pageSize,
        setPage,
        setPageSize,
        bindEvents,
        updateCurrentPage,
        resetState
    };
} 