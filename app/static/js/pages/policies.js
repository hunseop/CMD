document.addEventListener('DOMContentLoaded', function() {
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
    }

    // 초기 이벤트 바인딩
    bindPaginationEvents();

    // 정책 데이터 로드 함수
    function loadPolicies(page = 1) {
        const deviceId = document.getElementById('deviceFilter').value;
        const status = document.getElementById('statusFilter').value;
        const search = document.getElementById('policySearch').value;

        fetch(`/policies/?page=${page}&device_id=${deviceId}&status=${status}&search=${search}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => response.json())
            .then(data => {
                document.getElementById('policies-table-body').innerHTML = data.html;
                document.querySelector('.pagination-container').innerHTML = data.pagination;
                
                // 페이지네이션 이벤트 다시 바인딩
                bindPaginationEvents();
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