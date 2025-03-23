/**
 * 객체 관리 메인 모듈
 */

import { initAPI } from './api.js';
import { initFilters } from './filter.js';
import { initPagination } from './pagination.js';
import { initExport } from './export.js';
import { showLoading, hideLoading, showError, getObjectTypeLabel, getFirewallTypeLabel, formatDate, debounce } from './utils.js';

export function initObjects() {
    // API 초기화
    const api = initAPI();
    
    // URL 파라미터에서 초기 상태 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const initialObjectType = urlParams.get('type') || 'network';
    const initialPage = parseInt(urlParams.get('page')) || 1;
    const initialPerPage = parseInt(urlParams.get('per_page')) || 10;
    
    // 상태 관리
    let currentObjectType = initialObjectType;
    let isLoading = false;
    
    // DOM 요소
    const objectsTable = document.getElementById('objectsTable');
    const objectsTableBody = document.getElementById('objects-table-body');
    const objectTypeButtons = document.querySelectorAll('.object-type-btn');
    const searchInput = document.getElementById('searchInput');
    
    // 필터 초기화
    const filters = initFilters(() => loadObjects());
    
    // 페이지네이션 초기화 (초기값 전달)
    const pagination = initPagination(() => loadObjects(), initialPage, initialPerPage);
    
    // 내보내기 초기화
    const exporter = initExport(() => getAllObjects());
    
    // 이벤트 리스너 등록
    if (objectTypeButtons) {
        objectTypeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const type = button.dataset.objectType;
                if (type && type !== currentObjectType) {
                    currentObjectType = type;
                    updateObjectTypeUI();
                    loadObjects();  // URL 파라미터는 loadObjects 내에서 업데이트됨
                }
            });
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            loadObjects();
        }, 300));
    }
    
    // 페이지 로드 시 popstate 이벤트 리스너 등록
    window.addEventListener('popstate', (event) => {
        const params = new URLSearchParams(window.location.search);
        currentObjectType = params.get('type') || 'network';
        updateObjectTypeUI();
        loadObjects(false);  // URL 파라미터 업데이트 건너뛰기
    });
    
    /**
     * URL 파라미터 업데이트
     */
    function updateURLParams() {
        const params = new URLSearchParams();
        params.set('type', currentObjectType);
        params.set('page', pagination.getCurrentPage().toString());
        params.set('per_page', pagination.getPageSize().toString());
        
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({ type: currentObjectType }, '', newUrl);
    }
    
    /**
     * 객체 목록 로드
     * @param {boolean} updateURL - URL 파라미터 업데이트 여부 (기본값: true)
     */
    async function loadObjects(updateURL = true) {
        if (isLoading) return;
        
        try {
            showLoading();
            isLoading = true;
            
            const params = {
                type: currentObjectType,
                page: pagination.getCurrentPage(),
                pageSize: pagination.getPageSize(),
                filters: filters.getActiveFilters()
            };
            
            const response = await api.getObjects(params);
            
            // 테이블 업데이트
            updateObjectsTable(response.objects);
            
            // 페이지네이션 업데이트
            pagination.updatePaginationUI(response.pagination);
            
            // URL 파라미터 업데이트 (필요한 경우에만)
            if (updateURL) {
                updateURLParams();
            }
            
        } catch (error) {
            showError('객체 목록을 불러오는 중 오류가 발생했습니다.');
            console.error(error);
        } finally {
            hideLoading();
            isLoading = false;
        }
    }
    
    /**
     * 객체 테이블 업데이트
     * @param {Array} objects - 객체 목록
     */
    function updateObjectsTable(objects) {
        if (!objectsTableBody) return;
        
        if (!objects.length) {
            objectsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">데이터가 없습니다.</td>
                </tr>
            `;
            return;
        }
        
        const html = objects.map((obj, index) => {
            // 객체 유형에 따라 다른 필드 표시
            let name, type, value;
            
            if (currentObjectType === 'network') {
                name = obj.name;
                type = obj.type;
                value = obj.value;
            } else if (currentObjectType === 'network-group') {
                name = obj.group_name;
                type = '네트워크 그룹';
                value = obj.entry;
            } else if (currentObjectType === 'service') {
                name = obj.name;
                type = '서비스';
                value = `${obj.protocol}/${obj.port}`;
            } else if (currentObjectType === 'service-group') {
                name = obj.group_name;
                type = '서비스 그룹';
                value = obj.entry;
            }
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${obj.device_name || '-'}</td>
                    <td>${name || '-'}</td>
                    <td>${type || '-'}</td>
                    <td>${value || '-'}</td>
                    <td>${getFirewallTypeLabel(obj.firewall_type)}</td>
                    <td>${formatDate(obj.last_sync_at)}</td>
                </tr>
            `;
        }).join('');
        
        objectsTableBody.innerHTML = html;
    }
    
    /**
     * 객체 유형 UI 업데이트
     */
    function updateObjectTypeUI() {
        objectTypeButtons?.forEach(button => {
            if (button.dataset.objectType === currentObjectType) {
                button.classList.add('primary');
            } else {
                button.classList.remove('primary');
            }
        });
    }
    
    /**
     * 모든 객체 데이터 가져오기 (내보내기용)
     */
    async function getAllObjects() {
        try {
            const activeFilters = filters.getActiveFilters();
            
            return {
                object_type: currentObjectType,
                filters: activeFilters
            };
        } catch (error) {
            showError('객체 데이터를 가져오는 중 오류가 발생했습니다.');
            console.error(error);
            return null;
        }
    }
    
    // 초기 UI 업데이트
    updateObjectTypeUI();
    
    // 초기 로드
    loadObjects();
} 