/**
 * 객체 관리 API 모듈
 */

/**
 * API 초기화
 */
export function initAPI() {
    return {
        getObjects,
        exportObjects
    };
}

/**
 * 객체 목록 조회
 * @param {Object} params - 요청 파라미터
 * @param {string} params.type - 객체 유형 (network, network-group, service, service-group)
 * @param {number} params.page - 페이지 번호
 * @param {number} params.pageSize - 페이지 크기
 * @param {Array} params.filters - 필터 조건
 * @returns {Promise<Object>} 객체 목록 및 페이지네이션 정보
 */
async function getObjects(params = {}) {
    try {
        const searchParams = new URLSearchParams({
            type: params.type || 'network',
            page: params.page || 1,
            per_page: params.pageSize || 10
        });

        if (params.filters?.length > 0) {
            searchParams.append('filters', JSON.stringify(params.filters));
        }

        const response = await fetch(`/objects/api/list?${searchParams.toString()}`);
        
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('객체 목록 조회 중 오류 발생:', error);
        throw error;
    }
}

/**
 * 객체 데이터 내보내기
 * @param {Object} params - 요청 파라미터
 * @param {string} params.type - 객체 유형 (network, network-group, service, service-group)
 * @param {Array} params.filters - 필터 조건
 * @returns {Promise<Blob>} Excel 파일 데이터
 */
async function exportObjects(params = {}) {
    try {
        const searchParams = new URLSearchParams({
            type: params.type || 'network'
        });

        if (params.filters?.length > 0) {
            searchParams.append('filters', JSON.stringify(params.filters));
        }

        const response = await fetch(`/objects/api/export?${searchParams.toString()}`);
        
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
        }
        
        return await response.blob();
    } catch (error) {
        console.error('객체 데이터 내보내기 중 오류 발생:', error);
        throw error;
    }
} 