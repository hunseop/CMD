/**
 * 정책 API 호출 관련 기능을 담당하는 모듈
 */

/**
 * API 모듈 초기화
 * @returns {Object} - API 관련 메서드를 포함한 객체
 */
export function initAPI() {
    /**
     * 정책 목록 조회
     * @param {Object} params - 요청 파라미터
     * @param {number} params.page - 페이지 번호
     * @param {number} params.pageSize - 페이지 크기
     * @param {Array} params.filters - 필터 배열
     * @param {string} params.deviceId - 장비 ID (선택적)
     * @param {string} params.status - 상태 필터 (선택적)
     * @param {string} params.search - 검색어 (선택적)
     * @returns {Promise<Object>} - 정책 목록 응답
     */
    async function getPolicies(params = {}) {
        try {
            // 기본 파라미터 설정
            const defaultParams = {
                page: 1,
                pageSize: 10,
                filters: []
            };
            
            // 파라미터 병합
            const queryParams = { ...defaultParams, ...params };
            
            // API 요청 데이터 구성
            const requestData = {
                page: queryParams.page,
                per_page: queryParams.pageSize,
                filters: queryParams.filters,
                search: queryParams.search || ''
            };
            
            console.log('API 요청 시작:', {
                요청URL: '/policies/',
                요청데이터: requestData
            });
            
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
                const errorText = await response.text();
                console.error('API 응답 오류:', {
                    상태코드: response.status,
                    상태텍스트: response.statusText,
                    응답내용: errorText
                });
                throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
            }
            
            // JSON 응답 파싱
            const data = await response.json();
            console.log('API 응답 데이터:', {
                HTML길이: data.html?.length || 0,
                페이지네이션길이: data.pagination?.length || 0,
                아이템수: data.items?.length || 0,
                총개수: data.total || 0
            });
            
            // 테이블 내용 업데이트
            const tableBody = document.getElementById('policies-table-body');
            if (tableBody && data.html) {
                console.log('테이블 업데이트');
                tableBody.innerHTML = data.html;
            } else {
                console.warn('테이블 업데이트 실패:', {
                    테이블요소존재: !!tableBody,
                    HTML데이터존재: !!data.html
                });
            }
            
            // 페이지네이션 업데이트
            const paginationContainer = document.querySelector('.pagination-container');
            if (paginationContainer && data.pagination) {
                console.log('페이지네이션 업데이트');
                paginationContainer.innerHTML = data.pagination;
            } else {
                console.warn('페이지네이션 업데이트 실패:', {
                    페이지네이션요소존재: !!paginationContainer,
                    페이지네이션데이터존재: !!data.pagination
                });
            }
            
            // 응답 데이터 형식 변환 (백엔드 응답 형식에 맞게 조정)
            return {
                html: data.html || '',
                pagination: data.pagination || '',
                items: data.items || [],
                total: data.total || 0,
                filters: queryParams.filters,
                search: queryParams.search || ''
            };
        } catch (error) {
            console.error('정책 목록 조회 중 오류 발생:', error);
            throw error;
        }
    }
    
    // 공개 메서드 반환
    return {
        getPolicies
    };
} 