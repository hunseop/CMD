/**
 * 객체 관리 API 모듈
 */

/**
 * API 모듈 초기화
 * @returns {Object} - API 관련 메서드를 포함한 객체
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
                per_page: params.pageSize
            });
            
            // 필터 파라미터 추가
            if (params.filters && params.filters.length > 0) {
                params.filters.forEach((filter, index) => {
                    queryParams.append(`filters[${index}][field]`, filter.field);
                    queryParams.append(`filters[${index}][operator]`, filter.operator);
                    queryParams.append(`filters[${index}][value]`, filter.value);
                    if (filter.join) {
                        queryParams.append(`filters[${index}][join]`, filter.join);
                    }
                });
                console.log('필터 파라미터:', params.filters);
            }
            
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
    
    /**
     * 객체 내보내기
     * @param {Object} params - API 파라미터
     * @returns {Promise<Blob>} - 엑셀 파일 데이터
     */
    async function exportObjects(params) {
        try {
            // API 엔드포인트 URL 생성
            const queryParams = new URLSearchParams({
                type: params.type
            });
            
            // 필터 파라미터 추가
            if (params.filters && params.filters.length > 0) {
                params.filters.forEach((filter, index) => {
                    queryParams.append(`filters[${index}][field]`, filter.field);
                    queryParams.append(`filters[${index}][operator]`, filter.operator);
                    queryParams.append(`filters[${index}][value]`, filter.value);
                    if (filter.join) {
                        queryParams.append(`filters[${index}][join]`, filter.join);
                    }
                });
            }
            
            const url = `/objects/api/export?${queryParams}`;
            console.log('내보내기 요청 URL:', url);
            
            // API 요청
            const response = await fetch(url);
            
            // 응답 확인
            if (!response.ok) {
                throw new Error(`내보내기 요청 실패: ${response.status}`);
            }
            
            // Blob 데이터 반환
            return await response.blob();
        } catch (error) {
            console.error('내보내기 요청 중 오류 발생:', error);
            throw error;
        }
    }
    
    // 공개 메서드 반환
    return {
        getObjects,
        exportObjects
    };
} 