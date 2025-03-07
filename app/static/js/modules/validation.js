/**
 * IP 주소 유효성 검사 초기화
 * @param {string} selector - IP 주소 입력 필드 선택자
 */
function initIpAddressValidation(selector = 'input[name="ip_address"]') {
    const ipAddressInputs = document.querySelectorAll(selector);
    
    ipAddressInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (!ipPattern.test(this.value)) {
                this.setCustomValidity('올바른 IP 주소 형식이 아닙니다.');
            } else {
                const parts = this.value.split('.');
                const valid = parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
                if (!valid) {
                    this.setCustomValidity('IP 주소의 각 부분은 0-255 사이의 값이어야 합니다.');
                } else {
                    this.setCustomValidity('');
                }
            }
        });
    });
}

// 전역 스코프로 내보내기
window.ValidationModule = {
    initIpAddressValidation
}; 