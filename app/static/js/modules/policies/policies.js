/**
 * 정책 관리 메인 모듈
 */

// 모듈 가져오기
import { initFilters } from './filter.js';
import { initPagination } from './pagination.js';
import { initAPI } from './api.js';
import { initExport } from './export.js';
import { showLoading, hideLoading, debounce } from './utils.js';

/**
 * 정책 관리 모듈 초기화
 */
export function initPolicies() {
    // URL 파라미터에서 초기 상태 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const initialPage = parseInt(urlParams.get('page')) || 1;
    const initialPerPage = parseInt(urlParams.get('per_page')) || 10;
    const initialSearch = urlParams.get('search') || localStorage.getItem('policiesSearchQuery') || '';
    
    // 상태 관리
    let searchQuery = initialSearch;
    let isLoading = false;
    
    // DOM 요소
    const searchInput = document.getElementById('policySearch');
    
    // 검색 입력 필드 초기화
    if (searchInput) {
        searchInput.value = searchQuery;
        // 검색어 입력 이벤트 리스너
        searchInput.addEventListener('input', debounce(() => {
            searchQuery = searchInput.value;
            console.log('검색어 입력:', searchQuery);  // 로깅 추가
            // 검색어를 로컬스토리지에 저장
            if (searchQuery) {
                localStorage.setItem('policiesSearchQuery', searchQuery);
            } else {
                localStorage.removeItem('policiesSearchQuery');
            }
            loadPolicies();
        }, 300));
    }
    
    // 모듈 초기화
    const api = initAPI();
    const filters = initFilters(loadPolicies);
    const pagination = initPagination(loadPolicies, initialPage, initialPerPage);
    const exporter = initExport(getAllPolicies);
    
    // 브라우저 히스토리 이벤트 리스너
    window.addEventListener('popstate', (event) => {
        const params = new URLSearchParams(window.location.search);
        searchQuery = params.get('search') || localStorage.getItem('policiesSearchQuery') || '';
        if (searchInput) {
            searchInput.value = searchQuery;
        }
        loadPolicies(false);
    });
    
    /**
     * URL 파라미터 업데이트
     */
    function updateURLParams() {
        const params = new URLSearchParams();
        params.set('page', pagination.getCurrentPage().toString());
        params.set('per_page', pagination.getPageSize().toString());
        if (searchQuery) {
            params.set('search', searchQuery);
        }
        
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({ search: searchQuery }, '', newUrl);
    }
    
    /**
     * 정책 목록 로드
     * @param {boolean} updateURL - URL 파라미터 업데이트 여부 (기본값: true)
     */
    async function loadPolicies(updateURL = true) {
        if (isLoading) return;
        
        try {
            // 로딩 표시
            showLoading();
            isLoading = true;
            
            // API 파라미터 설정
            const params = {
                page: pagination.getCurrentPage(),
                pageSize: pagination.getPageSize(),
                filters: filters.getActiveFilters(),
                search: searchQuery
            };
            
            console.log('정책 목록 로드 시작:', {
                검색어: searchQuery,
                페이지: params.page,
                페이지크기: params.pageSize,
                필터: params.filters
            });
            
            // 정책 데이터 가져오기
            const data = await api.getPolicies(params);
            
            console.log('정책 목록 로드 완료:', {
                총개수: data.total,
                아이템수: data.items.length,
                HTML존재여부: !!data.html,
                페이지네이션존재여부: !!data.pagination
            });
            
            // 페이지네이션 이벤트 바인딩
            pagination.bindEvents();
            
            // 현재 페이지 업데이트
            pagination.updateCurrentPage();
            
            // URL 파라미터 업데이트 (필요한 경우에만)
            if (updateURL) {
                updateURLParams();
            }
            
        } catch (error) {
            console.error('정책 목록 로드 중 오류 발생:', error);
            alert('정책 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            hideLoading();
            isLoading = false;
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
            
            // API 파라미터 설정 (페이지 크기를 최대로 설정)
            const params = {
                page: 1,
                pageSize: 1000, // 최대 페이지 크기
                filters: filters.getActiveFilters(),
                search: searchQuery
            };
            
            console.log('엑셀 내보내기용 데이터 로드 파라미터:', params);
            
            // 정책 데이터 가져오기
            const data = await api.getPolicies(params);
            
            return data;
        } catch (error) {
            console.error('모든 정책 데이터 가져오기 중 오류 발생:', error);
            throw error;
        } finally {
            hideLoading();
        }
    }
    
    // 초기 데이터 로드
    loadPolicies();
    
    // 공개 메서드 반환
    return {
        loadPolicies,
        getAllPolicies
    };
} 