/**
 * 정책 관리 유틸리티 함수 모듈
 */

/**
 * 로딩 표시
 */
export function showLoading() {
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
export function hideLoading() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

/**
 * 상태 값 변환 (Y/N <-> true/false)
 * @param {string} value - 변환할 값
 * @param {string} format - 변환 형식 ('boolean' 또는 'yn')
 * @returns {string|boolean} - 변환된 값
 */
export function convertStatus(value, format = 'boolean') {
    if (format === 'boolean') {
        // Y/N -> true/false
        return value === 'Y';
    } else if (format === 'yn') {
        // true/false -> Y/N
        return value ? 'Y' : 'N';
    }
    return value;
}

/**
 * 날짜 포맷팅
 * @param {string} dateStr - 날짜 문자열
 * @param {string} format - 포맷 (기본: YYYY-MM-DD)
 * @returns {string} - 포맷된 날짜 문자열
 */
export function formatDate(dateStr, format = 'YYYY-MM-DD') {
    if (!dateStr) return '-';
    
    try {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    } catch (e) {
        return dateStr;
    }
} 