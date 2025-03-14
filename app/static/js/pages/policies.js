document.addEventListener('DOMContentLoaded', function() {
    // 저장된 페이지당 항목 수 복원
    const savedPerPage = localStorage.getItem('policiesPerPage');
    if (savedPerPage) {
        const perPageSelect = document.getElementById('perPage');
        if (perPageSelect) {
            perPageSelect.value = savedPerPage;
            loadPolicies(1);  // 저장된 항목 수로 데이터 로드
        }
    }

    // 페이지네이션 이벤트 처리
    function bindPaginationEvents() {
        const paginationWrapper = document.querySelector('.pagination-wrapper');
        if (!paginationWrapper) return;

        // 페이지 링크 이벤트
        paginationWrapper.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.dataset.page;
                
                // 현재 페이지 번호 가져오기
                const currentPage = parseInt(document.querySelector('.current-page').textContent);
                
                // 이전/다음 버튼 처리
                let targetPage;
                if (page === 'prev') {
                    targetPage = currentPage - 1;
                } else if (page === 'next') {
                    targetPage = currentPage + 1;
                } else {
                    targetPage = parseInt(page);
                }
                
                loadPolicies(targetPage);
            });
        });

        // 페이지당 항목 수 변경 이벤트 처리
        const perPageSelect = paginationWrapper.querySelector('#perPage');
        if (perPageSelect) {
            perPageSelect.addEventListener('change', function() {
                // 선택한 값을 localStorage에 저장
                localStorage.setItem('policiesPerPage', this.value);
                loadPolicies(1); // 페이지당 항목 수가 변경되면 첫 페이지로 이동
            });
        }
    }

    // 정책 데이터 로드 함수
    function loadPolicies(page = 1) {
        const deviceId = document.getElementById('deviceFilter')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';
        const search = document.getElementById('policySearch')?.value || '';
        const perPage = document.getElementById('perPage')?.value || localStorage.getItem('policiesPerPage') || 10;

        // 로딩 표시
        const tableBody = document.getElementById('policies-table-body');
        if (tableBody) {
            tableBody.style.opacity = '0.5';
        }

        fetch(`/policies/?page=${page}&per_page=${perPage}&device_id=${deviceId}&status=${status}&search=${search}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (tableBody) {
                tableBody.innerHTML = data.html;
                tableBody.style.opacity = '1';
            }

            const paginationWrapper = document.querySelector('.pagination-wrapper');
            if (paginationWrapper && data.pagination) {
                paginationWrapper.outerHTML = data.pagination;
            }
            
            // 페이지네이션 이벤트 다시 바인딩
            bindPaginationEvents();

            // URL 업데이트 (브라우저 히스토리는 변경하지 않음)
            const url = new URL(window.location);
            url.searchParams.set('page', page);
            url.searchParams.set('per_page', perPage);
            if (deviceId) url.searchParams.set('device_id', deviceId);
            if (status) url.searchParams.set('status', status);
            if (search) url.searchParams.set('search', search);
            window.history.replaceState({}, '', url);
        })
        .catch(error => {
            console.error('Error:', error);
            if (tableBody) {
                tableBody.style.opacity = '1';
            }
        });
    }

    // 초기 이벤트 바인딩
    bindPaginationEvents();

    // 필터 변경 이벤트 처리
    const deviceFilter = document.getElementById('deviceFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('policySearch');

    if (deviceFilter) {
        deviceFilter.addEventListener('change', () => loadPolicies(1));
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', () => loadPolicies(1));
    }
    
    // 검색어 입력 이벤트 처리 (디바운스 적용)
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadPolicies(1), 300);
        });
    }
}); 