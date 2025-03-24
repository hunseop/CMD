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
    const modalOverlay = document.getElementById('modal-overlay');
    
    if (modal) {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        const closeBtn = document.querySelector('.modal-close');
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
                modal.classList.add('active');
                modalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });
        
        // 모달 닫기 기능
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.classList.remove('active');
                modalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                modal.classList.remove('active');
                modalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // 모달 외부 클릭 시 닫기
        modalOverlay.addEventListener('click', function() {
            modal.classList.remove('active');
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // 프로그레스 바 초기화
    initProgressBars();
});

// 프로그레스 바 초기화 함수
function initProgressBars() {
    const progressElements = document.querySelectorAll('.progress[data-progress]');
    
    progressElements.forEach(element => {
        const progress = element.getAttribute('data-progress');
        if (progress) {
            // 타임아웃은 애니메이션을 위한 것
            setTimeout(() => {
                element.style.width = `${progress}%`;
            }, 50);
        }
    });
}

// 전역 스코프로 노출
window.initProgressBars = initProgressBars;

// 모듈 초기화 - 수정된 부분
document.addEventListener('DOMContentLoaded', function() {
    // SyncModule 초기화
    if (window.SyncModule) {
        window.SyncModule.init();
    }
    
    // 장비 관리 페이지 특화 초기화
    const devicesContainer = document.querySelector('.devices-container');
    if (devicesContainer) {
        initDevicesPage();
    }
    
    // MutationObserver 설정으로 DOM 변경 감지
    setupMutationObserver();
});

// MutationObserver 설정
function setupMutationObserver() {
    // 테이블 내용이 변경될 때 프로그레스 바 초기화
    const tableBody = document.getElementById('devices-table-body');
    if (tableBody) {
        const observer = new MutationObserver(function(mutations) {
            // DOM이 변경되면 프로그레스 바 초기화
            initProgressBars();
        });
        
        // 설정
        observer.observe(tableBody, {
            childList: true,
            subtree: true
        });
    }
} 