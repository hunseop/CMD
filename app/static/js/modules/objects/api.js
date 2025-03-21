/**
 * 객체 관리 API 모듈
 */

/**
 * API 모듈 초기화
 */
export function initAPI() {
    /**
     * 객체 목록 가져오기
     * @param {Object} params - API 파라미터
     * @returns {Promise<Object>} - 객체 데이터
     */
    async function getObjects(params) {
        try {
            // API 엔드포인트 URL 생성
            const queryParams = new URLSearchParams({
                type: params.type,
                page: params.page,
                per_page: params.pageSize,
                ...params.filters
            });
            
            const url = `/objects/api/list?${queryParams}`;
            console.log('API 요청 URL:', url);
            
            // API 요청
            const response = await fetch(url);
            
            // 응답 확인
            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status}`);
            }
            
            // JSON 데이터 반환
            return await response.json();
        } catch (error) {
            console.error('API 요청 중 오류 발생:', error);
            throw error;
        }
    }
    
    // 공개 메서드 반환
    return {
        getObjects
    };
} 