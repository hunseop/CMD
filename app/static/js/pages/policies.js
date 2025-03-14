document.addEventListener('DOMContentLoaded', function() {
    // 전역 변수
    let activeFilters = JSON.parse(localStorage.getItem('activeFilters') || '[]');
    
    // 필터 관련 DOM 요소
    const addFilterBtn = document.getElementById('addFilterBtn');
    const clearFilterBtn = document.getElementById('clearFilterBtn');
    const filterForm = document.getElementById('filterForm');
    const activeFiltersContainer = document.getElementById('activeFilters');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const cancelFilterBtn = document.getElementById('cancelFilterBtn');
    
    // 필터 폼 필드
    const filterField = document.querySelector('.filter-field');
    const filterOperator = document.querySelector('.filter-operator');
    const filterValue = document.querySelector('.filter-value');
    const filterJoin = document.querySelector('.filter-join');
    
    // 필터 필드 변경 시 연산자 옵션 업데이트
    if (filterField) {
        filterField.addEventListener('change', function() {
            updateOperatorOptions();
            updateValueField();
        });
    }
    
    // 필터 관련 이벤트 리스너
    if (addFilterBtn) {
        addFilterBtn.addEventListener('click', showFilterForm);
    }
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', clearAllFilters);
    }
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', applyFilter);
    }
    if (cancelFilterBtn) {
        cancelFilterBtn.addEventListener('click', hideFilterForm);
    }
    
    // 필터 폼 표시
    function showFilterForm() {
        if (filterForm) {
            filterForm.style.display = 'block';
            if (filterJoin) {
                filterJoin.style.display = activeFilters.length > 0 ? 'block' : 'none';
            }
            
            // 필터 폼 초기화
            resetFilterForm();
            
            // 필드에 기본값 설정 (첫 번째 실제 옵션)
            if (filterField && filterField.options.length > 1) {
                filterField.value = filterField.options[1].value; // 첫 번째 실제 옵션 선택 (0번은 보통 빈 값)
                
                // 필드 변경 이벤트 발생시켜 연산자와 값 필드 업데이트
                filterField.dispatchEvent(new Event('change'));
            }
        } else {
            alert('필터 폼을 찾을 수 없습니다. 페이지를 새로고침해 주세요.');
        }
    }
    
    // 필터 폼 숨기기
    function hideFilterForm() {
        if (filterForm) {
            filterForm.style.display = 'none';
        }
    }
    
    // 필터 폼 초기화
    function resetFilterForm() {
        if (!filterField) return;
        
        // 필드 초기화
        if (filterField.options.length > 0) {
            filterField.selectedIndex = 0;
        }
        
        // 연산자 초기화
        if (filterOperator) {
            updateOperatorOptions();
        }
        
        // 필터 값 초기화
        updateValueField();
        
        // 조인 초기화
        if (filterJoin) {
            filterJoin.value = 'and';
        }
    }
    
    // 연산자 옵션 업데이트
    function updateOperatorOptions() {
        if (!filterField || !filterOperator) return;
        
        const field = filterField.value;
        filterOperator.innerHTML = ''; // 기존 옵션 초기화
        
        if (field === 'action' || field === 'usage_status' || field === 'enable') {
            // 동작, 사용여부, 상태 필드는 equals/not_equals만 사용
            addOperatorOption('equals', '일치');
            addOperatorOption('not_equals', '불일치');
        } else {
            // 다른 필드들은 모든 연산자 사용
            addOperatorOption('contains', '포함');
            addOperatorOption('not_contains', '미포함');
            addOperatorOption('equals', '일치');
            addOperatorOption('not_equals', '불일치');
            addOperatorOption('starts_with', '시작');
            addOperatorOption('ends_with', '끝');
        }
    }
    
    // 연산자 옵션 추가
    function addOperatorOption(value, text) {
        if (!filterOperator) return;
        
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        filterOperator.appendChild(option);
    }
    
    // 필터 값 입력 필드 업데이트
    function updateValueField() {
        if (!filterField) return;
        
        const field = filterField.value;
        
        // 기존 필터 값 요소 찾기
        const oldValueElement = document.querySelector('.filter-value');
        if (!oldValueElement) {
            return;
        }
        
        // 새 필터 값 요소 생성
        let newValueElement;
        
        if (field === 'action') {
            // 동작 선택 필드
            newValueElement = document.createElement('select');
            newValueElement.className = 'filter-value';
            const options = [
                { value: 'allow', text: '허용' },
                { value: 'deny', text: '차단' }
            ];
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                newValueElement.appendChild(option);
            });
        } else if (field === 'usage_status') {
            // 사용 여부 선택 필드
            newValueElement = document.createElement('select');
            newValueElement.className = 'filter-value';
            const options = [
                { value: 'true', text: '사용' },
                { value: 'false', text: '미사용' }
            ];
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                newValueElement.appendChild(option);
            });
        } else if (field === 'enable') {
            // 활성화 상태 선택 필드
            newValueElement = document.createElement('select');
            newValueElement.className = 'filter-value';
            const options = [
                { value: 'true', text: '활성화' },
                { value: 'false', text: '비활성화' }
            ];
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                newValueElement.appendChild(option);
            });
        } else {
            // 일반 텍스트 입력 필드
            newValueElement = document.createElement('input');
            newValueElement.type = 'text';
            newValueElement.className = 'filter-value';
            newValueElement.placeholder = '필터값 입력';
        }
        
        // 기존 요소를 새 요소로 교체
        if (oldValueElement.parentElement) {
            oldValueElement.parentElement.replaceChild(newValueElement, oldValueElement);
        }
    }
    
    // 필터 적용
    function applyFilter() {
        if (!filterField) {
            return;
        }
        
        const field = filterField.value;
        
        if (!field) {
            alert('필터 필드를 선택해주세요.');
            return;
        }
        
        const operator = filterOperator ? filterOperator.value : 'contains';
        
        // 필터 값 요소 찾기
        const valueElement = document.querySelector('.filter-value');
        if (!valueElement) {
            alert('필터 값을 찾을 수 없습니다. 페이지를 새로고침해 주세요.');
            return;
        }
        
        const value = valueElement.value.trim();
        
        const join = activeFilters.length > 0 && filterJoin ? filterJoin.value : null;

        const filter = {
            field,
            operator,
            value,
            join
        };

        // 첫 번째 필터의 join 속성 제거
        if (activeFilters.length === 0) {
            delete filter.join;
        }

        activeFilters.push(filter);
        saveFilters();
        updateActiveFiltersUI();
        hideFilterForm();
        loadPolicies(1); // 필터 적용 후 첫 페이지로 이동
    }
    
    // 필터 저장
    function saveFilters() {
        localStorage.setItem('activeFilters', JSON.stringify(activeFilters));
    }
    
    // 활성 필터 UI 업데이트
    function updateActiveFiltersUI() {
        if (!activeFiltersContainer) return;
        
        activeFiltersContainer.innerHTML = '';
        
        if (activeFilters.length === 0) return;
        
        // 괄호 그룹 추적을 위한 변수
        let openGroups = 0;
        
        activeFilters.forEach((filter, index) => {
            const tag = document.createElement('div');
            tag.className = 'filter-tag';
            
            // 필드 레이블 가져오기
            let fieldLabel = filter.field;
            if (filterField) {
                const option = filterField.querySelector(`option[value="${filter.field}"]`);
                if (option) {
                    fieldLabel = option.textContent;
                }
            }
            
            const operatorLabel = getOperatorLabel(filter.operator);
            const valueLabel = getValueLabel(filter.field, filter.value);
            
            let filterText = '';
            
            // 조인 연산자 표시 (두 번째 필터부터)
            if (index > 0) {
                // 이전 필터가 OR 그룹을 닫는 경우
                if (index > 1 && 
                    activeFilters[index-1].join === 'or' && 
                    filter.join === 'and') {
                    filterText += `<span class="group-close">)</span> `;
                    openGroups--;
                }
                
                // 조인 연산자 표시
                filterText += `<span class="join-operator ${filter.join === 'and' ? 'join-and' : 'join-or'}">${filter.join.toUpperCase()}</span> `;
                
                // OR 연산자인 경우 새 그룹 시작
                if (filter.join === 'or' && 
                    (index === 1 || activeFilters[index-1].join === 'and')) {
                    filterText += `<span class="group-open">(</span>`;
                    openGroups++;
                }
            }
            
            // 필터 조건 표시
            filterText += `<span class="filter-text">${fieldLabel} ${operatorLabel} "${valueLabel}"</span>`;
            
            // 마지막 필터이고 열린 그룹이 있는 경우 닫기
            if (index === activeFilters.length - 1 && openGroups > 0) {
                filterText += `<span class="group-close">)</span>`;
            }
            
            tag.innerHTML = `
                ${filterText}
                <span class="remove-filter" data-index="${index}">×</span>
            `;
            
            tag.querySelector('.remove-filter').addEventListener('click', () => removeFilter(index));
            activeFiltersContainer.appendChild(tag);
        });
    }
    
    // 연산자 레이블 가져오기
    function getOperatorLabel(operator) {
        const labels = {
            'contains': '포함',
            'not_contains': '미포함',
            'equals': '일치',
            'not_equals': '불일치',
            'starts_with': '시작',
            'ends_with': '끝'
        };
        return labels[operator] || operator;
    }
    
    // 값 레이블 가져오기
    function getValueLabel(field, value) {
        if (field === 'action') {
            return value === 'allow' ? '허용' : '차단';
        } else if (field === 'usage_status') {
            return value === 'true' ? '사용' : '미사용';
        } else if (field === 'enable') {
            return value === 'true' ? '활성화' : '비활성화';
        }
        return value;
    }
    
    // 필터 제거
    function removeFilter(index) {
        activeFilters.splice(index, 1);
        saveFilters();
        updateActiveFiltersUI();
        loadPolicies(1); // 필터 제거 후 첫 페이지로 이동
    }
    
    // 모든 필터 초기화
    function clearAllFilters() {
        activeFilters = [];
        localStorage.removeItem('activeFilters');
        updateActiveFiltersUI();
        loadPolicies(1); // 필터 초기화 후 첫 페이지로 이동
    }
    
    // 페이지 로드 시 필터 복원 및 적용
    // 필터 초기화 (코드 변경으로 인한 호환성 문제 방지)
    const shouldResetFilters = false; // 필터값 유지
    
    if (shouldResetFilters) {
        activeFilters = [];
        localStorage.removeItem('activeFilters');
        updateActiveFiltersUI();
    } else if (activeFilters.length > 0) {
        updateActiveFiltersUI();
        // 페이지 로드 시 필터가 있으면 적용 (loadPolicies는 아래에서 호출됨)
    }
    
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
        
        // API 요청 데이터 구성
        const requestData = {
            page: parseInt(page),
            per_page: parseInt(perPage),
            device_id: deviceId,
            status: status,
            search: search,
            filters: activeFilters
        };

        // AJAX 요청
        fetch('/policies/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('서버 응답 오류: ' + response.status);
            }
            return response.json();
        })
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
            if (tableBody) {
                tableBody.style.opacity = '1';
            }
            alert('데이터를 불러오는 중 오류가 발생했습니다.');
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