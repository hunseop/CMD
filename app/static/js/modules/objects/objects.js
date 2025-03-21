/**
 * 방화벽 객체 관리 페이지 JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    // 상태 변수
    let currentPage = 1;
    let perPage = 10;
    let searchQuery = '';
    let currentFilters = [];
    let currentObjectType = 'network'; // 기본값: 네트워크 객체
    let searchTimer = null; // 검색 타이머 변수 추가

    // 객체 유형 버튼 선택 처리
    const objectTypeButtons = document.querySelectorAll('[data-object-type]');
    objectTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 이전 선택 버튼 비활성화
            objectTypeButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-outline-primary');
            });
            
            // 현재 버튼 활성화
            this.classList.add('active');
            this.classList.remove('btn-outline-primary');
            this.classList.add('btn-primary');
            
            // 객체 유형 업데이트 및 데이터 로드
            currentObjectType = this.getAttribute('data-object-type');
            loadObjects();
        });
    });

    // 초기 버튼 선택 (네트워크 객체)
    objectTypeButtons[0].click();

    // 검색 기능
    const searchInput = document.getElementById('searchInput');
    
    // 키 입력 이벤트로 변경
    searchInput.addEventListener('input', function() {
        // 이전 타이머가 있으면 취소
        if (searchTimer) {
            clearTimeout(searchTimer);
        }
        
        // 300ms 딜레이 후 검색 실행 (타이핑 중에 너무 많은 요청을 방지)
        searchTimer = setTimeout(function() {
            searchQuery = searchInput.value.trim();
            currentPage = 1;
            loadObjects();
        }, 300);
    });
    
    // Enter 키 이벤트도 유지 (즉시 검색 실행)
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            // 타이머 취소
            if (searchTimer) {
                clearTimeout(searchTimer);
            }
            searchQuery = searchInput.value.trim();
            currentPage = 1;
            loadObjects();
        }
    });

    // 페이지네이션 처리
    document.addEventListener('click', function(e) {
        if (e.target.closest('.page-link') && e.target.closest('.page-link').hasAttribute('data-page')) {
            e.preventDefault();
            currentPage = parseInt(e.target.closest('.page-link').getAttribute('data-page'));
            loadObjects();
        }
    });

    // 페이지당 항목 수 변경
    const perPageSelect = document.getElementById('perPageSelect');
    if (perPageSelect) {
        perPageSelect.addEventListener('change', function() {
            perPage = parseInt(this.value);
            currentPage = 1; // 페이지당 항목 수 변경 시 첫 페이지로 이동
            loadObjects();
        });
    }

    /**
     * 객체 데이터 로드 함수
     */
    function loadObjects() {
        showLoading();
        
        let url = `/objects/api/objects?type=${currentObjectType}&page=${currentPage}&per_page=${perPage}`;
        
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        
        if (currentFilters.length > 0) {
            url += `&filters=${encodeURIComponent(JSON.stringify(currentFilters))}`;
        }
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('네트워크 응답이 올바르지 않습니다');
                }
                return response.json();
            })
            .then(data => {
                console.log('Server response:', data); // 디버깅용
                updateTable(data.objects, data.object_type);
                if (data.pagination) {
                    console.log('Pagination data:', data.pagination); // 디버깅용
                    updatePagination(data.pagination);
                }
                hideLoading();
            })
            .catch(error => {
                console.error('데이터를 가져오는 중 오류가 발생했습니다:', error);
                showErrorMessage('데이터를 불러오는 중 오류가 발생했습니다.');
                hideLoading();
            });
    }

    /**
     * 테이블 업데이트 함수
     */
    function updateTable(objects, objectType) {
        const tableBody = document.querySelector('tbody');
        
        if (!objects || objects.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-message">등록된 객체가 없습니다.</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        objects.forEach((object, index) => {
            html += '<tr>';
            // 번호 열 추가
            html += `<td>${index + 1 + ((currentPage - 1) * perPage)}</td>`;
            html += `<td>${escapeHtml(object.device_name)}</td>`;
            
            if (objectType === 'network') {
                html += `<td>${escapeHtml(object.name)}</td>`;
                html += `<td>${escapeHtml(object.type)}</td>`;
                html += `<td><span class="cell-content hoverable" data-full-text="${escapeHtml(object.value)}">${escapeHtml(object.value)}</span></td>`;
            } else if (objectType === 'network-group') {
                html += `<td>${escapeHtml(object.group_name)}</td>`;
                html += `<td>네트워크 그룹</td>`;
                html += `<td><span class="cell-content hoverable" data-full-text="${escapeHtml(object.entry)}">${escapeHtml(object.entry)}</span></td>`;
            } else if (objectType === 'service') {
                html += `<td>${escapeHtml(object.name)}</td>`;
                html += `<td>${escapeHtml(object.protocol)}</td>`;
                html += `<td><span class="cell-content hoverable" data-full-text="${escapeHtml(object.port)}">${escapeHtml(object.port)}</span></td>`;
            } else if (objectType === 'service-group') {
                html += `<td>${escapeHtml(object.group_name)}</td>`;
                html += `<td>서비스 그룹</td>`;
                html += `<td><span class="cell-content hoverable" data-full-text="${escapeHtml(object.entry)}">${escapeHtml(object.entry)}</span></td>`;
            } else {
                html += `<td>-</td>`;
                html += `<td>-</td>`;
                html += `<td>-</td>`;
            }
            
            html += `<td>${escapeHtml(object.firewall_type)}</td>`;
            html += `<td>${formatDate(object.last_sync_at)}</td>`;
            html += '</tr>';
        });
        
        tableBody.innerHTML = html;
    }

    /**
     * 페이지네이션 업데이트 함수
     */
    function updatePagination(pagination) {
        if (!pagination || !pagination.pages || pagination.pages <= 1) {
            const paginationContainer = document.querySelector('.pagination-container');
            if (paginationContainer) {
                paginationContainer.style.display = 'none';
            }
            return;
        }

        const paginationContainer = document.querySelector('.pagination-container');
        if (!paginationContainer) return;
        paginationContainer.style.display = 'block';

        let html = `
        <div class="pagination-wrapper">
            <div class="per-page-select">
                <select id="perPageSelect" class="per-page">
                    <option value="10" ${pagination.per_page == 10 ? 'selected' : ''}>10개씩 보기</option>
                    <option value="20" ${pagination.per_page == 20 ? 'selected' : ''}>20개씩 보기</option>
                    <option value="50" ${pagination.per_page == 50 ? 'selected' : ''}>50개씩 보기</option>
                    <option value="100" ${pagination.per_page == 100 ? 'selected' : ''}>100개씩 보기</option>
                </select>
            </div>
            <div class="pagination">`;

        // 이전 페이지 버튼
        if (pagination.has_prev) {
            html += `<a href="#" class="page-link" data-page="${pagination.prev_num}" aria-label="이전 페이지">&laquo;</a>`;
        }

        // 페이지 번호
        if (pagination.pages && Array.isArray(pagination.pages)) {
            pagination.pages.forEach(page => {
                if (page) {
                    if (page !== currentPage) {
                        html += `<a href="#" class="page-link" data-page="${page}">${page}</a>`;
                    } else {
                        html += `<span class="page-link active">${page}</span>`;
                    }
                } else {
                    html += `<span class="ellipsis">...</span>`;
                }
            });
        }

        // 다음 페이지 버튼
        if (pagination.has_next) {
            html += `<a href="#" class="page-link" data-page="${pagination.next_num}" aria-label="다음 페이지">&raquo;</a>`;
        }

        html += `
            </div>
        </div>`;

        paginationContainer.innerHTML = html;

        // 페이지당 항목 수 변경 이벤트 다시 바인딩
        const perPageSelect = document.getElementById('perPageSelect');
        if (perPageSelect) {
            perPageSelect.addEventListener('change', function() {
                perPage = parseInt(this.value);
                currentPage = 1;
                loadObjects();
            });
        }
    }

    /**
     * 필터 업데이트 이벤트 리스너
     */
    document.addEventListener('filtersUpdated', function(e) {
        currentFilters = e.detail.filters;
        currentPage = 1; // 필터 변경 시 첫 페이지로 이동
        loadObjects();
    });

    /**
     * 유틸리티 함수
     */
    function showLoading() {
        // 로딩 표시 로직
        const tableBody = document.querySelector('tbody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">로딩 중...</span>
                    </div>
                </td>
            </tr>
        `;
    }

    function hideLoading() {
        // 로딩 숨김 로직 (필요한 경우)
    }

    function showErrorMessage(message) {
        // 에러 메시지 표시 로직
        const tableBody = document.querySelector('tbody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    <i class="fas fa-exclamation-circle me-1"></i>${message}
                </td>
            </tr>
        `;
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}); 