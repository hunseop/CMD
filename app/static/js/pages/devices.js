/**
 * 장비 관리 페이지 초기화
 */
function initDevicesPage() {
    // 테이블 검색 초기화
    if (window.SearchModule) {
        window.SearchModule.initTableSearch('deviceSearch', '.data-table');
    }
    
    // IP 주소 유효성 검사 초기화
    if (window.ValidationModule) {
        window.ValidationModule.initIpAddressValidation();
    }
    
    // 알림 메시지 자동 숨김 초기화
    if (window.AlertsModule) {
        window.AlertsModule.initAutoHideAlerts();
    }
    
    // 삭제 모달 초기화
    initDeleteModal();
}

/**
 * 삭제 모달 초기화
 */
function initDeleteModal() {
    if (window.ModalModule) {
        const deviceNameElement = document.getElementById('deviceName');
        const deleteForm = document.getElementById('deleteForm');
        
        window.ModalModule.initModal('deleteModal', {
            openSelector: '.delete-btn',  // 삭제 버튼 선택자 추가
            cancelSelector: '#cancelDelete',
            onOpen: function(modal, button) {
                if (button) {
                    const deviceId = button.getAttribute('data-id');
                    const deviceName = button.getAttribute('data-name');
                    
                    deviceNameElement.textContent = deviceName;
                    deleteForm.action = `/devices/${deviceId}/delete`;
                }
            }
        });
    }
}

// 전역 스코프로 내보내기
window.initDevicesPage = initDevicesPage;