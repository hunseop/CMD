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

/**
 * 탭 기능 초기화
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 활성 탭 버튼 변경
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 활성 탭 내용 변경
            const tabId = button.getAttribute('data-tab');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
}

/**
 * 장비 삭제 확인
 */
function confirmDelete() {
    if (confirm('정말로 이 장비를 삭제하시겠습니까?')) {
        document.getElementById('delete-form').submit();
    }
}

/**
 * 동기화 모달 초기화
 */
function initSyncModal() {
    if (window.ModalModule) {
        const syncDeviceName = document.getElementById('syncDeviceName');
        const syncForm = document.getElementById('syncForm');
        const selectAllCheckbox = document.getElementById('selectAll');
        const checkboxes = syncForm.querySelectorAll('input[name="sync_type"]');
        
        // 전체 선택/해제 이벤트
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                checkboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                });
            });

            // 개별 체크박스 변경 시 전체 선택 상태 업데이트
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    selectAllCheckbox.checked = Array.from(checkboxes)
                        .every(cb => cb.checked);
                });
            });
        }
        
        window.ModalModule.initModal('syncModal', {
            openSelector: '.sync-btn',
            cancelSelector: '#cancelSync',
            onOpen: function(modal, button) {
                if (button) {
                    const deviceId = button.getAttribute('data-id');
                    const deviceName = button.getAttribute('data-name');
                    
                    syncDeviceName.textContent = deviceName;
                    syncForm.action = `/devices/${deviceId}/sync`;
                }
            }
        });
        
        // 동기화 버튼 이벤트
        const submitBtn = document.getElementById('submitSync');
        if (submitBtn) {
            submitBtn.addEventListener('click', submitSyncForm);
        }
    }
}

/**
 * 동기화 폼 제출
 */
function submitSyncForm() {
    const form = document.getElementById('syncForm');
    const resultDiv = document.getElementById('syncResult');
    const resultMessage = document.getElementById('syncResultMessage');
    
    // 선택된 동기화 항목 확인
    const selectedTypes = Array.from(form.querySelectorAll('input[name="sync_type"]:checked'))
        .map(input => input.value);
    
    if (selectedTypes.length === 0) {
        alert('동기화할 항목을 선택해주세요.');
        return;
    }
    
    // 로딩 표시
    const submitBtn = document.getElementById('submitSync');
    submitBtn.disabled = true;
    submitBtn.textContent = '동기화 중...';
    
    // FormData 생성
    const formData = new FormData();
    selectedTypes.forEach(type => {
        formData.append('sync_type', type);
    });
    
    // AJAX 요청
    fetch(form.action, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'  // AJAX 요청임을 명시
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new TypeError("서버가 JSON을 반환하지 않았습니다!");
        }
        return response.json();
    })
    .then(data => {
        resultDiv.style.display = 'block';
        resultMessage.textContent = data.message;
        resultMessage.className = data.success ? 'text-success' : 'text-danger';
        
        if (data.success) {
            // 3초 후 페이지 새로고침
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    })
    .catch(error => {
        resultDiv.style.display = 'block';
        resultMessage.textContent = '동기화 중 오류가 발생했습니다: ' + error.message;
        resultMessage.className = 'text-danger';
    })
    .finally(() => {
        // 로딩 표시 제거
        submitBtn.disabled = false;
        submitBtn.textContent = '동기화';
    });
}

// DOMContentLoaded 이벤트에서 초기화
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.devices-container')) {
        initDevicesPage();
        initSyncModal();
    }
    
    if (document.querySelector('.device-detail-container')) {
        initTabs();
    }
});

// 전역 스코프로 내보내기
window.initDevicesPage = initDevicesPage;