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
        document.querySelectorAll('.page-link').forEach(link => {
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
        const perPageSelect = document.getElementById('perPage');
        if (perPageSelect) {
            perPageSelect.addEventListener('change', function() {
                // 선택한 값을 localStorage에 저장
                localStorage.setItem('policiesPerPage', this.value);
                loadPolicies(1); // 페이지당 항목 수가 변경되면 첫 페이지로 이동
            });
        }
    }

    // 초기 이벤트 바인딩
    bindPaginationEvents();

    // 정책 데이터 로드 함수
    function loadPolicies(page = 1) {
        const deviceId = document.getElementById('deviceFilter').value;
        const status = document.getElementById('statusFilter').value;
        const search = document.getElementById('policySearch').value;
        const perPage = document.getElementById('perPage')?.value || localStorage.getItem('policiesPerPage') || 10;

        fetch(`/policies/?page=${page}&per_page=${perPage}&device_id=${deviceId}&status=${status}&search=${search}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => response.json())
            .then(data => {
                document.getElementById('policies-table-body').innerHTML = data.html;
                const paginationWrapper = document.querySelector('.pagination-wrapper');
                if (paginationWrapper) {
                    paginationWrapper.outerHTML = data.pagination;
                }
                
                // 페이지네이션 이벤트 다시 바인딩
                bindPaginationEvents();

                // 페이지당 항목 수 선택값 유지
                const perPageSelect = document.getElementById('perPage');
                if (perPageSelect) {
                    perPageSelect.value = perPage;
                }
            })
            .catch(error => console.error('Error:', error));
    }

    // 필터 변경 이벤트 처리
    document.getElementById('deviceFilter').addEventListener('change', () => loadPolicies());
    document.getElementById('statusFilter').addEventListener('change', () => loadPolicies());
    
    // 검색어 입력 이벤트 처리 (디바운스 적용)
    let searchTimeout;
    document.getElementById('policySearch').addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => loadPolicies(), 300);
    });
}); 