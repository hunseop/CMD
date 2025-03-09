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
    
    // 엑셀 업로드 모달 초기화
    initUploadModal();
}

/**
 * 삭제 모달 초기화
 */
function initDeleteModal() {
    if (window.ModalModule) {
        const deviceNameElement = document.getElementById('deviceName');
        const deleteForm = document.getElementById('deleteForm');
        
        window.ModalModule.initModal('deleteModal', {
            openSelector: '.delete-btn',
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

/**
 * 엑셀 업로드 모달 초기화
 */
function initUploadModal() {
    if (window.ModalModule) {
        const uploadModal = window.ModalModule.initModal('uploadModal', {
            openSelector: '#uploadExcelBtn',
            cancelSelector: '#cancelUpload',
            onOpen: function() {
                // 모달 열릴 때 초기화
                document.getElementById('excelFile').value = '';
                document.getElementById('uploadResult').style.display = 'none';
            }
        });
        
        // 업로드 버튼 이벤트
        const submitBtn = document.getElementById('submitUpload');
        if (submitBtn) {
            submitBtn.addEventListener('click', function() {
                uploadExcelFile();
            });
        }
    }
}

/**
 * 엑셀 파일 업로드 처리
 */
function uploadExcelFile() {
    const fileInput = document.getElementById('excelFile');
    const resultDiv = document.getElementById('uploadResult');
    const resultMessage = document.getElementById('resultMessage');
    const errorList = document.getElementById('errorList');
    const errorListUl = errorList.querySelector('ul');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('파일을 선택해주세요.');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    // 로딩 표시
    const submitBtn = document.getElementById('submitUpload');
    submitBtn.disabled = true;
    submitBtn.textContent = '업로드 중...';
    
    // 결과 영역 초기화
    resultDiv.style.display = 'none';
    errorList.style.display = 'none';
    errorListUl.innerHTML = '';
    
    // AJAX 요청
    fetch('/devices/upload-excel', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // 결과 표시
        resultDiv.style.display = 'block';
        resultMessage.textContent = data.message;
        
        if (data.success) {
            resultMessage.className = 'text-success';
            
            // 오류가 있으면 표시
            if (data.errors && data.errors.length > 0) {
                errorList.style.display = 'block';
                data.errors.forEach(error => {
                    const li = document.createElement('li');
                    li.textContent = error;
                    errorListUl.appendChild(li);
                });
            }
            
            // 3초 후 페이지 새로고침
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } else {
            resultMessage.className = 'text-danger';
        }
    })
    .catch(error => {
        resultDiv.style.display = 'block';
        resultMessage.textContent = '업로드 중 오류가 발생했습니다: ' + error.message;
        resultMessage.className = 'text-danger';
    })
    .finally(() => {
        // 로딩 표시 제거
        submitBtn.disabled = false;
        submitBtn.textContent = '업로드';
    });
}

// DOMContentLoaded 이벤트에서 초기화
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.devices-container')) {
        initDevicesPage();
    }
});

// 전역 스코프로 내보내기
window.initDevicesPage = initDevicesPage;