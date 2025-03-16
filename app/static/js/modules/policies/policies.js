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
    // 모듈 초기화
    const api = initAPI();
    const filters = initFilters(loadPolicies);
    const pagination = initPagination(loadPolicies);
    const exporter = initExport(getAllPolicies);
    
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
                filters: filters.getActiveFilters()
            };
            
            console.log('정책 목록 로드 파라미터:', params);
            
            // 정책 데이터 가져오기
            const data = await api.getPolicies(params);
            
            // 페이지네이션 이벤트 바인딩
            pagination.bindEvents();
            
            // 현재 페이지 업데이트
            pagination.updateCurrentPage();
            
            // 로딩 숨기기
            hideLoading();
        } catch (error) {
            console.error('정책 목록 로드 중 오류 발생:', error);
            alert('정책 목록을 불러오는 중 오류가 발생했습니다.');
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
                filters: filters.getActiveFilters()
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