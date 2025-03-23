/**
 * 객체 필터 관련 기능을 담당하는 모듈
 */

// 전역 변수
let activeFilters = [];

/**
 * 필터 모듈 초기화
 * @param {Function} onFilterChange - 필터 변경 시 호출될 콜백 함수
 * @returns {Object} - 필터 관련 메서드를 포함한 객체
 */
export function initFilters(onFilterChange) {
    // 저장된 필터 불러오기
    activeFilters = JSON.parse(sessionStorage.getItem('objectsActiveFilters') || '[]');
    
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
        clearFilterBtn.addEventListener('click', () => clearAllFilters(onFilterChange));
    }
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => applyFilter(onFilterChange));
    }
    if (cancelFilterBtn) {
        cancelFilterBtn.addEventListener('click', hideFilterForm);
    }
    
    // 초기 UI 업데이트
    updateActiveFiltersUI();
    
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
                filterField.value = filterField.options[1].value;
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
        filterOperator.innerHTML = '';
        
        // 필드 유형에 따라 적절한 연산자 옵션 추가
        const operators = getOperatorsForField(field);
        operators.forEach(op => {
            const option = document.createElement('option');
            option.value = op.value;
            option.textContent = op.text;
            filterOperator.appendChild(option);
        });
    }
    
    // 필드 유형에 따른 연산자 옵션 가져오기
    function getOperatorsForField(field) {
        // 기본 연산자 (모든 필드에 적용)
        const defaultOperators = [
            { value: 'contains', text: '포함' },
            { value: 'not_contains', text: '미포함' },
            { value: 'equals', text: '일치' },
            { value: 'not_equals', text: '불일치' }
        ];
        
        // 필드별 특수 연산자
        switch (field) {
            case 'firewall_type':
                return [
                    { value: 'equals', text: '일치' },
                    { value: 'not_equals', text: '불일치' }
                ];
            case 'type':
                return [
                    { value: 'equals', text: '일치' },
                    { value: 'not_equals', text: '불일치' }
                ];
            default:
                return defaultOperators;
        }
    }
    
    // 필터 값 입력 필드 업데이트
    function updateValueField() {
        if (!filterField) return;
        
        const field = filterField.value;
        const oldValueElement = document.querySelector('.filter-value');
        if (!oldValueElement) return;
        
        let newValueElement;
        
        // 필드 유형에 따라 적절한 입력 요소 생성
        switch (field) {
            case 'firewall_type':
                newValueElement = createSelectElement([
                    { value: 'ngf', text: 'NGF' },
                    { value: 'mf2', text: 'MF2' },
                    { value: 'mock', text: 'Mock' }
                ]);
                break;
            case 'type':
                newValueElement = createSelectElement([
                    { value: 'ip', text: 'IP' },
                    { value: 'network', text: '네트워크' },
                    { value: 'fqdn', text: 'FQDN' },
                    { value: 'url', text: 'URL' },
                    { value: 'service', text: '서비스' },
                    { value: 'service_group', text: '서비스 그룹' },
                    { value: 'address_group', text: '주소 그룹' }
                ]);
                break;
            default:
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
    
    // 선택 요소 생성 헬퍼 함수
    function createSelectElement(options) {
        const select = document.createElement('select');
        select.className = 'filter-value';
        
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            select.appendChild(option);
        });
        
        return select;
    }
    
    // 필터 적용
    function applyFilter(callback) {
        if (!filterField) return;
        
        const field = filterField.value;
        if (!field) {
            alert('필터 필드를 선택해주세요.');
            return;
        }
        
        const operator = filterOperator ? filterOperator.value : 'contains';
        const valueElement = document.querySelector('.filter-value');
        if (!valueElement) {
            alert('필터 값을 찾을 수 없습니다.');
            return;
        }
        
        const value = valueElement.value.trim();
        if (!value) {
            alert('필터 값을 입력해주세요.');
            return;
        }
        
        const join = activeFilters.length > 0 && filterJoin ? filterJoin.value : null;
        
        // 필터 객체 생성
        const filter = { field, operator, value };
        if (join) filter.join = join;
        
        // 필터 추가
        activeFilters.push(filter);
        
        // 세션 스토리지에 저장
        sessionStorage.setItem('objectsActiveFilters', JSON.stringify(activeFilters));
        
        // UI 업데이트
        updateActiveFiltersUI();
        hideFilterForm();
        
        // 콜백 호출
        if (typeof callback === 'function') {
            callback();
        }
    }
    
    // 모든 필터 제거
    function clearAllFilters(callback) {
        activeFilters = [];
        sessionStorage.removeItem('objectsActiveFilters');
        updateActiveFiltersUI();
        
        if (typeof callback === 'function') {
            callback();
        }
    }
    
    // 특정 필터 제거
    function removeFilter(index, callback) {
        activeFilters.splice(index, 1);
        sessionStorage.setItem('objectsActiveFilters', JSON.stringify(activeFilters));
        updateActiveFiltersUI();
        
        if (typeof callback === 'function') {
            callback();
        }
    }
    
    // 활성 필터 UI 업데이트
    function updateActiveFiltersUI() {
        if (!activeFiltersContainer) return;
        
        if (activeFilters.length === 0) {
            activeFiltersContainer.innerHTML = '<p class="text-muted">적용된 필터가 없습니다.</p>';
            return;
        }
        
        const html = activeFilters.map((filter, index) => `
            <div class="filter-tag">
                <span class="filter-text">
                    ${getFieldLabel(filter.field)} 
                    ${getOperatorLabel(filter.operator)} 
                    "${filter.value}"
                    ${filter.join ? ` ${filter.join === 'and' ? '그리고' : '또는'}` : ''}
                </span>
                <button type="button" class="remove-filter" data-index="${index}">&times;</button>
            </div>
        `).join('');
        
        activeFiltersContainer.innerHTML = html;
        
        // 필터 제거 버튼 이벤트 리스너
        activeFiltersContainer.querySelectorAll('.remove-filter').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                if (!isNaN(index)) {
                    removeFilter(index, onFilterChange);
                }
            });
        });
    }
    
    // 필드 라벨 가져오기
    function getFieldLabel(field) {
        const fieldMap = {
            'device_name': '장비명',
            'name': '객체명',
            'type': '객체 유형',
            'value': '값',
            'firewall_type': '방화벽 유형',
            'last_sync': '마지막 동기화'
        };
        return fieldMap[field] || field;
    }
    
    // 연산자 라벨 가져오기
    function getOperatorLabel(operator) {
        const operatorMap = {
            'contains': '포함',
            'not_contains': '미포함',
            'equals': '일치',
            'not_equals': '불일치',
            'starts_with': '시작',
            'ends_with': '끝'
        };
        return operatorMap[operator] || operator;
    }
    
    // 활성 필터 가져오기
    function getActiveFilters() {
        return activeFilters;
    }
    
    // 공개 메서드 반환
    return {
        getActiveFilters,
        clearAllFilters: (callback) => clearAllFilters(callback),
        removeFilter: (index, callback) => removeFilter(index, callback)
    };
} 