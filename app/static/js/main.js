// 장비 검색 기능
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('deviceSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            const table = document.querySelector('.data-table');
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // 알림 메시지 자동 숨김
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 500);
        }, 3000);
    });
    
    // IP 주소 유효성 검사
    const ipAddressInputs = document.querySelectorAll('input[name="ip_address"]');
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
    
    // 삭제 모달 기능
    const modal = document.getElementById('deleteModal');
    if (modal) {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        const closeBtn = document.querySelector('.close');
        const cancelBtn = document.getElementById('cancelDelete');
        const deviceNameElement = document.getElementById('deviceName');
        const deleteForm = document.getElementById('deleteForm');
        
        // 삭제 버튼 클릭 시 모달 표시
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const deviceId = this.getAttribute('data-id');
                const deviceName = this.getAttribute('data-name');
                
                deviceNameElement.textContent = deviceName;
                deleteForm.action = `/devices/${deviceId}/delete`;
                modal.style.display = 'block';
            });
        });
        
        // 모달 닫기 기능
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        cancelBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // 모달 외부 클릭 시 닫기
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});

// 모든 모듈 로드
document.addEventListener('DOMContentLoaded', function() {
    // 알림 메시지 자동 숨김 초기화 (모든 페이지에 적용)
    if (window.AlertsModule) {
        window.AlertsModule.initAutoHideAlerts();
    }
}); 