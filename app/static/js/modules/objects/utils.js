/**
 * 객체 관리 유틸리티 모듈
 */

/**
 * 로딩 표시기 표시
 */
export function showLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
}

/**
 * 로딩 표시기 숨기기
 */
export function hideLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

/**
 * 객체 유형 레이블 가져오기
 * @param {string} type - 객체 유형
 * @returns {string} - 객체 유형 레이블
 */
export function getObjectTypeLabel(type) {
    const typeMap = {
        'ip': 'IP',
        'network': '네트워크',
        'fqdn': 'FQDN',
        'url': 'URL',
        'service': '서비스',
        'service_group': '서비스 그룹',
        'address_group': '주소 그룹'
    };
    return typeMap[type] || type;
}

/**
 * 방화벽 유형 레이블 가져오기
 * @param {string} type - 방화벽 유형
 * @returns {string} - 방화벽 유형 레이블
 */
export function getFirewallTypeLabel(type) {
    const typeMap = {
        'ngf': 'NGF',
        'mf2': 'MF2',
        'mock': 'Mock'
    };
    return typeMap[type] || type;
}

/**
 * 날짜를 포맷팅된 문자열로 변환
 * @param {string} dateString - ISO 형식의 날짜 문자열
 * @returns {string} - 포맷팅된 날짜 문자열 (YYYY-MM-DD HH:mm:ss)
 */
export function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (밀리초)
 * @returns {Function} - 디바운스된 함수
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 에러 메시지 표시
 * @param {string} message - 에러 메시지
 */
export function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
} 