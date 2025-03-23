/**
 * 객체 관리 메인 모듈
 */

// 모듈 가져오기
import { initFilters } from './filter.js';
import { initPagination } from './pagination.js';
import { initAPI } from './api.js';
import { initExport } from './export.js';
import { showLoading, hideLoading, formatDate, getObjectTypeLabel, getFirewallTypeLabel, formatObjectValue } from './utils.js';

/**
 * 객체 관리 모듈 초기화
 */
export function initObjects() {
    // 상태 변수
    let currentObjectType = 'network'; // 기본값: 네트워크 객체
    let currentPage = parseInt(sessionStorage.getItem('objectsCurrentPage')) || 1;
    let pageSize = parseInt(sessionStorage.getItem('objectsPageSize')) || 10;
    
    // 모듈 초기화
    const api = initAPI();
    const filters = initFilters(loadObjects);
    const pagination = initPagination(loadObjects, currentPage, pageSize);
    const exporter = initExport(getAllObjects);
    
    // DOM 요소
    const objectTypeButtons = document.querySelectorAll('[data-object-type]');
    const objectsTableBody = document.getElementById('objects-table-body');
    const paginationContainer = document.querySelector('.pagination-container');
    
    // 페이지 크기 변경 이벤트 처리 함수
    function handlePerPageChange(e) {
        pageSize = parseInt(e.target.value);
        currentPage = 1; // 페이지 크기가 변경되면 첫 페이지로 이동
        sessionStorage.setItem('objectsPageSize', pageSize);
        sessionStorage.setItem('objectsCurrentPage', currentPage);
        loadObjects();
    }
    
    // 페이지 변경 이벤트 처리 함수
    function handlePageChange(newPage) {
        currentPage = newPage;
        sessionStorage.setItem('objectsCurrentPage', currentPage);
        loadObjects();
    }
    
    // 객체 유형 버튼 선택 처리
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
            currentPage = 1; // 객체 유형이 변경되면 첫 페이지로 이동
            sessionStorage.setItem('objectsCurrentPage', currentPage);
            loadObjects();
        });
    });

    // 초기 버튼 선택 (네트워크 객체)
    objectTypeButtons[0].click();
    
    /**
     * 객체 목록 로드
     */
    async function loadObjects() {
        try {
            // 로딩 표시
            showLoading();
            
            // API 파라미터 설정
            const params = {
                type: currentObjectType,
                page: currentPage,
                pageSize: pageSize,
                filters: filters.getActiveFilters()
            };
            
            console.log('객체 목록 로드 파라미터:', params);
            
            // 객체 데이터 가져오기
            const data = await api.getObjects(params);
            
            // 테이블 데이터 업데이트
            if (objectsTableBody) {
                objectsTableBody.innerHTML = data.objects.map((obj, index) => `
                    <tr>
                        <td>${(params.page - 1) * params.pageSize + index + 1}</td>
                        <td>${obj.device_name}</td>
                        <td>${obj.name || obj.group_name}</td>
                        <td>${getObjectTypeLabel(obj.type)}</td>
                        <td>${formatObjectValue(obj)}</td>
                        <td>${getFirewallTypeLabel(obj.firewall_type)}</td>
                        <td>${formatDate(obj.last_sync_at)}</td>
                    </tr>
                `).join('');
            }
            
            // 페이지네이션 HTML 업데이트
            if (paginationContainer) {
                const totalPages = Math.ceil(data.pagination.total / params.pageSize);
                
                // 페이지네이션 HTML 생성
                let paginationHtml = `
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
                    paginationHtml += `
                        <div class="pagination" id="pagination">
                            ${currentPage > 1 ? `
                                <a href="#" class="page-link" data-page="${currentPage - 1}" aria-label="이전 페이지">&laquo;</a>
                            ` : ''}
                            
                            ${Array.from({length: totalPages}, (_, i) => i + 1)
                                .filter(page => {
                                    const delta = 2;
                                    return page === 1 || 
                                           page === totalPages || 
                                           (page >= currentPage - delta && page <= currentPage + delta);
                                })
                                .map(page => {
                                    if (page === currentPage) {
                                        return `<span class="current-page" data-page="${page}">${page}</span>`;
                                    }
                                    return `<a href="#" class="page-link" data-page="${page}">${page}</a>`;
                                })
                                .join('')}
                            
                            ${currentPage < totalPages ? `
                                <a href="#" class="page-link" data-page="${currentPage + 1}" aria-label="다음 페이지">&raquo;</a>
                            ` : ''}
                        </div>`;
                }
                
                paginationHtml += '</div>';
                
                // 페이지네이션 HTML 적용
                paginationContainer.innerHTML = paginationHtml;
            }
            
            // 페이지 크기 변경 이벤트 리스너 등록
            const perPageSelect = document.getElementById('perPage');
            if (perPageSelect) {
                // 이전 이벤트 리스너 제거
                perPageSelect.removeEventListener('change', handlePerPageChange);
                // 새 이벤트 리스너 등록
                perPageSelect.addEventListener('change', handlePerPageChange);
            }
            
            // 페이지 버튼 클릭 이벤트 리스너 등록
            const pageButtons = document.querySelectorAll('.page-link');
            pageButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const newPage = parseInt(button.getAttribute('data-page'));
                    if (!isNaN(newPage)) {
                        handlePageChange(newPage);
                    }
                });
            });
            
            // 로딩 숨기기
            hideLoading();
        } catch (error) {
            console.error('객체 목록 로드 중 오류 발생:', error);
            alert('객체 목록을 불러오는 중 오류가 발생했습니다.');
            hideLoading();
        }
    }
    
    /**
     * 모든 객체 데이터 가져오기 (엑셀 내보내기용)
     * @returns {Promise<Object>} - 모든 객체 데이터
     */
    async function getAllObjects() {
        try {
            // 로딩 표시
            showLoading();
            
            // API 파라미터 설정 (페이지 크기를 최대로 설정)
            const params = {
                type: currentObjectType,
                page: 1,
                pageSize: 1000, // 최대 페이지 크기
                filters: filters.getActiveFilters()
            };
            
            console.log('엑셀 내보내기용 데이터 로드 파라미터:', params);
            
            // 객체 데이터 가져오기
            const data = await api.getObjects(params);
            
            // 로딩 숨기기
            hideLoading();
            
            return data;
        } catch (error) {
            console.error('모든 객체 데이터 가져오기 중 오류 발생:', error);
            hideLoading();
            throw error;
        }
    }
    
    // 공개 메서드 반환
    return {
        loadObjects,
        getAllObjects
    };
} 