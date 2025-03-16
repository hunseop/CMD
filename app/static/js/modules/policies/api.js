/**
 * 정책 API 호출 관련 기능을 담당하는 모듈
 */

/**
 * API 모듈 초기화
 * @returns {Object} - API 관련 메서드를 포함한 객체
 */
export function initAPI() {
    // 기본 API 경로 (백엔드 API 경로에 맞게 수정)
    const BASE_API_URL = '';
    
    /**
     * 정책 목록 조회
     * @param {Object} params - 요청 파라미터
     * @param {number} params.page - 페이지 번호
     * @param {number} params.pageSize - 페이지 크기
     * @param {Array} params.filters - 필터 배열
     * @param {string} params.sortField - 정렬 필드
     * @param {string} params.sortOrder - 정렬 순서 (asc, desc)
     * @returns {Promise<Object>} - 정책 목록 응답
     */
    async function getPolicies(params = {}) {
        try {
            // 기본 파라미터 설정
            const defaultParams = {
                page: 1,
                pageSize: 10,
                filters: [],
                sortField: 'id',
                sortOrder: 'asc'
            };
            
            // 파라미터 병합
            const queryParams = { ...defaultParams, ...params };
            
            // 검색 파라미터 가져오기
            const deviceId = document.getElementById('deviceFilter')?.value || '';
            const status = document.getElementById('statusFilter')?.value || '';
            const search = document.getElementById('policySearch')?.value || '';
            
            // API 요청 데이터 구성
            const requestData = {
                page: queryParams.page,
                per_page: queryParams.pageSize,
                device_id: deviceId,
                status: status,
                search: search,
                filters: queryParams.filters
            };
            
            console.log('API 요청 데이터:', requestData);
            
            // AJAX 요청
            const response = await fetch('/policies/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(requestData)
            });
            
            // 응답 확인
            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
            }
            
            // JSON 응답 파싱
            const data = await response.json();
            console.log('API 응답 데이터:', data);
            
            // 테이블 내용 업데이트
            const tableBody = document.getElementById('policies-table-body');
            if (tableBody && data.html) {
                tableBody.innerHTML = data.html;
            }
            
            // 페이지네이션 업데이트
            const paginationContainer = document.querySelector('.pagination-container');
            if (paginationContainer && data.pagination) {
                paginationContainer.innerHTML = data.pagination;
            }
            
            // 응답 데이터 형식 변환 (백엔드 응답 형식에 맞게 조정)
            return {
                html: data.html || '',
                pagination: data.pagination || '',
                items: data.items || [],
                total: data.total || 0
            };
        } catch (error) {
            console.error('정책 목록 조회 중 오류 발생:', error);
            throw error;
        }
    }
    
    /**
     * 정책 상세 조회
     * @param {number} policyId - 정책 ID
     * @returns {Promise<Object>} - 정책 상세 정보
     */
    async function getPolicyDetail(policyId) {
        try {
            const response = await fetch(`/policies/${policyId}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`정책 상세 조회 중 오류 발생 (ID: ${policyId}):`, error);
            throw error;
        }
    }
    
    /**
     * 정책 생성
     * @param {Object} policyData - 정책 데이터
     * @returns {Promise<Object>} - 생성된 정책 정보
     */
    async function createPolicy(policyData) {
        try {
            const response = await fetch(`/policies/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(policyData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `API 요청 실패: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('정책 생성 중 오류 발생:', error);
            throw error;
        }
    }
    
    /**
     * 정책 수정
     * @param {number} policyId - 정책 ID
     * @param {Object} policyData - 정책 데이터
     * @returns {Promise<Object>} - 수정된 정책 정보
     */
    async function updatePolicy(policyId, policyData) {
        try {
            const response = await fetch(`/policies/${policyId}/edit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(policyData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `API 요청 실패: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`정책 수정 중 오류 발생 (ID: ${policyId}):`, error);
            throw error;
        }
    }
    
    /**
     * 정책 삭제
     * @param {number} policyId - 정책 ID
     * @returns {Promise<void>}
     */
    async function deletePolicy(policyId) {
        try {
            const response = await fetch(`/policies/${policyId}/delete`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `API 요청 실패: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error(`정책 삭제 중 오류 발생 (ID: ${policyId}):`, error);
            throw error;
        }
    }
    
    /**
     * 정책 상태 변경
     * @param {number} policyId - 정책 ID
     * @param {boolean} enabled - 활성화 여부
     * @returns {Promise<Object>} - 변경된 정책 정보
     */
    async function togglePolicyStatus(policyId, enabled) {
        try {
            const response = await fetch(`/policies/${policyId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ enabled })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `API 요청 실패: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`정책 상태 변경 중 오류 발생 (ID: ${policyId}):`, error);
            throw error;
        }
    }
    
    /**
     * 정책 일괄 삭제
     * @param {Array<number>} policyIds - 정책 ID 배열
     * @returns {Promise<void>}
     */
    async function bulkDeletePolicies(policyIds) {
        try {
            const response = await fetch(`/policies/bulk-delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ ids: policyIds })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `API 요청 실패: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('정책 일괄 삭제 중 오류 발생:', error);
            throw error;
        }
    }
    
    /**
     * 정책 일괄 상태 변경
     * @param {Array<number>} policyIds - 정책 ID 배열
     * @param {boolean} enabled - 활성화 여부
     * @returns {Promise<void>}
     */
    async function bulkTogglePolicyStatus(policyIds, enabled) {
        try {
            const response = await fetch(`/policies/bulk-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ ids: policyIds, enabled })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `API 요청 실패: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('정책 일괄 상태 변경 중 오류 발생:', error);
            throw error;
        }
    }
    
    // 공개 메서드 반환
    return {
        getPolicies,
        getPolicyDetail,
        createPolicy,
        updatePolicy,
        deletePolicy,
        togglePolicyStatus,
        bulkDeletePolicies,
        bulkTogglePolicyStatus
    };
} 