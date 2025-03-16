/**
 * 정책 관리 메인 모듈
 */

// 모듈 가져오기
import { initFilters } from './filter.js';
import { initPagination } from './pagination.js';
import { initAPI } from './api.js';
import { initExport } from './export.js';

/**
 * 정책 관리 모듈 초기화
 */
export function initPolicies() {
    // 상태 변수
    let selectedPolicies = [];
    let sortField = 'id';
    let sortOrder = 'asc';
    
    // DOM 요소
    const policiesTable = document.getElementById('policiesTable');
    const policiesTableBody = document.getElementById('policiesTableBody');
    const selectAllCheckbox = document.getElementById('selectAll');
    const bulkActionButtons = document.querySelectorAll('.bulk-action');
    const sortableHeaders = document.querySelectorAll('.sortable');
    
    // 모듈 초기화
    const api = initAPI();
    const filters = initFilters(loadPolicies);
    const pagination = initPagination(loadPolicies);
    const exporter = initExport(getAllPolicies);
    
    // 이벤트 리스너 등록
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
    }
    
    if (sortableHeaders) {
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => handleSort(header.dataset.field));
        });
    }
    
    if (bulkActionButtons) {
        bulkActionButtons.forEach(button => {
            button.addEventListener('click', () => handleBulkAction(button.dataset.action));
        });
    }
    
    // 초기 데이터 로드
    loadPolicies();
    
    /**
     * 정책 목록 로드
     */
    async function loadPolicies() {
        try {
            // 로딩 표시
            showLoading();
            
            // 페이지네이션 상태 초기화 (페이지 크기 변경 시에만 필요)
            pagination.resetState();
            
            // API 파라미터 설정
            const params = {
                page: pagination.getCurrentPage(),
                pageSize: pagination.getPageSize(),
                filters: filters.getActiveFilters(),
                sortField,
                sortOrder
            };
            
            console.log('정책 목록 로드 파라미터:', params);
            
            // 정책 데이터 가져오기
            const data = await api.getPolicies(params);
            
            // 페이지네이션 이벤트 바인딩
            pagination.bindEvents();
            
            // 현재 페이지 업데이트
            pagination.updateCurrentPage();
            
            // 체크박스 이벤트 다시 바인딩
            bindCheckboxEvents();
            
            // 로딩 숨기기
            hideLoading();
        } catch (error) {
            console.error('정책 목록 로드 중 오류 발생:', error);
            alert('정책 목록을 불러오는 중 오류가 발생했습니다.');
            hideLoading();
        }
    }
    
    /**
     * 체크박스 이벤트 바인딩
     */
    function bindCheckboxEvents() {
        // 개별 체크박스 이벤트
        const checkboxes = document.querySelectorAll('.policy-checkbox');
        checkboxes.forEach(checkbox => {
            // 이미 이벤트가 바인딩되어 있는지 확인
            if (checkbox.dataset.bound === 'true') return;
            
            checkbox.dataset.bound = 'true';
            checkbox.addEventListener('change', function() {
                const policyId = parseInt(this.value || this.dataset.id);
                
                if (this.checked) {
                    // 선택된 정책 추가
                    if (!selectedPolicies.includes(policyId)) {
                        selectedPolicies.push(policyId);
                    }
                } else {
                    // 선택된 정책 제거
                    selectedPolicies = selectedPolicies.filter(id => id !== policyId);
                    
                    // 전체 선택 체크박스 해제
                    if (selectAllCheckbox && selectAllCheckbox.checked) {
                        selectAllCheckbox.checked = false;
                    }
                }
                
                // 일괄 작업 버튼 상태 업데이트
                updateBulkActionButtons();
            });
        });
    }
    
    /**
     * 전체 선택 처리
     */
    function handleSelectAll() {
        const checkboxes = document.querySelectorAll('.policy-checkbox');
        
        if (selectAllCheckbox.checked) {
            // 모든 체크박스 선택
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
                const policyId = parseInt(checkbox.value);
                if (!selectedPolicies.includes(policyId)) {
                    selectedPolicies.push(policyId);
                }
            });
        } else {
            // 모든 체크박스 해제
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            selectedPolicies = [];
        }
        
        // 일괄 작업 버튼 상태 업데이트
        updateBulkActionButtons();
    }
    
    /**
     * 일괄 작업 버튼 상태 업데이트
     */
    function updateBulkActionButtons() {
        if (bulkActionButtons) {
            bulkActionButtons.forEach(button => {
                button.disabled = selectedPolicies.length === 0;
            });
        }
    }
    
    /**
     * 정렬 처리
     * @param {string} field - 정렬할 필드
     */
    function handleSort(field) {
        if (sortField === field) {
            // 같은 필드를 클릭한 경우 정렬 순서 변경
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            // 다른 필드를 클릭한 경우 해당 필드로 오름차순 정렬
            sortField = field;
            sortOrder = 'asc';
        }
        
        // 정렬 아이콘 업데이트
        updateSortIcons();
        
        // 데이터 다시 로드
        loadPolicies();
    }
    
    /**
     * 정렬 아이콘 업데이트
     */
    function updateSortIcons() {
        if (sortableHeaders) {
            sortableHeaders.forEach(header => {
                // 모든 헤더에서 정렬 아이콘 제거
                header.classList.remove('sort-asc', 'sort-desc');
                
                // 현재 정렬 필드에 정렬 아이콘 추가
                if (header.dataset.field === sortField) {
                    header.classList.add(sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
                }
            });
        }
    }
    
    /**
     * 일괄 작업 처리
     * @param {string} action - 작업 유형 (delete, enable, disable)
     */
    async function handleBulkAction(action) {
        if (selectedPolicies.length === 0) {
            alert('선택된 정책이 없습니다.');
            return;
        }
        
        let confirmMessage = '';
        let successMessage = '';
        
        switch (action) {
            case 'delete':
                confirmMessage = `선택한 ${selectedPolicies.length}개의 정책을 삭제하시겠습니까?`;
                successMessage = '선택한 정책이 삭제되었습니다.';
                break;
            case 'enable':
                confirmMessage = `선택한 ${selectedPolicies.length}개의 정책을 활성화하시겠습니까?`;
                successMessage = '선택한 정책이 활성화되었습니다.';
                break;
            case 'disable':
                confirmMessage = `선택한 ${selectedPolicies.length}개의 정책을 비활성화하시겠습니까?`;
                successMessage = '선택한 정책이 비활성화되었습니다.';
                break;
            default:
                alert('지원하지 않는 작업입니다.');
                return;
        }
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        try {
            // 로딩 표시
            showLoading();
            
            switch (action) {
                case 'delete':
                    await api.bulkDeletePolicies(selectedPolicies);
                    break;
                case 'enable':
                    await api.bulkTogglePolicyStatus(selectedPolicies, true);
                    break;
                case 'disable':
                    await api.bulkTogglePolicyStatus(selectedPolicies, false);
                    break;
            }
            
            // 성공 메시지 표시
            alert(successMessage);
            
            // 선택된 정책 초기화
            selectedPolicies = [];
            
            // 전체 선택 체크박스 해제
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
            }
            
            // 일괄 작업 버튼 상태 업데이트
            updateBulkActionButtons();
            
            // 데이터 다시 로드
            loadPolicies();
        } catch (error) {
            console.error(`일괄 작업 중 오류 발생 (${action}):`, error);
            alert('작업 처리 중 오류가 발생했습니다.');
        } finally {
            // 로딩 숨기기
            hideLoading();
        }
    }
    
    /**
     * 모든 정책 데이터 가져오기 (엑셀 내보내기용)
     * @returns {Promise<Object>} - 모든 정책 데이터
     */
    async function getAllPolicies() {
        try {
            // 로딩 표시
            showLoading();
            
            // 검색 파라미터 가져오기
            const deviceId = document.getElementById('deviceFilter')?.value || '';
            const status = document.getElementById('statusFilter')?.value || '';
            const search = document.getElementById('policySearch')?.value || '';
            
            // API 파라미터 설정 (페이지 크기를 최대로 설정)
            const params = {
                page: 1,
                pageSize: 1000, // 최대 페이지 크기
                filters: filters.getActiveFilters(),
                sortField,
                sortOrder
            };
            
            console.log('엑셀 내보내기용 데이터 로드 파라미터:', params);
            
            // 정책 데이터 가져오기
            const data = await api.getPolicies(params);
            
            // 필터 정보 추가
            data.filters = filters.getActiveFilters();
            data.device_id = deviceId;
            data.status = status;
            data.search = search;
            
            // 로딩 숨기기
            hideLoading();
            
            return data;
        } catch (error) {
            console.error('모든 정책 데이터 가져오기 중 오류 발생:', error);
            hideLoading();
            throw error;
        }
    }
    
    /**
     * 정책 테이블 업데이트
     * @param {Array} policies - 정책 데이터 배열
     */
    function updatePoliciesTable(policies) {
        if (!policiesTableBody) return;
        
        // 테이블 내용 초기화
        policiesTableBody.innerHTML = '';
        
        if (!policies || policies.length === 0) {
            // 데이터가 없는 경우 메시지 표시
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'empty-row';
            emptyRow.innerHTML = `
                <td colspan="10" class="text-center py-4">
                    <div class="empty-message">
                        <i class="fas fa-info-circle me-2"></i>
                        표시할 정책이 없습니다.
                    </div>
                </td>
            `;
            policiesTableBody.appendChild(emptyRow);
            
            // 전체 선택 체크박스 비활성화
            if (selectAllCheckbox) {
                selectAllCheckbox.disabled = true;
                selectAllCheckbox.checked = false;
            }
            
            return;
        }
        
        // 전체 선택 체크박스 활성화
        if (selectAllCheckbox) {
            selectAllCheckbox.disabled = false;
        }
        
        // 정책 행 생성
        policies.forEach(policy => {
            const row = document.createElement('tr');
            row.dataset.id = policy.id;
            
            // 선택된 정책인 경우 행 강조
            if (selectedPolicies.includes(policy.id)) {
                row.classList.add('selected');
            }
            
            // 행 내용 생성
            row.innerHTML = `
                <td class="text-center">
                    <input type="checkbox" class="policy-checkbox" data-id="${policy.id}" ${selectedPolicies.includes(policy.id) ? 'checked' : ''}>
                </td>
                <td>${policy.id}</td>
                <td>
                    <a href="/policies/${policy.id}" class="policy-name">${policy.name}</a>
                </td>
                <td>${formatAddresses(policy.source_addresses)}</td>
                <td>${formatAddresses(policy.destination_addresses)}</td>
                <td>${formatServices(policy.services)}</td>
                <td class="text-center">
                    <span class="badge ${policy.action === 'allow' ? 'bg-success' : 'bg-danger'}">
                        ${policy.action === 'allow' ? '허용' : '차단'}
                    </span>
                </td>
                <td class="text-center">
                    <span class="badge ${policy.usage_status ? 'bg-primary' : 'bg-secondary'}">
                        ${policy.usage_status ? '사용' : '미사용'}
                    </span>
                </td>
                <td class="text-center">
                    <div class="form-check form-switch d-inline-block">
                        <input class="form-check-input status-toggle" type="checkbox" 
                            data-id="${policy.id}" ${policy.enable ? 'checked' : ''}>
                    </div>
                </td>
                <td class="text-end">
                    <div class="btn-group">
                        <a href="/policies/${policy.id}" class="btn btn-sm btn-outline-primary">
                            <i class="fas fa-eye"></i>
                        </a>
                        <a href="/policies/${policy.id}/edit" class="btn btn-sm btn-outline-secondary">
                            <i class="fas fa-edit"></i>
                        </a>
                        <button class="btn btn-sm btn-outline-danger delete-policy" data-id="${policy.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            policiesTableBody.appendChild(row);
        });
        
        // 체크박스 이벤트 리스너 등록
        const checkboxes = policiesTableBody.querySelectorAll('.policy-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => handlePolicySelect(checkbox));
        });
        
        // 상태 토글 이벤트 리스너 등록
        const toggles = policiesTableBody.querySelectorAll('.status-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', () => handleStatusToggle(toggle));
        });
        
        // 삭제 버튼 이벤트 리스너 등록
        const deleteButtons = policiesTableBody.querySelectorAll('.delete-policy');
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => handlePolicyDelete(button.dataset.id));
        });
    }
    
    /**
     * 정책 선택 처리
     * @param {HTMLElement} checkbox - 체크박스 요소
     */
    function handlePolicySelect(checkbox) {
        const policyId = parseInt(checkbox.dataset.id);
        
        if (checkbox.checked) {
            // 정책 선택
            if (!selectedPolicies.includes(policyId)) {
                selectedPolicies.push(policyId);
            }
        } else {
            // 정책 선택 해제
            selectedPolicies = selectedPolicies.filter(id => id !== policyId);
            
            // 전체 선택 체크박스 해제
            if (selectAllCheckbox && selectAllCheckbox.checked) {
                selectAllCheckbox.checked = false;
            }
        }
        
        // 선택된 행 강조
        const row = policiesTableBody.querySelector(`tr[data-id="${policyId}"]`);
        if (row) {
            row.classList.toggle('selected', checkbox.checked);
        }
        
        // 일괄 작업 버튼 업데이트
        updateBulkActionButtons();
    }
    
    /**
     * 정책 상태 토글 처리
     * @param {HTMLElement} toggle - 토글 요소
     */
    async function handleStatusToggle(toggle) {
        try {
            const policyId = parseInt(toggle.dataset.id);
            const enabled = toggle.checked;
            
            // 로딩 표시
            showLoading();
            
            // API 호출
            await api.togglePolicyStatus(policyId, enabled);
            
            // 로딩 숨기기
            hideLoading();
            
            // 성공 메시지
            showToast('success', `정책 상태가 ${enabled ? '활성화' : '비활성화'}되었습니다.`);
        } catch (error) {
            console.error('정책 상태 변경 중 오류 발생:', error);
            
            // 토글 상태 되돌리기
            toggle.checked = !toggle.checked;
            
            // 오류 메시지
            showToast('error', '정책 상태 변경 중 오류가 발생했습니다.');
            
            // 로딩 숨기기
            hideLoading();
        }
    }
    
    /**
     * 정책 삭제 처리
     * @param {number} policyId - 정책 ID
     */
    async function handlePolicyDelete(policyId) {
        try {
            // 삭제 확인
            if (!confirm('정책을 삭제하시겠습니까?')) {
                return;
            }
            
            // 로딩 표시
            showLoading();
            
            // API 호출
            await api.deletePolicy(policyId);
            
            // 정책 목록 다시 로드
            await loadPolicies();
            
            // 성공 메시지
            showToast('success', '정책이 삭제되었습니다.');
        } catch (error) {
            console.error('정책 삭제 중 오류 발생:', error);
            
            // 오류 메시지
            showToast('error', '정책 삭제 중 오류가 발생했습니다.');
            
            // 로딩 숨기기
            hideLoading();
        }
    }
    
    /**
     * 주소 배열 포맷팅
     * @param {Array} addresses - 주소 배열
     * @returns {string} - 포맷팅된 주소 HTML
     */
    function formatAddresses(addresses) {
        if (!addresses || addresses.length === 0) {
            return '<span class="text-muted">Any</span>';
        }
        
        if (addresses.length > 3) {
            // 3개 이상인 경우 첫 2개만 표시하고 나머지는 +N으로 표시
            const firstTwo = addresses.slice(0, 2).map(formatAddress).join(', ');
            return `${firstTwo} <span class="badge bg-secondary">+${addresses.length - 2}</span>`;
        }
        
        return addresses.map(formatAddress).join(', ');
    }
    
    /**
     * 단일 주소 포맷팅
     * @param {Object} address - 주소 객체
     * @returns {string} - 포맷팅된 주소 문자열
     */
    function formatAddress(address) {
        if (address.type === 'ip') {
            return address.value;
        } else if (address.type === 'range') {
            return `${address.start}-${address.end}`;
        } else if (address.type === 'subnet') {
            return `${address.network}/${address.prefix}`;
        } else if (address.type === 'group') {
            return `<span class="group-name">${address.name}</span>`;
        }
        return address.value || 'Unknown';
    }
    
    /**
     * 서비스 배열 포맷팅
     * @param {Array} services - 서비스 배열
     * @returns {string} - 포맷팅된 서비스 HTML
     */
    function formatServices(services) {
        if (!services || services.length === 0) {
            return '<span class="text-muted">Any</span>';
        }
        
        if (services.length > 3) {
            // 3개 이상인 경우 첫 2개만 표시하고 나머지는 +N으로 표시
            const firstTwo = services.slice(0, 2).map(formatService).join(', ');
            return `${firstTwo} <span class="badge bg-secondary">+${services.length - 2}</span>`;
        }
        
        return services.map(formatService).join(', ');
    }
    
    /**
     * 단일 서비스 포맷팅
     * @param {Object} service - 서비스 객체
     * @returns {string} - 포맷팅된 서비스 문자열
     */
    function formatService(service) {
        if (service.type === 'predefined') {
            return service.name;
        } else if (service.type === 'custom') {
            if (service.protocol === 'tcp' || service.protocol === 'udp') {
                return `${service.protocol.toUpperCase()} ${service.port_range.start}-${service.port_range.end}`;
            } else {
                return service.protocol.toUpperCase();
            }
        } else if (service.type === 'group') {
            return `<span class="group-name">${service.name}</span>`;
        }
        return service.name || 'Unknown';
    }
    
    /**
     * 토스트 메시지 표시
     * @param {string} type - 메시지 유형 (success, error, warning, info)
     * @param {string} message - 메시지 내용
     */
    function showToast(type, message) {
        // 토스트 컨테이너 확인
        let toastContainer = document.querySelector('.toast-container');
        
        if (!toastContainer) {
            // 토스트 컨테이너 생성
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // 토스트 ID 생성
        const toastId = `toast-${Date.now()}`;
        
        // 토스트 색상 설정
        let bgColor = 'bg-primary';
        let icon = 'info-circle';
        
        switch (type) {
            case 'success':
                bgColor = 'bg-success';
                icon = 'check-circle';
                break;
            case 'error':
                bgColor = 'bg-danger';
                icon = 'exclamation-circle';
                break;
            case 'warning':
                bgColor = 'bg-warning';
                icon = 'exclamation-triangle';
                break;
        }
        
        // 토스트 요소 생성
        const toastEl = document.createElement('div');
        toastEl.id = toastId;
        toastEl.className = `toast ${bgColor} text-white`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        
        toastEl.innerHTML = `
            <div class="toast-header ${bgColor} text-white">
                <i class="fas fa-${icon} me-2"></i>
                <strong class="me-auto">알림</strong>
                <small>방금</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        // 토스트 컨테이너에 추가
        toastContainer.appendChild(toastEl);
        
        // 토스트 초기화 및 표시
        const toast = new bootstrap.Toast(toastEl, {
            autohide: true,
            delay: 3000
        });
        
        toast.show();
        
        // 토스트 숨김 이벤트 리스너
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }
    
    /**
     * 로딩 표시
     */
    function showLoading() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
        } else {
            // 로딩 요소가 없는 경우 생성
            const loading = document.createElement('div');
            loading.id = 'loading';
            loading.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;
            
            const spinner = document.createElement('div');
            spinner.className = 'spinner';
            spinner.style.cssText = `
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 2s linear infinite;
            `;
            
            // 애니메이션 스타일 추가
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            
            loading.appendChild(spinner);
            document.body.appendChild(loading);
        }
    }
    
    /**
     * 로딩 숨기기
     */
    function hideLoading() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }
    
    // 공개 메서드 반환
    return {
        loadPolicies,
        getAllPolicies
    };
} 