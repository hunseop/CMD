/**
 * 객체 관리 유틸리티 모듈
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
 * 날짜를 포맷팅하는 함수
 * @param {string} dateString - ISO 형식의 날짜 문자열
 * @returns {string} - 포맷팅된 날짜 문자열 (YYYY-MM-DD HH:mm:ss)
 */
export function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 객체 유형을 한글로 변환하는 함수
 * @param {string} type - 객체 유형
 * @returns {string} - 한글로 변환된 객체 유형
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
 * 방화벽 유형을 한글로 변환하는 함수
 * @param {string} type - 방화벽 유형
 * @returns {string} - 한글로 변환된 방화벽 유형
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
 * 객체 값을 포맷팅하는 함수
 * @param {Object} object - 객체 데이터
 * @returns {string} - 포맷팅된 객체 값
 */
export function formatObjectValue(object) {
    if (!object || !object.type) return '-';
    
    switch (object.type) {
        case 'ip':
            return object.value || '-';
        case 'network':
            return object.value ? `${object.value}/${object.netmask}` : '-';
        case 'fqdn':
        case 'url':
            return object.value || '-';
        case 'service':
            return formatServiceValue(object);
        case 'service_group':
        case 'address_group':
            return `${object.members?.length || 0}개 멤버`;
        default:
            return '-';
    }
}

/**
 * 서비스 객체 값을 포맷팅하는 함수
 * @param {Object} service - 서비스 객체 데이터
 * @returns {string} - 포맷팅된 서비스 값
 */
function formatServiceValue(service) {
    if (!service) return '-';
    
    const protocol = service.protocol?.toUpperCase() || '-';
    const ports = service.ports || [];
    
    if (ports.length === 0) return protocol;
    
    return `${protocol} ${ports.join(', ')}`;
} 