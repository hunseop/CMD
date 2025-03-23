/**
 * 객체 관리 페이지네이션 모듈
 */

/**
 * 페이지네이션 모듈 초기화
 * @param {Function} onPageChange - 페이지 변경 시 호출될 콜백 함수
 * @param {number} initialPage - 초기 페이지 번호
 * @param {number} initialPageSize - 초기 페이지 크기
 * @returns {Object} - 페이지네이션 관련 메서드를 포함한 객체
 */
export function initPagination(onPageChange, initialPage = 1, initialPageSize = 10) {
    // 페이지네이션 상태
    let currentPage = initialPage;
    let pageSize = initialPageSize;
    
    // 저장된 페이지 크기 불러오기
    const savedPageSize = localStorage.getItem('objectsPageSize');
    if (savedPageSize) {
        pageSize = parseInt(savedPageSize);
    }
    
    // 페이지네이션 관련 DOM 요소
    const paginationContainer = document.getElementById('pagination');
    const perPageSelect = document.getElementById('perPage');
    
    // 페이지 크기 초기화
    if (perPageSelect) {
        perPageSelect.value = pageSize.toString();
    }
    
    /**
     * 페이지 설정
     * @param {number} page - 설정할 페이지 번호
     */
    function setPage(page) {
        if (page < 1) return;
        currentPage = page;
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
        localStorage.setItem('objectsPageSize', size.toString());
        setPage(1);
    }
    
    // 페이지 크기 변경 이벤트 리스너
    if (perPageSelect && !perPageSelect.dataset.bound) {
        perPageSelect.dataset.bound = 'true';
        perPageSelect.addEventListener('change', function() {
            const newSize = parseInt(this.value);
            if (!isNaN(newSize)) {
                setPageSize(newSize);
            }
        });
    }
    
    /**
     * 페이지네이션 UI 업데이트
     * @param {Object} pagination - 서버에서 받은 페이지네이션 정보
     */
    function updatePaginationUI(pagination) {
        if (!paginationContainer || !pagination) return;
        
        // 현재 페이지 업데이트
        currentPage = pagination.page;
        
        // 페이지네이션 HTML 생성
        let html = '';
        
        // 이전 페이지 버튼
        if (pagination.has_prev) {
            html += `<a href="#" class="page-link" data-page="${pagination.prev_num}" aria-label="이전 페이지">&laquo;</a>`;
        }
        
        // 페이지 번호
        if (Array.isArray(pagination.pages)) {
            pagination.pages.forEach(page => {
                if (page === '...') {
                    html += '<span class="ellipsis">...</span>';
                } else {
                    if (page === pagination.page) {
                        html += `<span class="current-page">${page}</span>`;
                    } else {
                        html += `<a href="#" class="page-link" data-page="${page}">${page}</a>`;
                    }
                }
            });
        }
        
        // 다음 페이지 버튼
        if (pagination.has_next) {
            html += `<a href="#" class="page-link" data-page="${pagination.next_num}" aria-label="다음 페이지">&raquo;</a>`;
        }
        
        // 페이지네이션 컨테이너 업데이트
        paginationContainer.innerHTML = html;
        
        // 페이지 링크 클릭 이벤트 리스너
        paginationContainer.querySelectorAll('.page-link').forEach(link => {
            if (!link.dataset.bound) {
                link.dataset.bound = 'true';
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const page = parseInt(this.getAttribute('data-page'));
                    if (!isNaN(page) && page !== currentPage) {
                        setPage(page);
                    }
                });
            }
        });
        
        // 페이지 크기 선택 업데이트
        if (perPageSelect) {
            perPageSelect.value = pageSize.toString();
        }
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
        return pageSize;
    }
    
    /**
     * 상태 초기화
     */
    function resetState() {
        const savedPageSize = localStorage.getItem('objectsPageSize');
        if (savedPageSize) {
            const newPageSize = parseInt(savedPageSize);
            if (!isNaN(newPageSize) && newPageSize > 0 && newPageSize !== pageSize) {
                pageSize = newPageSize;
                if (perPageSelect) {
                    perPageSelect.value = pageSize.toString();
                }
            }
        }
    }
    
    // 초기 상태 설정
    resetState();
    
    // 공개 메서드 반환
    return {
        updatePaginationUI,
        getCurrentPage,
        getPageSize,
        setPage,
        setPageSize,
        resetState
    };
} 