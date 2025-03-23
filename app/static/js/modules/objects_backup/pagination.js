/**
 * 객체 목록 페이지네이션 모듈
 */

/**
 * 페이지네이션 모듈 초기화
 * @param {Function} onPageChange - 페이지 변경 시 호출될 콜백 함수
 * @param {number} initialPage - 초기 페이지 번호
 * @param {number} initialPageSize - 초기 페이지 크기
 * @returns {Object} - 페이지네이션 관련 메서드를 포함한 객체
 */
export function initPagination(onPageChange, initialPage = 1, initialPageSize = 10) {
    // 상태 변수
    let currentPage = initialPage;
    let pageSize = initialPageSize;
    
    // DOM 요소
    const paginationContainer = document.querySelector('.pagination-container');
    
    /**
     * 페이지네이션 UI 업데이트
     * @param {Object} data - 페이지네이션 데이터
     */
    function updatePaginationUI(data) {
        if (!paginationContainer || !data.pagination) return;
        
        const { total, page, per_page } = data.pagination;
        const totalPages = Math.ceil(total / per_page);
        
        // 페이지네이션 HTML 생성
        let html = `
            <div class="pagination-wrapper">
                <div class="per-page-select">
                    <select id="perPage" class="per-page">
                        <option value="10" ${pageSize === 10 ? 'selected' : ''}>10개씩 보기</option>
                        <option value="20" ${pageSize === 20 ? 'selected' : ''}>20개씩 보기</option>
                        <option value="50" ${pageSize === 50 ? 'selected' : ''}>50개씩 보기</option>
                        <option value="100" ${pageSize === 100 ? 'selected' : ''}>100개씩 보기</option>
                    </select>
                </div>`;
        
        if (totalPages > 1) {
            html += `
                <div class="pagination" id="pagination">
                    ${page > 1 ? `
                        <a href="#" class="page-link" data-page="${page - 1}" aria-label="이전 페이지">&laquo;</a>
                    ` : ''}
                    
                    ${generatePageNumbers(page, totalPages)}
                    
                    ${page < totalPages ? `
                        <a href="#" class="page-link" data-page="${page + 1}" aria-label="다음 페이지">&raquo;</a>
                    ` : ''}
                </div>`;
        }
        
        html += '</div>';
        
        // 페이지네이션 HTML 적용
        paginationContainer.innerHTML = html;
        
        // 이벤트 리스너 등록
        registerEventListeners();
    }
    
    /**
     * 페이지 번호 HTML 생성
     * @param {number} currentPage - 현재 페이지
     * @param {number} totalPages - 전체 페이지 수
     * @returns {string} - 페이지 번호 HTML
     */
    function generatePageNumbers(currentPage, totalPages) {
        const delta = 2;
        const range = [];
        
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 || // 첫 페이지
                i === totalPages || // 마지막 페이지
                (i >= currentPage - delta && i <= currentPage + delta) // 현재 페이지 주변
            ) {
                range.push(i);
            }
        }
        
        let html = '';
        let prev = 0;
        
        for (const i of range) {
            if (prev && i - prev > 1) {
                html += '<span class="page-ellipsis">...</span>';
            }
            
            if (i === currentPage) {
                html += `<span class="current-page" data-page="${i}">${i}</span>`;
            } else {
                html += `<a href="#" class="page-link" data-page="${i}">${i}</a>`;
            }
            
            prev = i;
        }
        
        return html;
    }
    
    /**
     * 이벤트 리스너 등록
     */
    function registerEventListeners() {
        // 페이지 크기 변경 이벤트
        const perPageSelect = document.getElementById('perPage');
        if (perPageSelect) {
            perPageSelect.addEventListener('change', handlePerPageChange);
        }
        
        // 페이지 버튼 클릭 이벤트
        const pageButtons = document.querySelectorAll('.page-link');
        pageButtons.forEach(button => {
            button.addEventListener('click', handlePageClick);
        });
    }
    
    /**
     * 페이지 크기 변경 처리
     * @param {Event} e - 이벤트 객체
     */
    function handlePerPageChange(e) {
        pageSize = parseInt(e.target.value);
        currentPage = 1; // 페이지 크기가 변경되면 첫 페이지로 이동
        
        // 세션 스토리지에 저장
        sessionStorage.setItem('objectsPageSize', pageSize);
        sessionStorage.setItem('objectsCurrentPage', currentPage);
        
        // 콜백 호출
        if (onPageChange) {
            onPageChange(currentPage, pageSize);
        }
    }
    
    /**
     * 페이지 버튼 클릭 처리
     * @param {Event} e - 이벤트 객체
     */
    function handlePageClick(e) {
        e.preventDefault();
        
        const newPage = parseInt(e.target.getAttribute('data-page'));
        if (!isNaN(newPage) && newPage !== currentPage) {
            currentPage = newPage;
            
            // 세션 스토리지에 저장
            sessionStorage.setItem('objectsCurrentPage', currentPage);
            
            // 콜백 호출
            if (onPageChange) {
                onPageChange(currentPage, pageSize);
            }
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
     * 현재 페이지 크기 가져오기
     * @returns {number} - 현재 페이지 크기
     */
    function getPageSize() {
        return pageSize;
    }
    
    // 공개 메서드 반환
    return {
        updatePaginationUI,
        getCurrentPage,
        getPageSize
    };
} 