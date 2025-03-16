/**
 * 방화벽 객체 필터 관리 JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    // 필터 관련 요소
    const addFilterBtn = document.getElementById('addFilterBtn');
    const clearFilterBtn = document.getElementById('clearFilterBtn');
    const filterContainer = document.getElementById('activeFilters');
    
    // 필터 상태 관리
    let filters = [];
    let filterIdCounter = 0;
    
    // 필터 필드 옵션 - 로드 함수 호출 전에 정의
    const filterFields = [
        { value: 'device_name', text: '장비명' },
        { value: 'name', text: '객체명' },
        { value: 'type', text: '객체 유형' },
        { value: 'value', text: '값' },
        { value: 'firewall_type', text: '방화벽 유형' }
    ];
    
    // 로컬 스토리지에서 필터 불러오기
    loadFiltersFromStorage();
    
    // 필터 폼 요소
    const filterForm = document.getElementById('filterForm');
    const filterFieldSelect = filterForm ? filterForm.querySelector('.filter-field') : null;
    const filterOperatorSelect = filterForm ? filterForm.querySelector('.filter-operator') : null;
    const filterValueInput = filterForm ? filterForm.querySelector('.filter-value') : null;
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const cancelFilterBtn = document.getElementById('cancelFilterBtn');
    
    // 필터 폼 이벤트 리스너 설정
    if (filterForm && applyFilterBtn && cancelFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            if (!filterValueInput || !filterValueInput.value.trim()) {
                alert('필터 값을 입력해주세요.');
                return;
            }
            
            // 필터 추가
            addFilter(
                filterFieldSelect.value,
                filterOperatorSelect.value,
                filterValueInput.value.trim()
            );
            
            // 폼 초기화 및 숨기기
            filterValueInput.value = '';
            filterForm.style.display = 'none';
        });
        
        cancelFilterBtn.addEventListener('click', function() {
            // 폼 초기화 및 숨기기
            filterValueInput.value = '';
            filterForm.style.display = 'none';
        });
        
        // 필드 변경 시 연산자 업데이트
        if (filterFieldSelect) {
            filterFieldSelect.addEventListener('change', function() {
                const operators = getOperatorsForField(this.value);
                updateSelectOptions(filterOperatorSelect, operators);
            });
        }
    }
    
    /**
     * 필터 필드에 따른 연산자 옵션 가져오기
     */
    function getOperatorsForField(field) {
        const stringOperators = [
            { value: 'contains', text: '포함' },
            { value: 'not_contains', text: '미포함' },
            { value: 'equals', text: '일치' },
            { value: 'not_equals', text: '불일치' },
            { value: 'starts_with', text: '시작' },
            { value: 'ends_with', text: '끝남' }
        ];
        
        // 모든 필드는 문자열 연산자 사용
        return stringOperators;
    }
    
    /**
     * 필터 추가 버튼 클릭 이벤트
     */
    addFilterBtn.addEventListener('click', function() {
        // 필터 폼 표시
        if (filterForm) {
            filterForm.style.display = 'block';
        } else {
            // 폼이 없으면 직접 필터 추가
            addFilter();
        }
    });
    
    /**
     * 필터 초기화 버튼 클릭 이벤트
     */
    clearFilterBtn.addEventListener('click', function() {
        clearFilters();
    });
    
    /**
     * 로컬 스토리지에서 필터 불러오기
     */
    function loadFiltersFromStorage() {
        try {
            const savedFilters = localStorage.getItem('objectFilters');
            if (savedFilters) {
                const parsedFilters = JSON.parse(savedFilters);
                
                // 기존 필터 초기화
                filters = [];
                
                // 저장된 필터 추가
                parsedFilters.forEach(filter => {
                    // 필드, 연산자, 값이 모두 있는 경우에만 필터 추가
                    if (filter.field && filter.operator && filter.value) {
                        addFilter(filter.field, filter.operator, filter.value);
                    }
                });
            }
        } catch (error) {
            console.error('필터 로드 오류:', error);
        }
    }
    
    /**
     * 필터를 로컬 스토리지에 저장
     */
    function saveFiltersToStorage() {
        try {
            const filtersToSave = filters.map(f => ({
                field: f.field,
                operator: f.operator,
                value: f.value
            }));
            localStorage.setItem('objectFilters', JSON.stringify(filtersToSave));
        } catch (error) {
            console.error('필터 저장 오류:', error);
        }
    }
    
    /**
     * 새 필터 추가 함수
     */
    function addFilter(fieldValue = '', operatorValue = '', filterValue = '') {
        // filterContainer가 없으면 오류 방지
        if (!filterContainer) {
            console.error('필터 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        // 필드, 연산자, 값이 모두 있는 경우에만 필터 추가
        if (!fieldValue || !operatorValue || !filterValue) {
            return;
        }
        
        const filterId = `filter-${filterIdCounter++}`;
        
        // 필터 태그 생성
        const filterTag = document.createElement('div');
        filterTag.className = 'filter-tag';
        filterTag.setAttribute('data-filter-id', filterId);
        
        // 필드 및 연산자 텍스트 가져오기
        const fieldText = getTextForValue(filterFields, fieldValue);
        const operatorText = getTextForValue(getOperatorsForField(fieldValue), operatorValue);
        
        // 필터 태그 내용 설정
        filterTag.innerHTML = `
            <span class="filter-tag-text">${fieldText} ${operatorText} "${filterValue}"</span>
            <button type="button" class="filter-tag-remove" aria-label="필터 제거">
                <i data-feather="x"></i>
            </button>
        `;
        
        // 제거 버튼 이벤트 리스너
        const removeBtn = filterTag.querySelector('.filter-tag-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                removeFilter(filterId);
            });
        }
        
        // 필터 태그 추가
        filterContainer.appendChild(filterTag);
        
        // Feather 아이콘 초기화
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        
        // 필터 목록에 추가
        filters.push({
            id: filterId,
            field: fieldValue,
            operator: operatorValue,
            value: filterValue
        });
        
        // 필터 저장
        saveFiltersToStorage();
        
        // 필터 변경 이벤트 발생
        dispatchFiltersUpdatedEvent();
    }
    
    /**
     * 필터 제거 함수
     */
    function removeFilter(filterId) {
        const filterTag = document.querySelector(`[data-filter-id="${filterId}"]`);
        if (filterTag) {
            filterTag.remove();
            
            // 필터 목록에서 제거
            filters = filters.filter(f => f.id !== filterId);
            
            // 필터 저장
            saveFiltersToStorage();
            
            // 필터 변경 이벤트 발생
            dispatchFiltersUpdatedEvent();
        }
    }
    
    /**
     * 모든 필터 초기화 함수
     */
    function clearFilters() {
        if (filterContainer) {
            filterContainer.innerHTML = '';
        }
        filters = [];
        
        // 로컬 스토리지에서 필터 제거
        localStorage.removeItem('objectFilters');
        
        // 필터 변경 이벤트 발생
        dispatchFiltersUpdatedEvent();
    }
    
    /**
     * 필터 변경 이벤트 발생 함수
     */
    function dispatchFiltersUpdatedEvent() {
        const event = new CustomEvent('filtersUpdated', {
            detail: {
                filters: filters.map(f => ({
                    field: f.field,
                    operator: f.operator,
                    value: f.value
                }))
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 값에 해당하는 텍스트 가져오기
     */
    function getTextForValue(options, value) {
        const option = options.find(opt => opt.value === value);
        return option ? option.text : value;
    }
    
    /**
     * 셀렉트 요소 생성 함수
     */
    function createSelectElement(id, options, selectedValue = '', placeholder = null) {
        const select = document.createElement('select');
        select.id = id;
        
        if (placeholder) {
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = placeholder;
            placeholderOption.disabled = true;
            placeholderOption.selected = !selectedValue;
            select.appendChild(placeholderOption);
        }
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            if (option.value === selectedValue) {
                optionElement.selected = true;
            }
            select.appendChild(optionElement);
        });
        
        return select;
    }
    
    /**
     * 셀렉트 옵션 업데이트 함수
     */
    function updateSelectOptions(selectElement, options, keepSelected = false) {
        if (!selectElement) return;
        
        const selectedValue = keepSelected ? selectElement.value : '';
        
        // 기존 옵션 제거 (첫 번째 옵션 제외)
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }
        
        // 새 옵션 추가
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            if (option.value === selectedValue) {
                optionElement.selected = true;
            }
            selectElement.appendChild(optionElement);
        });
    }
    
    // 필터 가져오기 이벤트 리스너
    document.addEventListener('getFilters', function(e) {
        e.detail.filters = filters.map(f => ({
            field: f.field,
            operator: f.operator,
            value: f.value
        }));
    });
}); 