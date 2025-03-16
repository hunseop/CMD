/**
 * 정책 관리 메인 모듈
 */

// 모듈 가져오기
import { initFilters } from './filter.js';
import { initPagination } from './pagination.js';
import { initAPI } from './api.js';
import { initExport } from './export.js';
import { showLoading, hideLoading } from './utils.js';

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
                filters: filters.getActiveFilters(),
                deviceId, // 직접 파라미터로 전달
                status,
                search
            };
            
            console.log('엑셀 내보내기용 데이터 로드 파라미터:', params);
            
            // 정책 데이터 가져오기 (API 함수가 필요한 모든 정보를 반환)
            const data = await api.getPolicies(params);
            
            // 로딩 숨기기
            hideLoading();
            
            return data;
        } catch (error) {
            console.error('모든 정책 데이터 가져오기 중 오류 발생:', error);
            hideLoading();
            throw error;
        }
    }
    
    // 공개 메서드 반환
    return {
        loadPolicies,
        getAllPolicies
    };
} 