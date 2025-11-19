// script.js
document.addEventListener('DOMContentLoaded', () => {

  const webAppUrl = 'https://script.google.com/macros/s/AKfycbx2a1g7ckK7t1jABJFvDvNoAYsyoOKzYICrwQVB_eoCoUOeLpQtujRfWqK3XZZycXFm7A/exec';
  const employeeLookupUrl = 'https://script.google.com/macros/s/AKfycbwIOadR7U_oow5U4C8vOXge6oF22GD9p0bI2W2uA97f44kgziGJqgHYrjctzYReFKZDRA/exec';

  // --- STATE MANAGEMENT ---
  let currentRole = 'employee'; 
  let isAuthenticated = false; // 🔒 เพิ่มตัวแปรตรวจสอบการล็อคอิน
  let loginTargetRole = 'employee'; // ✨ [เพิ่มบรรทัดนี้] เพื่อเก็บว่ากำลังจะล็อคอินเป็นใคร
  let allEmployees = [];
  let allAttendance = [];
  let currentDisplayDate = '';
  let currentStatFilter = 'all';
  let locationVerified = false;
  let photoVerified = false;
  let photoDataUrl = ''; // 📸 เก็บข้อมูลรูปภาพแบบ Base64
  let videoStream = null;
  let slimSelect;
  let performanceSlimSelect;
  const charts = {};
  let loginAttempts = 0; // นับจำนวนครั้งที่ล็อคอินผิด
  let currentLoggedInUsername = ''; // ✨ [เพิ่มใหม่] เก็บชื่อ Username ปัจจุบันไว้ใช้ตอนเปลี่ยนรหัส


  // --- OFFICE LOCATION SETTINGS ---
const OFFICE_LAT = 13.82094;     // TODO: แก้เป็นพิกัดจริงของออฟฟิศ
const OFFICE_LON = 100.56415;    // TODO: แก้เป็นพิกัดจริงของออฟฟิศ
const MAX_DISTANCE_METERS = 100; // รัศมีที่อนุญาต (เมตร)

// --- OFFSITE STATE ---
let offsiteAllowed = false;   // เปิดให้เช็คอินนอกสถานที่เมื่ออยู่นอกเขตรัศมี
let lastLocation = null;      // {lat, lon, distance, insideRadius}
const OFFSITE_STATUS = 'นอกสถานที่';


  // --- ELEMENT SELECTORS ---
  const managerBtn = document.getElementById('managerBtn');
  const hrBtn = document.getElementById('hrBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const currentRoleDisplay = document.getElementById('currentRoleDisplay');
  const currentRoleBadge = document.getElementById('currentRoleBadge');
  const welcomeText = document.getElementById('welcomeText');

  const currentTimeEl = document.getElementById('currentTime');
  const currentDateEl = document.getElementById('currentDate');
  const workStatusText = document.getElementById('workStatusText');

  const attendanceForm = document.getElementById('attendanceForm');
  const employeeIdInput = document.getElementById('employeeId');
  const currentDateTimeInput = document.getElementById('currentDateTime');
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const departmentInput = document.getElementById('department');
  const positionInput = document.getElementById('position');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const checkInBtn = document.getElementById('checkInBtn');
  const checkOutBtn = document.getElementById('checkOutBtn');
  const statusMsg = document.getElementById('statusMsg');

  const locationIndicator = document.getElementById('locationIndicator');
  const locationIcon = document.getElementById('locationIcon');
  const locationText = document.getElementById('locationText');
  const verifyLocationBtn = document.getElementById('verifyLocationBtn');
  const locationDetails = document.getElementById('locationDetails');
  
  const photoIndicator = document.getElementById('photoIndicator');
  const photoIcon = document.getElementById('photoIcon');
  const photoText = document.getElementById('photoText');
  const openCameraBtn = document.getElementById('openCameraBtn');
  const capturePhotoBtn = document.getElementById('capturePhotoBtn');
  const closeCameraBtn = document.getElementById('closeCameraBtn');

  // เพิ่มต่อจากตัวแปร Modal อื่นๆ
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const settingsModalClose = document.getElementById('settingsModalClose');
  const settingsForm = document.getElementById('settingsForm');
  const settingsError = document.getElementById('settingsError');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');

  const cameraContainer = document.getElementById('cameraContainer');
  const videoPreview = document.getElementById('videoPreview');
  const capturedPhotoContainer = document.getElementById('capturedPhotoContainer');
  const capturedPhoto = document.getElementById('capturedPhoto');
  const retakePhotoBtn = document.getElementById('retakePhotoBtn');

  const managerHrTable = document.querySelector('.manager-hr-table');
  const exportBtn = document.getElementById('exportBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const attendanceTableBody = document.querySelector('#attendanceTable tbody');
  const filterDateStart = document.getElementById('filterDateStart');
  const filterDateEnd = document.getElementById('filterDateEnd');
  const filterDepartment = document.getElementById('filterDepartment');
  const filterStatus = document.getElementById('filterStatus');
  const applyFiltersBtn = document.getElementById('applyFilters');
  const clearFiltersBtn = document.getElementById('clearFilters');

  const managerHrStats = document.querySelector('.manager-hr-stats');
  const totalEmployees = document.getElementById('totalEmployees');
  const onTimeCount = document.getElementById('onTimeCount');
  const lateCount = document.getElementById('lateCount');
  const absentCount = document.getElementById('absentCount');
  const attendanceChartCtx = document.getElementById('attendanceChart')?.getContext('2d');

  const employeeWeeklyChart = document.querySelector('.employee-weekly-chart');
  const weeklyOnTime = document.getElementById('weeklyOnTime');
  const weeklyLate = document.getElementById('weeklyLate');
  const weeklyAbsent = document.getElementById('weeklyAbsent');
  const weeklyAvgHours = document.getElementById('weeklyAvgHours');
  const weeklyChartCtx = document.getElementById('weeklyChart')?.getContext('2d');
  
  const managerHrChart = document.querySelector('.manager-hr-chart');
  const chartPeriodType = document.getElementById('chartPeriodType'); // ✨ [เพิ่ม] ตัวเลือกหลัก
  const customDateRange = document.getElementById('customDateRange'); // ✨ [เพิ่ม] div ที่ซ่อนไว้
  const chartDateStart = document.getElementById('chartDateStart'); 
  const chartDateEnd = document.getElementById('chartDateEnd');   
  const updateChartBtn = document.getElementById('updateChart');
  const employeePerformanceChartCtx = document.getElementById('employeePerformanceChart')?.getContext('2d');
  const performanceEmployeeFilter = document.getElementById('performanceEmployeeFilter'); 

  const statCardTotal = document.getElementById('totalEmployees').parentElement;
  const statCardOnTime = document.getElementById('onTimeCount').parentElement;
  const statCardLate = document.getElementById('lateCount').parentElement;
  const statCardAbsent = document.getElementById('absentCount').parentElement;

  const loginModal = document.getElementById('loginModal');
  const loginModalClose = document.getElementById('loginModalClose');
  const loginForm = document.getElementById('loginForm');
  const loginUsername = document.getElementById('loginUsername');
  const loginPassword = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError');
  const loginTitle = document.getElementById('loginTitle');
  const loginSubtitle = document.getElementById('loginSubtitle');
  const loginIcon = document.getElementById('loginIcon');

  const confirmModal = document.getElementById('confirmModal');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmDeleteBtn = document.getElementById('confirmDelete');
  const cancelDeleteBtn = document.getElementById('cancelDelete');
  const confirmModalClose = confirmModal.querySelector('.close');
  const editModal = document.getElementById('editModal');
  const editModalClose = document.getElementById('editModalClose');
  const editCancelBtn = document.getElementById('editCancelBtn');
  const editForm = document.getElementById('editForm');
  const editSubtitle = document.getElementById('editSubtitle');
  const editKey = document.getElementById('editKey');
  const editCheckIn = document.getElementById('editCheckIn');
  const editCheckOut = document.getElementById('editCheckOut');
  const editStatus = document.getElementById('editStatus');
  const editError = document.getElementById('editError');

  const workSummaryModal = document.getElementById('workSummaryModal');
  const workSummaryOkBtn = document.getElementById('workSummaryOkBtn');
  
  const messageModal = document.getElementById('messageModal');
  const messageModalClose = document.getElementById('messageModalClose');
  const messageModalBody = document.getElementById('messageModalBody');
  const messageModalOkBtn = document.getElementById('messageModalOkBtn'); // ✨ <--- เพิ่มบรรทัดนี้
  
  const offsiteControls = document.getElementById('offsiteControls');
  const offsiteToggle = document.getElementById('offsiteToggle');
  const offsiteNoteWrap = document.getElementById('offsiteNoteWrap');
  const offsiteNote = document.getElementById('offsiteNote');

 

// ✨ [เพิ่มฟังก์ชันใหม่ 1]
  /**
   * เพิ่ม CSS เพื่อให้การ์ดสถิติดูเหมือนคลิกได้
   */
  function addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .stats-grid .stat-card {
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid transparent;
        border-radius: 12px; /* ทำให้ขอบโค้งมน */
      }
      .stats-grid .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
      .stats-grid .stat-card.active-stat {
        border-color: #2563eb; /* ขอบสีน้ำเงินเมื่อถูกเลือก */
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        transform: translateY(-2px);
      }
    `;
    document.head.appendChild(style);
  }

  // ✨ [เพิ่มฟังก์ชันใหม่ 2]
  /**
   * กรองข้อมูลตามสถานะที่เลือก (ตรงเวลา, สาย, ฯลฯ)
   */
  function applyStatFilter(data) {
    if (currentStatFilter === 'all') {
      return data;
    }
    if (currentStatFilter === 'onTime') {
      return data.filter(r => r.status === 'ตรงเวลา');
    }
    if (currentStatFilter === 'late') {
      return data.filter(r => r.status === 'สาย' || r.status === 'ลืม Check-Out');
    }
    if (currentStatFilter === 'absent') {
      return data.filter(r => r.status === 'ลาหยุดงาน');
    }
    return data;
  }

  // ✨ [เพิ่มฟังก์ชันใหม่ 3]
  /**
   * ฟังก์ชันหลัก: เมื่อคลิกการ์ดสถิติ
   */
  function setStatFilter(filter) {
    currentStatFilter = filter;
    console.log(`Stat filter set to: ${filter}`);
  
    // 1. อัปเดตขอบสีน้ำเงิน (active-stat)
    [statCardTotal, statCardOnTime, statCardLate, statCardAbsent].forEach(card => {
      card.classList.remove('active-stat');
    });
    if (filter === 'all') statCardTotal.classList.add('active-stat');
    if (filter === 'onTime') statCardOnTime.classList.add('active-stat');
    if (filter === 'late') statCardLate.classList.add('active-stat');
    if (filter === 'absent') statCardAbsent.classList.add('active-stat');
  
    // 2. รีเซ็ตตัวกรองหลัก (วันที่, แผนก)
    filterDateStart.value = '';
    filterDateEnd.value = '';
    filterStatus.value = '';
    if (typeof slimSelect !== 'undefined' && slimSelect) {
      slimSelect.setSelected([]);
    }
    
    // 3. กรองข้อมูลเฉพาะของ "วันนี้"
    const todayData = getTodayData();
    const filteredTodayData = applyStatFilter(todayData);
    
    // 4. แสดงผลตาราง
    renderAttendanceTable(filteredTodayData);
    
    // 5. อัปเดตการ์ดและกราฟ (ฟังก์ชัน updateTodayStats จะไปอ่านค่า currentStatFilter เอง)
    updateTodayStats(allAttendance); 
  }


  // --- INITIALIZATION ---
  // ⬇️ ค้นหาฟังก์ชัน init (ประมาณบรรทัด 201) แล้วแทนที่ด้วยโค้ดนี้ ⬇️

  // --- INITIALIZATION ---
  async function init() {
    console.log("WC_Check-In App Initializing...");
    updateClock();
    setInterval(updateClock, 1000);
    
    addCustomStyles(); 

    initSlimSelect();
    
    setupEventListeners();
    
    await loadDataFromSheet(); // ⬅️ รอโหลดข้อมูล (allEmployees) ให้เสร็จก่อน
    
    initPerformanceSlimSelect(); 
    
    updateUIForRole();
    renderAttendanceTable(getTodayData());
    initCharts();
    updateTodayStats(allAttendance);
    
    checkVerifications();
  }
  async function loadDataFromSheet() {
    console.log("Loading data from Google Sheet...");
    try {
      const response = await fetch(`${webAppUrl}?v=${new Date().getTime()}`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      if (data.status === 'success') {
        allAttendance = (data.attendance || []).map(record => {
          record.checkIn = cleanTimeFormat(record.checkIn);
          record.checkOut = cleanTimeFormat(record.checkOut);
          record.date     = normalizeDateStr(record.date || '');
          return record;
        });
        
        allEmployees = data.employees || [];
        console.log("Data loaded (Cleaned):", allAttendance, allEmployees);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showMessageModal('error', `ไม่สามารถโหลดข้อมูลได้: ${error.message}`);
    }
  }

  async function sendDataToSheet(data) {
    try {
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to send data:', error);
      throw error;
    }
  }

  function initSlimSelect() {
    if (typeof SlimSelect !== 'undefined' && filterDepartment) {
      slimSelect = new SlimSelect({
        select: '#filterDepartment',
        placeholder: 'เลือกแผนก',
        searchText: 'ไม่พบแผนก',
        searchPlaceholder: 'ค้นหาแผนก',
      });
    } else {
      console.warn("SlimSelect library not found or element #filterDepartment is missing.");
    }
  }

  // ✨ [เพิ่มฟังก์ชันใหม่นี้]
function initPerformanceSlimSelect() {
  if (typeof SlimSelect !== 'undefined' && performanceEmployeeFilter) {
    // รอให้ allEmployees โหลดเสร็จก่อน
    if (allEmployees.length > 0) {
      const options = allEmployees.map(emp => ({
        text: `${emp.name} (${emp.empId})`,
        value: emp.empId
      }));

      performanceSlimSelect = new SlimSelect({
        select: '#performanceEmployeeFilter',
        placeholder: 'เลือกพนักงาน (สูงสุด 5 คน)',
        searchText: 'ไม่พบพนักงาน',
        searchPlaceholder: 'ค้นหาพนักงาน',
        data: options,
        limit: 5 // จำกัดให้เลือกได้สูงสุด 5 คนเพื่อไม่ให้กราฟรก
      });
    } else {
      // ถ้า allEmployees ยังไม่มา ให้ลองใหม่ใน 1 วินาที
      setTimeout(initPerformanceSlimSelect, 1000);
    }
  } else {
    console.warn("SlimSelect (Performance) library not found or element is missing.");
  }
}

  function setupEventListeners() {
    // --- โค้ดใหม่ (แก้ไขแล้ว) ---
    managerBtn.addEventListener('click', () => showLoginModal('manager'));
    hrBtn.addEventListener('click', () => showLoginModal('hr'));
    logoutBtn.addEventListener('click', handleLogout);
    loginForm.addEventListener('submit', handleLogin);
    loginModalClose.addEventListener('click', cancelLogin); // ✅
    document.getElementById('loginCancelBtn').addEventListener('click', cancelLogin); // ✅
    employeeIdInput.addEventListener('blur', () => {
      autoFillFromDB();
      checkVerifications();
    });
    employeeIdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        autoFillFromDB();
      }
    });
    firstNameInput.addEventListener('blur', checkVerifications);
    lastNameInput.addEventListener('blur', checkVerifications);
    departmentInput.addEventListener('blur', checkVerifications);
    positionInput.addEventListener('blur', checkVerifications);
    emailInput.addEventListener('blur', checkVerifications);
    phoneInput.addEventListener('blur', checkVerifications);

    checkInBtn.addEventListener('click', handleCheckIn);
    checkOutBtn.addEventListener('click', handleCheckOut);
    
    verifyLocationBtn.addEventListener('click', handleVerifyLocation);
    openCameraBtn.addEventListener('click', handleOpenCamera);
    capturePhotoBtn.addEventListener('click', handleCapturePhoto);
    closeCameraBtn.addEventListener('click', handleCloseCamera);
    retakePhotoBtn.addEventListener('click', handleRetakePhoto);

    applyFiltersBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    clearAllBtn.style.display = 'none';
    
    confirmModalClose.addEventListener('click', () => closeModal(confirmModal));
    cancelDeleteBtn.addEventListener('click', () => closeModal(confirmModal));
    workSummaryOkBtn.addEventListener('click', () => closeModal(workSummaryModal));
    messageModalClose.addEventListener('click', () => closeModal(messageModal));
    messageModalOkBtn.addEventListener('click', () => closeModal(messageModal));
    offsiteToggle?.addEventListener('change', () => {
    offsiteNoteWrap.style.display = offsiteToggle.checked ? 'block' : 'none';
    checkVerifications();
});
    offsiteNote?.addEventListener('input', checkVerifications);
    statCardTotal.addEventListener('click', () => setStatFilter('all'));
    statCardOnTime.addEventListener('click', () => setStatFilter('onTime'));
    statCardLate.addEventListener('click', () => setStatFilter('late'));
    statCardAbsent.addEventListener('click', () => setStatFilter('absent'));
    updateChartBtn.addEventListener('click', updatePerformanceChart);
    // --- ✨ [เพิ่มส่วนนี้] ---
    // Event listener สำหรับปุ่ม 'แก้ไข' และ 'ลบ' ในตาราง
    attendanceTableBody.addEventListener('click', (e) => {
      const target = e.target;
      const key = target.dataset.key; // "EMP001|2025-11-17"

      if (!key) return; // ไม่ได้คลิกปุ่มที่มี data-key

      if (target.classList.contains('delete-btn')) {
        handleDeleteRow(key);
      }
      
      if (target.classList.contains('edit-btn')) {
        // [แก้ไข] เปิดฟังก์ชันนี้ใช้งาน
        handleEditRow(key);
      }
    });
    // --- ✨ [จบส่วนแก้ไข] ---
    editModalClose.addEventListener('click', () => closeModal(editModal));
    editCancelBtn.addEventListener('click', () => closeModal(editModal));
    editForm.addEventListener('submit', handleSaveEdit);
    // --- ✨ [จบส่วนที่เพิ่ม] ---
    chartPeriodType.addEventListener('change', () => {
      if (chartPeriodType.value === 'custom') {
        customDateRange.style.display = 'flex';
      } else {
        customDateRange.style.display = 'none';
      }
    });

    // ... (ในฟังก์ชัน setupEventListeners)

    // ✨ [เพิ่มใหม่] ปุ่มเปิดหน้าตั้งค่า
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        // รีเซ็ตฟอร์ม
        settingsForm.reset();
        settingsError.style.display = 'none';
        
        // เติม Username ปัจจุบันลงไป (แต่ปิดไม่ให้แก้ หรือให้แก้ก็ได้ตามใจชอบ)
        const newUserInput = document.getElementById('newUsername');
        if(newUserInput) newUserInput.value = currentLoggedInUsername;
        
        const newNameInput = document.getElementById('newName');
        if(newNameInput) newNameInput.value = currentLoggedInName;

        openModal(settingsModal);
      });
    }

    // ✨ [เพิ่มใหม่] ปุ่มปิดหน้าตั้งค่า
    if (settingsModalClose) {
      settingsModalClose.addEventListener('click', () => closeModal(settingsModal));
    }

    // ✨ [เพิ่มใหม่] เมื่อกดบันทึกการเปลี่ยนรหัส
    if (settingsForm) {
      settingsForm.addEventListener('submit', handleSaveSettings);
    }

}

  async function autoFillFromDB() {
    // ✨ [แก้ไข] 1. อ่านค่า, trim, และแปลงเป็นตัวใหญ่ทั้งหมด
    const formattedId = (employeeIdInput.value || '').trim().toUpperCase();
    
    // ✨ [แก้ไข] 2. เขียนค่าที่แปลงแล้ว (ตัวใหญ่) กลับลงในช่อง input
    employeeIdInput.value = formattedId;

    // ✨ [แก้ไข] 3. ใช้ formattedId (ตัวใหญ่) ในการตรวจสอบและค้นหา
    if (!formattedId) return;

    try {
      // ✨ [แก้ไข] 4. ใช้ formattedId (ตัวใหญ่) ในการส่งคำขอ
      const res = await fetch(`${employeeLookupUrl}?empId=${encodeURIComponent(formattedId)}`);
      const data = await res.json();

      if (data.status === 'success') {
        firstNameInput.value   = data.firstName || '';
        lastNameInput.value    = data.lastName  || '';
        departmentInput.value  = data.department || '';
        positionInput.value    = data.position   || '';
        emailInput.value       = data.email      || '';
        phoneInput.value       = data.phone      || '';

        if (typeof checkVerifications === 'function') checkVerifications();

      } else if (data.status === 'not_found') {
        firstNameInput.value = '';
        lastNameInput.value  = '';
        departmentInput.value = '';
        positionInput.value   = '';
        emailInput.value      = '';
        phoneInput.value      = '';
        if (typeof checkVerifications === 'function') checkVerifications();
        showMessageModal('error', 'ไม่พบรหัสพนักงานนี้ในฐานข้อมูลกลาง');
      } else {
        showMessageModal('error', data.message || 'เกิดข้อผิดพลาดในการค้นหาพนักงาน');
      }
    } catch (err) {
      showMessageModal('error', `เชื่อมต่อฐานข้อมูลกลางไม่สำเร็จ: ${err.message}`);
    }
  }

  // ⬇️ ค้นหาฟังก์ชัน updateClock แล้วแทนที่ด้วยโค้ดนี้ ⬇️
  function updateClock() {
    const now = new Date();
    
    // --- 1. อัปเดตนาฬิกาและวันที่ (เหมือนเดิม) ---
    const time = now.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const date = now.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    currentTimeEl.textContent = time;
    currentDateEl.textContent = date;
    
    if (currentDateTimeInput) {
      currentDateTimeInput.value = `${date} เวลา ${time}`;
    }
    
    // --- 2. ✨ [แก้ไข] ตรวจสอบการข้ามวัน (Midnight Rollover) + Auto Check-Out ---
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
    
    if (currentDisplayDate === '') {
      currentDisplayDate = todayStr; // ตั้งค่าเริ่มต้นในครั้งแรกที่โหลด
    }
    
    // ถ้าวันที่ใหม่ไม่ตรงกับวันที่แสดงผลอยู่ (เช่น เพิ่งข้ามเที่ยงคืน)
    if (todayStr !== currentDisplayDate) {
      console.log("Midnight rollover detected. Updating display for new day.");
      
      // --- ⬇️ [เพิ่มใหม่] สั่งประมวลผล Auto Check-Out สำหรับวันที่เพิ่งผ่านมา ---
      const yesterdayStr = currentDisplayDate; // วันที่ที่เพิ่งจบไป
      
      // สั่งให้ระบบทำงานเบื้องหลัง (ไม่ต้องรอ)
      processAutoCheckOuts(yesterdayStr).then(() => {
         console.log(`Background auto-checkout process for ${yesterdayStr} complete.`);
      });
      // --- ⬆️ [จบส่วนที่เพิ่ม] ---

      currentDisplayDate = todayStr; // อัปเดตวันที่เป็นวันใหม่
      
      // สั่งรีเฟรชตารางและสถิติสำหรับวันใหม่ (เหมือนเดิม)
      renderAttendanceTable(getTodayData()); 
      updateTodayStats(allAttendance); // สถิติจะคำนวณของวันใหม่ (เป็น 0)
    }

    // --- 3. อัปเดตสถานะการทำงาน (เหมือนเดิม) ---
    const currentHour = now.getHours();
    const workStatusEl = workStatusText.parentElement; 

    if (currentHour < 9) {
      workStatusText.textContent = `${time} - ก่อนเวลาทำงาน`; 
      workStatusEl.className = 'status-pre-work';
    } else if (currentHour >= 9 && currentHour < 18) {
      workStatusText.textContent = `${time} - ในเวลาทำงาน`;
      workStatusEl.className = 'status-on-work';
    } else {
      workStatusText.textContent = `${time} - นอกเวลาทำการ`;
      workStatusEl.className = 'status-off-work';
    }
  }

// ⬇️ 1. ค้นหาฟังก์ชัน showLoginModal (ประมาณบรรทัด 348) แล้วแทนที่ด้วยโค้ดนี้ ⬇️
  function showLoginModal(role) {
    // currentRole = role; // ❌ [ลบ/แก้ไข] บรรทัดนี้
    loginTargetRole = role; // ✅ [แก้ไข] ให้มาตั้งค่าตัวแปรใหม่นี้แทน
    
    if (role === 'manager') {
      loginTitle.textContent = "Manager Login";
      loginSubtitle.textContent = "เข้าสู่ระบบสำหรับผู้จัดการ";
      loginIcon.textContent = "🧑‍💼";
    } else {
      loginTitle.textContent = "HR Login";
      loginSubtitle.textContent = "เข้าสู่ระบบสำหรับฝ่ายบุคคล";
      loginIcon.textContent = "👩‍💻";
    }
    loginError.style.display = 'none';
    loginUsername.value = '';
    loginPassword.value = '';
    openModal(loginModal);
  }

// ⬇️ 2. ค้นหาฟังก์ชัน handleLogin (ประมาณบรรทัด 367) แล้วแทนที่ด้วยโค้ดนี้ ⬇️
async function handleLogin(e) {
    e.preventDefault();
    
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    const submitBtn = document.getElementById('loginSubmitBtn'); // ปุ่มล็อกอิน

    if (!username || !password) {
      loginError.textContent = "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน";
      loginError.style.display = 'block';
      return;
    }

    // 1. แสดงสถานะกำลังโหลด
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳</span> <span>กำลังตรวจสอบ...</span>';
    loginError.style.display = 'none';

    try {
      // 2. ส่งข้อมูลไปตรวจสอบที่ Google Apps Script
      const response = await sendDataToSheet({
        action: 'login',
        username: username,
        password: password
      });

      if (response.status === 'success') {
        // --- 3. ล็อกอินสำเร็จ ---
        const userRole = response.data.role; // รับ role จาก Server (manager/hr)
        const userName = response.data.name;
        currentLoggedInUsername = username; // ✨ [เพิ่มบรรทัดนี้] จำ Username ไว้
        currentLoggedInName = userName; 
        // ตรวจสอบว่า Role ที่ได้ ตรงกับที่พยายามจะเข้าหรือไม่ (Optional)
        // หรือจะอนุญาตให้ user คนเดียวเป็นได้ทั้งสองอย่างก็ได้
        // ในที่นี้เราจะยึดตาม Role ที่ Server ส่งมา
        
        if (loginTargetRole !== userRole) {
           // ถ้าพยายามเข้า Manager แต่ User เป็น HR อาจจะแจ้งเตือน หรือปล่อยผ่านก็ได้
           // ในที่นี้ขอปล่อยผ่าน โดยปรับ currentRole ตามจริง
        }

        isAuthenticated = true;
        currentRole = userRole; 
        
        // อัปเดต UI
        welcomeText.textContent = `ยินดีต้อนรับ ${userName || (userRole === 'manager' ? 'ผู้จัดการ' : 'HR')}`;
        
        closeModal(loginModal);
        updateUIForRole(); // อัปเดตหน้าจอ
        showMessageModal('success', `เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับคุณ ${userName}`);

      } else {
        // --- 4. ล็อกอินล้มเหลว ---
        throw new Error(response.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }

    } catch (error) {
      isAuthenticated = false;
      currentRole = 'employee';
      
      loginError.textContent = error.message;
      loginError.style.display = 'block';
    } finally {
      // 5. คืนค่าปุ่ม
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>🔓</span> <span>เข้าสู่ระบบ</span>';
    }
  }

// ⬇️ 3. ค้นหาฟังก์ชัน cancelLogin (ประมาณบรรทัด 387) แล้วแทนที่ด้วยโค้ดนี้ ⬇️
  function cancelLogin() {
    closeModal(loginModal);
    isAuthenticated = false;      // ✅ รีเซ็ตสถานะ
    currentRole = 'employee'; // รีเซ็ตสิทธิ์กลับเป็นพนักงานปกติ
    loginTargetRole = 'employee'; // ✅ รีเซ็ตสิทธิ์ที่พยายามจะเข้า
  }

// ⬇️ 4. ค้นหาฟังก์ชัน handleLogout (ประมาณบรรทัด 393) แล้วแทนที่ด้วยโค้ดนี้ ⬇️
  function handleLogout() {
    isAuthenticated = false;      // ✅ รีเซ็ตสถานะ
    currentRole = 'employee'; // ✅ รีเซ็ตสิทธิ์
    loginTargetRole = 'employee'; // ✅ รีเซ็ตสิทธิ์ที่พยายามจะเข้า
    updateUIForRole();
    showMessageModal('info', 'ออกจากระบบสำเร็จ');
  }

// ⬇️ 5. ค้นหาฟังก์ชัน updateUIForRole (ประมาณบรรทัด 399) แล้วแทนที่ด้วยโค้ดนี้ ⬇️
// ⬇️ 5. ค้นหาฟังก์ชัน updateUIForRole (ประมาณบรรทัด 399) แล้วแทนที่ด้วยโค้ดนี้ ⬇️
  function updateUIForRole() {
    // ซ่อนกลุ่ม .manager-hr-table, .manager-hr-stats, .manager-hr-chart
    document.querySelectorAll('.manager-hr-table, .manager-hr-stats, .manager-hr-chart').forEach(el => {
      el.style.display = 'none';
    });
    
    // ✨ [FIX] ซ่อน .employee-weekly-chart (ถ้ามี)
    if (employeeWeeklyChart) {
      employeeWeeklyChart.style.display = 'none';
    }
    
    // ✅ [แก้ไข] ตรวจสอบ isAuthenticated (ว่าล็อคอินจริง) และ currentRole (ว่าเป็น manager/hr)
    if (isAuthenticated && (currentRole === 'manager' || currentRole === 'hr')) {
      // --- 1. แสดงผลสำหรับ Manager/HR ที่ล็อคอินแล้ว ---
      managerBtn.style.display = 'none';
      hrBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
      
      if(settingsBtn) settingsBtn.style.display = 'inline-block';

      currentRoleDisplay.style.display = 'flex';
      currentRoleBadge.textContent = currentRole === 'manager' ? 'ผู้จัดการ' : 'HR';
      currentRoleBadge.className = currentRole === 'manager' ? 'role-badge manager' : 'role-badge hr';
      welcomeText.textContent = `ยินดีต้อนรับ ${currentRole === 'manager' ? 'ผู้จัดการ' : 'HR'}`;
      
      document.querySelectorAll('.manager-hr-table, .manager-hr-stats, .manager-hr-chart').forEach(el => {
        el.style.display = 'block';
      });
      // (employeeWeeklyChart ถูกซ่อนไปแล้ว)

    } else {
      // --- 2. แสดงผลสำหรับ Employee (ค่าเริ่มต้น) ---
      managerBtn.style.display = 'inline-block';
      hrBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
      currentRoleDisplay.style.display = 'none';
      
      if(settingsBtn) settingsBtn.style.display = 'none';

      // ✨ [FIX] แสดง .employee-weekly-chart (ถ้ามี)
      if (employeeWeeklyChart) {
        employeeWeeklyChart.style.display = 'block'; 
      }
    }
    
    refreshCharts();
  }
  
  // --- ⬇️ [เพิ่มฟังก์ชันใหม่] 1. คำนวณเวลา Auto Check-Out ---
/**
 * คำนวณเวลา Check-Out โดยบวก 9 ชั่วโมงจาก Check-In
 * @param {string} checkInTime (e.g., "09:30")
 * @returns {string} (e.g., "18:30")
 */
function getAutoCheckOutTime(checkInTime) {
  try {
    const [inHours, inMins] = checkInTime.split(':').map(Number);
    const inDate = new Date();
    inDate.setHours(inHours, inMins, 0, 0); // ตั้งเวลา
    
    inDate.setHours(inDate.getHours() + 9); // บวก 9 ชั่วโมง
    
    const outHours = inDate.getHours().toString().padStart(2, '0');
    const outMins = inDate.getMinutes().toString().padStart(2, '0');
    
    return `${outHours}:${outMins}`;
  } catch (e) {
    console.error("Error calculating auto-checkout time:", e);
    return "18:00"; // Fallback
  }
}

// --- ⬇️ [เพิ่มฟังก์ชันใหม่] 2. ประมวลผล Auto Check-Out ---
/**
 * ค้นหาคนที่ลืม Check-Out ของเมื่อวาน และอัปเดตข้อมูล
 * @param {string} yesterdayStr (YYYY-MM-DD)
 */
async function processAutoCheckOuts(yesterdayStr) {
  console.log(`Processing auto-checkouts for ${yesterdayStr}...`);
  
  // 1. ค้นหาคนที่ลืม (ของเมื่อวาน, มี CheckIn, ไม่มี CheckOut)
  const recordsToFix = allAttendance.filter(r => 
    r.date === yesterdayStr && 
    r.checkIn && 
    !r.checkOut
  );
  
  if (recordsToFix.length === 0) {
    console.log("No records to auto-checkout.");
    return;
  }
  
  console.log(`Found ${recordsToFix.length} records to auto-checkout.`);
  
  // 2. สร้าง Promise list เพื่อส่งคำขอแก้ไขทั้งหมด
  const promises = recordsToFix.map(record => {
    return (async () => {
      try {
        // 2.1. คำนวณเวลาใหม่
        const newCheckOut = getAutoCheckOutTime(record.checkIn);
        const hoursCalc = calculateWorkHours(record.checkIn, newCheckOut);
        
        // 2.2. สร้างข้อมูลที่จะส่ง
        const dataToSend = {
          action: "edit", // ใช้ action 'edit' ที่มีอยู่
          empId: record.empId,
          date: record.date,
          
          checkIn: record.checkIn,
          checkOut: newCheckOut,
          status: 'ลืม Check-Out', // ❗️ ตั้งสถานะใหม่
          
          // ส่งข้อมูลเวลาที่คำนวณใหม่
          workHours: hoursCalc.workHours,
          otHours: hoursCalc.otHours,
          totalHours: hoursCalc.totalHours,
          totalHours_HHMM: hoursCalc.totalHours_HHMM
        };

        // 2.3. ส่งข้อมูลไป Google Sheet
        const response = await sendDataToSheet(dataToSend);
        
        if (response.status === 'success') {
          // 2.4. [สำคัญ] อัปเดตข้อมูลใน 'allAttendance' (ในเครื่อง)
          const recordIndex = allAttendance.findIndex(r => r.empId === record.empId && r.date === record.date);
          if (recordIndex > -1) {
            // อัปเดตด้วยข้อมูลที่เซิร์ฟเวอร์ตอบกลับ (response.data)
            allAttendance[recordIndex] = { ...allAttendance[recordIndex], ...response.data };
            console.log(`Successfully auto-checked out ${record.empId} for ${record.date}`);
          }
        } else {
          throw new Error(response.message);
        }
      } catch (err) {
        console.error(`Failed to auto-checkout ${record.empId} for ${record.date}: ${err.message}`);
      }
    })(); // Execute the async function
  });
  
  // 3. รอให้ทุกอย่างเสร็จ (เพื่อ log)
  await Promise.all(promises);
  console.log("Auto-checkout background process finished.");
}
// --- ⬆️ [จบฟังก์ชันที่เพิ่ม] ---


  /**
   * กรองข้อมูล allAttendance ทั้งหมด ให้เหลือเฉพาะข้อมูลของวันนี้
   */
  function getTodayData() {
    const today = new Date().toLocaleDateString('en-CA'); // "YYYY-MM-DD"
    return allAttendance.filter(r => normalizeDateStr(r.date) === today);
  }


  function getTodayAttendance(empId) {
    if (!empId) return undefined;
    const today = new Date().toLocaleDateString('en-CA');
    return allAttendance.find(r => r.empId == empId && r.date == today);
  }

  async function handleCheckIn() {
  if (!validateForm?.()) return;

  checkInBtn.disabled = true;
  checkInBtn.textContent = 'กำลังบันทึก...';

  const isOffsite = !lastLocation?.insideRadius && offsiteToggle.checked;

  const newRecord = {
    id: "A" + (allAttendance.length + 1).toString().padStart(3, '0'),
    empId: employeeIdInput.value,
    name: `${firstNameInput.value} ${lastNameInput.value}`,
    department: departmentInput.value,
    position: positionInput.value,
    date: new Date().toLocaleDateString('en-CA'),
    checkIn: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }),
    status: (checkIsLate?.() ? "สาย" : "ตรงเวลา"), // [แก้ไข] ให้สถานะเป็นเรื่องของเวลาเสมอ
    photoData: photoDataUrl,

    // ⬇️ ฟิลด์ใหม่
    onsite: !isOffsite,
    offsiteNote: isOffsite ? (offsiteNote.value || '').trim() : '',
    locationLat: lastLocation?.lat ?? null,
    locationLon: lastLocation?.lon ?? null,
    locationDistanceM: lastLocation?.distance != null ? Math.round(lastLocation.distance) : null
  };

  try {
    const response = await sendDataToSheet({ ...newRecord, action: "checkIn" });
    newRecord.photoUrl = response?.data?.photoUrl || '';
    delete newRecord.photoData;

    allAttendance.push(newRecord);
    renderAttendanceTable(getTodayData());
    updateTodayStats?.(allAttendance);
    showMessageModal?.('success', `คุณ ${firstNameInput.value} ลงเวลาเข้างานสำเร็จ!`);
    checkVerifications();
  } catch (error) {
    showMessageModal?.('error', `ลงเวลาเข้างานไม่สำเร็จ: ${error.message}`);
  } finally {
    checkInBtn.disabled = false;
    checkInBtn.innerHTML = '<span class="button-text">ลงเวลาเข้างาน</span> <span class="button-shine"></span>';
  }
}

  
 async function handleCheckOut() {
    if (!validateForm()) return; // ✅ บังคับให้ยืนยันตำแหน่ง/รูปถ่าย ก่อน
    
    checkOutBtn.disabled = true;
    checkOutBtn.textContent = 'กำลังบันทึก...';
    
    const empId = employeeIdInput.value;
    const recordToUpdate = getTodayAttendance(empId);

    if (!recordToUpdate || recordToUpdate.checkOut) {
      showMessageModal('error', 'ไม่พบข้อมูลการเข้างานของคุณในวันนี้ หรือคุณลงเวลาออกไปแล้ว');
      checkOutBtn.disabled = false;
      checkOutBtn.innerHTML = '<span class="button-text">ลงเวลาออกงาน</span> <span class="button-shine"></span>';
      return;
    }
    
    // --- 1. คำนวณเวลา (เหมือนเดิม) ---
    recordToUpdate.checkOut = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    const hoursCalc = calculateWorkHours(recordToUpdate.checkIn, recordToUpdate.checkOut);
    recordToUpdate.workHours = hoursCalc.workHours;
    recordToUpdate.otHours = hoursCalc.otHours;
    recordToUpdate.totalHours = hoursCalc.totalHours;
    recordToUpdate.totalHours_HHMM = hoursCalc.totalHours_HHMM;

    // --- 2. ✨ [เพิ่มใหม่] เพิ่มข้อมูลยืนยันตัวตนตอน Check-Out ---
    //    เราจะใช้ค่าจากตัวแปร global (lastLocation, photoDataUrl)
    //    ที่เพิ่งถูกตั้งค่าตอนกดปุ่ม validateForm()
    const isOffsite = !lastLocation?.insideRadius && offsiteToggle.checked;

    recordToUpdate.checkOut_photoData = photoDataUrl; // 📸 รูปตอน Check-Out
    recordToUpdate.checkOut_onsite = !isOffsite;
    recordToUpdate.checkOut_offsiteNote = isOffsite ? (offsiteNote.value || '').trim() : '';
    recordToUpdate.checkOut_lat = lastLocation?.lat ?? null; // 📍 พิกัดตอน Check-Out
    recordToUpdate.checkOut_lon = lastLocation?.lon ?? null;
    recordToUpdate.checkOut_distance = lastLocation?.distance != null ? Math.round(lastLocation.distance) : null;
    try {
      // --- 3. ส่งข้อมูลที่อัปเดตแล้วไป (โค้ดเดิม) ---
      const response = await sendDataToSheet({...recordToUpdate, action: "checkOut"});

      // ✨ [แก้ไข] นำ photoUrl ที่ได้จาก backend มาเก็บใน record
      // เพื่อให้ renderAttendanceTable ทำงานได้ถูกต้องทันที
      if (response?.data?.checkOut_photoUrl) {
         recordToUpdate.checkOut_photoUrl = response.data.checkOut_photoUrl;
      }

      renderAttendanceTable(getTodayData());
      updateTodayStats(allAttendance);
      
      showSummaryModal(recordToUpdate); 
      resetForm();

    } catch (error) {
      showMessageModal('error', `ลงเวลาออกงานไม่สำเร็จ: ${error.message}`);
    } finally {
      checkOutBtn.disabled = false;
      checkOutBtn.innerHTML = '<span class="button-text">ลงเวลาออกงาน</span> <span class="button-shine"></span>';
    }
  }

  // --- ✨ [เพิ่มฟังก์ชันใหม่] ---
  /**
   * จัดการการลบแถว
   * @param {string} key รูปแบบ "empId|date" (เช่น "EMP001|2025-11-17")
   */
  function handleDeleteRow(key) {
    const [empId, date] = key.split('|');
    if (!empId || !date) {
      showMessageModal('error', 'Key สำหรับลบข้อมูลไม่ถูกต้อง');
      return;
    }
    
    // ค้นหาข้อมูลใน State เพื่อเอาชื่อมาแสดงยืนยัน
    const record = allAttendance.find(r => r.empId === empId && r.date === date);
    const recordName = record ? record.name : `รหัส ${empId}`;
    const displayDate = new Date(date).toLocaleDateString('th-TH');

    // 1. แสดง Modal ยืนยันการลบ
    showConfirmModal(
      `คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลการลงเวลาของ ${recordName} ในวันที่ ${displayDate}?`,
      async () => {
        // --- 2. ปิด Modal ยืนยัน
        closeModal(confirmModal);

        try {
          // --- 3. ส่งคำสั่งลบไป Backend
          const response = await sendDataToSheet({
            action: "delete",
            empId: empId,
            date: date
          });

          if (response.status === 'success') {
            // --- 4. ลบข้อมูลออกจาก State (allAttendance) ในเครื่อง
            allAttendance = allAttendance.filter(r => !(r.empId === empId && r.date === date));
            
            // --- 5. Render ตารางใหม่ และอัปเดตสถิติ
            applyFilters(); 
            showMessageModal('success', `ลบข้อมูล ${recordName} สำเร็จ`);
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          showMessageModal('error', `ลบข้อมูลไม่สำเร็จ: ${error.message}`);
        }
      }
    );
  }
  

  function handleEditRow(key) {
  const [empId, date] = key.split('|');
  if (!empId || !date) {
    showMessageModal('error', 'Key สำหรับแก้ไขข้อมูลไม่ถูกต้อง');
    return;
  }
  
  // 1. ค้นหาข้อมูลใน State
  const record = allAttendance.find(r => r.empId === empId && r.date === date);
  if (!record) {
    showMessageModal('error', 'ไม่พบข้อมูล (State) ที่ตรงกัน');
    return;
  }
  
  console.log("Editing record:", record);

  // 2. เคลียร์ค่าเก่าและตั้งค่า Modal
  editError.style.display = 'none';
  editSubtitle.textContent = `กำลังแก้ไขข้อมูลของ: ${record.name} (${new Date(date).toLocaleDateString('th-TH')})`;
  
  // 3. เก็บ key ไว้ใน form เพื่อใช้ตอนบันทึก
  editKey.value = key; 
  
  // 4. เติมข้อมูลเดิมลงในฟอร์ม
  editCheckIn.value = record.checkIn || '';
  editCheckOut.value = record.checkOut || '';
  editStatus.value = record.status || '';

  // 5. เปิด Modal
  openModal(editModal);
}

/**
 * ✨ [ฟังก์ชันใหม่]
 * จัดการเมื่อกด "บันทึก" ใน Edit Modal
 */
async function handleSaveEdit(e) {
  e.preventDefault();
  
  const key = editKey.value;
  const [empId, date] = key.split('|');
  
  // 1. ดึงข้อมูลใหม่จากฟอร์ม
  const newCheckIn = editCheckIn.value.trim();
  const newCheckOut = editCheckOut.value.trim();
  const newStatus = editStatus.value;
  
  // 2. [สำคัญ] คำนวณเวลาใหม่
  let hoursCalc = { workHours: 0, otHours: 0, totalHours: 0, totalHours_HHMM: '0.00' };
  if (newCheckIn && newCheckOut) {
    // ใช้ฟังก์ชันที่มีอยู่แล้ว
    hoursCalc = calculateWorkHours(newCheckIn, newCheckOut);
  } else if (newCheckIn && !newCheckOut) {
    // ถ้ามีแต่ Check-In ให้รีเซ็ตเวลา
    hoursCalc.status = newStatus;
  }
  
  // 3. สร้าง Object ที่จะส่งไป Apps Script
  const dataToSend = {
    action: "edit", // ❗️ ใช้ action ใหม่
    empId: empId,
    date: date,
    
    // ข้อมูลใหม่
    checkIn: newCheckIn || null,
    checkOut: newCheckOut || null,
    status: newStatus || null,
    
    // เวลาที่คำนวณใหม่
    workHours: hoursCalc.workHours,
    otHours: hoursCalc.otHours,
    totalHours: hoursCalc.totalHours,
    totalHours_HHMM: hoursCalc.totalHours_HHMM
  };

  console.log("Sending edit data:", dataToSend);
  
  try {
    const editSaveBtn = document.getElementById('editSaveBtn');
    editSaveBtn.disabled = true;
    editSaveBtn.querySelector('span:last-child').textContent = 'กำลังบันทึก...';
    
    // 4. ส่งข้อมูล
    const response = await sendDataToSheet(dataToSend);
    
    if (response.status === 'success') {
      // 5. อัปเดต State (allAttendance) ในเครื่อง
      const recordIndex = allAttendance.findIndex(r => r.empId === empId && r.date === date);
      if (recordIndex > -1) {
        // อัปเดตข้อมูลใน array ด้วยข้อมูลใหม่
        allAttendance[recordIndex] = { ...allAttendance[recordIndex], ...response.data };
      } else {
        // ถ้าไม่เจอก็เพิ่มใหม่ (ไม่ควรเกิด)
        allAttendance.push(response.data);
      }
      
      // 6. ปิด Modal และ Render ตารางใหม่
      closeModal(editModal);
      applyFilters(); // Render ตารางใหม่ + อัปเดตสถิติ
      showMessageModal('success', 'บันทึกการแก้ไขเรียบร้อย');
      
    } else {
      throw new Error(response.message);
    }
    
  } catch (error) {
    editError.textContent = `บันทึกไม่สำเร็จ: ${error.message}`;
    editError.style.display = 'block';
  } finally {
    const editSaveBtn = document.getElementById('editSaveBtn');
    editSaveBtn.disabled = false;
    editSaveBtn.querySelector('span:last-child').textContent = 'บันทึกการเปลี่ยนแปลง';
  }
}
  
  function checkIsLate() {
    const now = new Date();
    const checkInTime = now.getHours() * 60 + now.getMinutes();
    const lateThreshold = 9 * 60;
    return checkInTime > lateThreshold;
  }
  


  
 // ⬇️ ค้นหาฟังก์ชัน calculateWorkHours (บรรทัด 565) แล้วแทนที่ด้วยโค้ดนี้ ⬇️

function calculateWorkHours(checkIn, checkOut) {
  const [inHours, inMins] = checkIn.split(':').map(Number);
  const [outHours, outMins] = checkOut.split(':').map(Number);

  let totalMins = (outHours * 60 + outMins) - (inHours * 60 + inMins);
  if (totalMins < 0) totalMins += 24 * 60; // เผื่อกรณีข้ามวัน

  // 1. คำนวณเป็น "ชั่วโมงทศนิยม" (สำหรับกราฟ)
  const totalDecimalHours = totalMins / 60; 
  const workHours = Math.min(totalDecimalHours, 8.0);
  const otHours   = Math.max(0, totalDecimalHours - 8.0);
  
  // 2. คำนวณเป็น "HH.MM" (สำหรับคุณ)
  const displayMins = Math.round(totalDecimalHours * 60);
  const h = Math.floor(displayMins / 60);
  const m = displayMins % 60;
  const hhmmString = `${h}.${m.toString().padStart(2, '0')}`;

  return {
    workHours: parseFloat(workHours.toFixed(2)),
    otHours: parseFloat(otHours.toFixed(2)),
    totalHours: parseFloat(totalDecimalHours.toFixed(2)), // ⬅️ e.g., 1.70 (สำหรับกราฟ)
    totalHours_HHMM: hhmmString                        // ⬅️ e.g., "1.42" (สำหรับคุณ)
  };
}
  
  function validateForm() {
    if (!employeeIdInput.value || !firstNameInput.value || !lastNameInput.value || !departmentInput.value) {
      showMessageModal('error', 'กรุณากรอกข้อมูลพนักงานให้ครบถ้วน (รหัส, ชื่อ, นามสกุล, แผนก)');
      return false;
    }
    if (!locationVerified) {
      showMessageModal('error', 'กรุณายืนยันตำแหน่งที่ตั้ง');
      return false;
    }
    if (!photoVerified) {
      showMessageModal('error', 'กรุณายืนยันตัวตนด้วยรูปถ่าย');
      return false;
    }
    return true;
  }

  function resetForm() {
    attendanceForm.reset();
    resetVerifications();
  }

  function cleanTimeFormat(timeInput) {
    if (!timeInput || typeof timeInput !== 'string') return timeInput;
    if (/^\d{2}:\d{2}$/.test(timeInput)) return timeInput;

    try {
      const d = new Date(timeInput);
      if (isNaN(d.getTime())) return timeInput;
      
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (e) {
      return timeInput;
    }
  }

function normalizeDateStr(input) {
  if (!input) return '';
  // ถ้าเป็น YYYY-MM-DD อยู่แล้ว
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  // MM/DD/YYYY หรือ DD/MM/YYYY
  const m = String(input).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let a = parseInt(m[1],10), b = parseInt(m[2],10), y = m[3];
    if (y.length === 2) y = '20' + y;
    // ถ้า a>12 แปลว่าเป็น DD/MM/YYYY
    let month = (a > 12) ? b : a;
    let day   = (a > 12) ? a : b;
    return `${y}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

  // กรณีเป็นสตริงวันที่อื่น ๆ
  try {
    const d = new Date(input);
    if (!isNaN(d)) {
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const day = String(d.getDate()).padStart(2,'0');
      return `${y}-${m}-${day}`;
    }
  } catch {}
  return '';
}

function dateKey(dstr) {
  const n = normalizeDateStr(dstr);
  return n ? n.replace(/-/g, '') : '';
}


  function getHaversineDistance(lat1, lon1, lat2, lon2) {
    function toRad(value) {
      return (value * Math.PI) / 180;
    }

    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance * 1000;
  }

 function handleVerifyLocation() {
  if (!navigator.geolocation) {
    showMessageModal?.('error', 'เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง');
    locationText.textContent = "เบราว์เซอร์ไม่รองรับ";
    locationIcon.textContent = "❌";
    locationIndicator.className = "status-indicator error";
    return;
  }

  verifyLocationBtn.disabled = true;
  locationText.textContent = "กำลังตรวจสอบตำแหน่ง...";
  locationIcon.textContent = "⏳";
  locationIndicator.className = "status-indicator checking";
  locationDetails.style.display = 'none';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;

      const distance = getHaversineDistance(userLat, userLon, OFFICE_LAT, OFFICE_LON);

      lastLocation = {
        lat: userLat,
        lon: userLon,
        distance: distance,
        insideRadius: distance <= MAX_DISTANCE_METERS
      };

      const mapsUrl = `https://www.google.com/maps?q=${userLat},${userLon}`;
      locationDetails.innerHTML = `พิกัดของคุณ: ${userLat.toFixed(5)}, ${userLon.toFixed(5)} | ระยะห่าง: ${distance.toFixed(2)} เมตร
         | <a href="${mapsUrl}" target="_blank" style="color:#2563eb;">เปิดแผนที่</a>`;
      locationDetails.style.display = 'block';

      if (lastLocation.insideRadius) {
        // ในเขตออฟฟิศ
        offsiteAllowed = false;
        offsiteControls.style.display = 'none';
        offsiteToggle.checked = false;
        offsiteNoteWrap.style.display = 'none';

        locationVerified = true;
        locationText.textContent = "ตำแหน่งที่ตั้งถูกต้อง (ภายในออฟฟิศ)";
        locationIcon.textContent = "✅";
        locationIndicator.className = "status-indicator success";
      } else {
        // นอกเขตออฟฟิศ -> เปิดโหมด Offsite
        offsiteAllowed = true;
        offsiteControls.style.display = 'block';

        locationVerified = true; // อ่านพิกัดได้แล้ว
        locationText.textContent = `อยู่นอกพื้นที่ออฟฟิศ (ห่าง ${distance.toFixed(0)} ม.) - เลือก "เช็คอินนอกสถานที่" เพื่อดำเนินการต่อ`;
        locationIcon.textContent = "⚠️";
        locationIndicator.className = "status-indicator checking";
      }

      verifyLocationBtn.disabled = false;
      checkVerifications();
    },
    (error) => {
      verifyLocationBtn.disabled = false;
      locationText.textContent = "ไม่สามารถตรวจสอบตำแหน่งได้";
      locationIcon.textContent = "❌";
      locationIndicator.className = "status-indicator error";

      if (error?.code === error.PERMISSION_DENIED) {
        showMessageModal?.('error', 'กรุณาอนุญาตให้เข้าถึงตำแหน่งที่ตั้งเพื่อลงเวลา');
      }
      checkVerifications();
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );
}



  async function handleOpenCamera() {
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      videoPreview.srcObject = videoStream;

      // --- ✨ [เพิ่มส่วนนี้] ---
      // เราจะรอจนกว่า video element จะพร้อม (onloadedmetadata)
      // เพื่อให้แน่ใจว่า videoWidth และ videoHeight ไม่ใช่ 0
      await new Promise((resolve, reject) => {
        
        // เมื่อวิดีโอพร้อม ให้สั่ง resolve()
        videoPreview.onloadedmetadata = () => {
          console.log("Video metadata loaded. Dimensions:", videoPreview.videoWidth, videoPreview.videoHeight);
          resolve(); 
        };
        
        // กันเหนียว: ถ้า 5 วินาทีแล้วยังไม่โหลด ให้ reject
        setTimeout(() => {
          if (videoPreview.videoWidth === 0) {
             reject(new Error("Video metadata failed to load in 5s."));
          } else {
             resolve(); // อาจจะโหลดทันพอดี
          }
        }, 5000);
      });
      // --- ✨ [จบส่วนที่เพิ่ม] ---

      // ย้าย UI update มาไว้ตรงนี้ (หลังจาก video พร้อม)
      cameraContainer.style.display = 'block';
      openCameraBtn.style.display = 'none';
      capturePhotoBtn.style.display = 'inline-block'; // ✅ ปลอดภัยแล้ว
      closeCameraBtn.style.display = 'inline-block';

    } catch (err) {
      // แก้ไข catch ให้รองรับ error ใหม่ด้วย
      console.error("Error opening camera or loading metadata: ", err);
      showMessageModal('error', `ไม่สามารถเปิดกล้องได้: ${err.message}`);
      handleCloseCamera(); // สั่งปิดกล้องไปเลยถ้ามีปัญหา
    }
  }

  function handleCloseCamera() {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    videoStream = null;
    cameraContainer.style.display = 'none';
    openCameraBtn.style.display = 'inline-block';
    capturePhotoBtn.style.display = 'none';
    closeCameraBtn.style.display = 'none';
  }
  
  // 📸 [แก้ไข] เก็บข้อมูลรูปภาพ Base64
  async function handleCapturePhoto() {
    
    // 1. ✨ [เพิ่ม] เปลี่ยนฟังก์ชันเป็น async และเพิ่ม try...catch
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoPreview.videoWidth;
      canvas.height = videoPreview.videoHeight;
      const ctx = canvas.getContext('2d');

      // 2. ✨ [แก้ไข] ใช้ createImageBitmap() เพื่อดึงเฟรมภาพ
      //    นี่คือส่วนสำคัญที่ช่วยแก้ปัญหาจอดำบน Android
      const imageBitmap = await createImageBitmap(videoPreview);

      // --- 💡 ส่วนที่พลิกกระจก (เหมือนเดิม) ---
      // 3. สั่งให้ Canvas พลิกด้านแนวนอน (สะท้อนกระจก)
      ctx.translate(canvas.width, 0); 
      ctx.scale(-1, 1);               
      
      // 4. ✨ [แก้ไข] วาดจาก imageBitmap (แทน videoPreview)
      ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
      
      // 5. ✨ [เพิ่ม] เคลียร์ imageBitmap ออกจากหน่วยความจำ
      imageBitmap.close();
      
      // --- 💡 จบส่วนที่เพิ่ม/แก้ไข ---

      // 📸 แปลงรูปเป็น Base64 (เหมือนเดิม)
      photoDataUrl = canvas.toDataURL('image/jpeg', 0.8); 
      capturedPhoto.src = photoDataUrl;
      
      capturedPhotoContainer.style.display = 'block';
      handleCloseCamera(); 
      
      photoVerified = true;
      photoText.textContent = "ถ่ายภาพสำเร็จ";
      photoIcon.textContent = "✅";
      photoIndicator.className = "status-indicator success";
      
      checkVerifications(); 

    } catch (err) {
      // 6. ✨ [เพิ่ม] จัดการ Error ที่อาจเกิดจาก createImageBitmap
      console.error("Error capturing photo with ImageBitmap:", err);
      showMessageModal('error', 'เกิดข้อผิดพลาดในการถ่ายภาพ: ' + err.message);
    }
  }

  function handleRetakePhoto() {
    capturedPhotoContainer.style.display = 'none';
    capturedPhoto.src = '';
    photoDataUrl = ''; // 📸 ล้างข้อมูลรูปภาพ
    photoVerified = false;
    
    photoText.textContent = "ยังไม่ได้ถ่ายภาพยืนยัน";
    photoIcon.textContent = "📷";
    photoIndicator.className = "status-indicator";
    
    handleOpenCamera(); 
    checkVerifications(); 
  }
  
  function resetVerifications() {
    locationVerified = false;
    photoVerified = false;
    photoDataUrl = ''; // 📸 ล้างข้อมูลรูปภาพ
    
    locationText.textContent = "ยังไม่ได้ตรวจสอบตำแหน่ง";
    locationIcon.textContent = "📍";
    locationIndicator.className = "status-indicator";
    verifyLocationBtn.disabled = false;
    locationDetails.style.display = 'none';
    
    photoText.textContent = "ยังไม่ได้ถ่ายภาพยืนัน";
    photoIcon.textContent = "📷";
    photoIndicator.className = "status-indicator";
    
    capturedPhotoContainer.style.display = 'none';
    capturedPhoto.src = '';
    handleCloseCamera();
    
    checkVerifications(); 
    // เคลียร์สถานะ Offsite
    offsiteAllowed = false;
    offsiteControls.style.display = 'none';
    offsiteToggle.checked = false;
    offsiteNoteWrap.style.display = 'none';
    offsiteNote.value = '';

    

  }

  function checkVerifications() {
  const employeeDataFilled =
    !!employeeIdInput.value && !!firstNameInput.value &&
    !!lastNameInput.value && !!departmentInput.value;

  const baseVerified = photoVerified && locationVerified;

  // เงื่อนไขตำแหน่ง:
  // - ถ้าอยู่ในรัศมีออฟฟิศ -> ผ่านได้เลย
  // - ถ้าอยู่นอก -> ต้องติ๊ก offsite และมีเหตุผล
  let locationPass = false;
  if (lastLocation?.insideRadius) {
    locationPass = true;
  } else {
    locationPass = offsiteAllowed ? (offsiteToggle.checked && (offsiteNote.value || '').trim().length > 0) : false;
  }

  const verificationsPassed = baseVerified && locationPass;

  const empId = employeeIdInput.value;
  const todayRecord = getTodayAttendance(empId);

  if (employeeDataFilled && verificationsPassed && !todayRecord) {
    checkInBtn.disabled = false;
    checkInBtn.style.display = 'inline-block';
  } else {
    checkInBtn.disabled = true;
    checkInBtn.style.display = 'none';
  }

  if (employeeDataFilled && verificationsPassed && todayRecord && !todayRecord.checkOut) {
    checkOutBtn.disabled = false;
    checkOutBtn.style.display = 'inline-block';
  } else {
    checkOutBtn.disabled = true;
    checkOutBtn.style.display = 'none';
  }
}


 
function renderAttendanceTable(data = allAttendance) {
  const tableBody = document.querySelector("#attendanceTable tbody");
  tableBody.innerHTML = '';

  data.forEach(record => {
    const tr = document.createElement('tr');

    const displayDate = record.date
      ? new Date(normalizeDateStr(record.date)).toLocaleDateString('th-TH')
      : '-';

    // --- ✨ [แก้ไข] 1. เซลล์รูปถ่าย (แยกกัน) ---
    const photoCell_In = record.photoUrl
      ? `<a href="${record.photoUrl}" target="_blank" style="color:#2563eb;">รูป(เข้า)</a>`
      : '-';
    const photoCell_Out = record.checkOut_photoUrl
      ? `<a href="${record.checkOut_photoUrl}" target="_blank" style="color:#c82333;">รูป(ออก)</a>`
      : '-';

    // --- ✨ [แก้ไข] 2. เซลล์ตำแหน่ง (แยกกัน) ---
    const lat_in  = record.locationLat ?? record.lat ?? null;
    const lon_in  = record.locationLon ?? record.lon ?? null;
    const lat_out = record.checkOut_lat ?? null;
    const lon_out = record.checkOut_lon ?? null;
    // (💡 อัปเดตลิงก์ Google Maps ให้ใช้งานได้จริง)
    const locationCell_In = (lat_in && lon_in)
      ? `<a href="https://www.google.com/maps?q=${lat_in},${lon_in}" target="_blank" style="color:#2563eb;">พิกัด(เข้า)</a>`
      : '-';
      
    const locationCell_Out = (lat_out && lon_out)
      ? `<a href="https://www.google.com/maps?q=${lat_out},${lon_out}" target="_blank" style="color:#c82333;">พิกัด(ออก)</a>`
      : '-';
      
    // --- (ส่วนที่เหลือเหมือนเดิม) ---
    const isOnsite = (record.hasOwnProperty('onsite'))
      ? (record.onsite !== false)
      : (record.type ? record.type === 'ในออฟฟิศ' : true);
    const offsiteNote = record.offsiteNote || record.reason || '';
    const reasonCell = (!isOnsite && offsiteNote) ? offsiteNote : '-';

    // --- ⬇️ [แก้ไข] ตรรกะการกำหนดคลาสสีสำหรับสถานะ ---
    const getStatusClass = (rec) => {
      if (!isOnsite) return 'offsite'; // นอกสถานที่ (เทา)
      switch (rec.status) {
        case 'สาย':
        case 'ลืม Check-Out': // ❗️ ทำให้ "ลืม Check-Out" เป็นสีแดง
          return 'late'; // แดง
        case 'ลาหยุดงาน': 
          return 'absent'; // เหลือง/ส้ม
        case 'ตรงเวลา': 
        default:
          return 'on-time'; // เขียว
      }
    };
    const statusBadgeClass = getStatusClass(record);
    // --- ⬆️ [จบส่วนแก้ไข] ---

    // --- ✨ [เพิ่มส่วนนี้] ดึงข้อมูล ประเภท/เหตุผล (ออก) ---
    const isOnsite_Out = (record.hasOwnProperty('checkOut_onsite'))
      ? (record.checkOut_onsite !== false)
      : (record.checkOut_type ? record.checkOut_type === 'ในออฟฟิศ' : true);
    
    const offsiteNote_Out = record.checkOut_offsiteNote || record.checkOut_reason || '';
    
    const typeCell_Out = (record.checkOut) // แสดงผลเฉพาะเมื่อมีการ check-out แล้ว
      ? (isOnsite_Out ? 'ในออฟฟิศ' : 'นอกสถานที่')
      : '-';
      
    const reasonCell_Out = (record.checkOut && !isOnsite_Out && offsiteNote_Out) 
      ? offsiteNote_Out 
      : '-';
    // --- ✨ [จบส่วนที่เพิ่ม] ---

    // --- ✨ [แก้ไข] 3. สร้าง tr.innerHTML ให้ตรงกับ 18 คอลัมน์ใหม่ ---
   tr.innerHTML = `
      <td>${record.empId || '-'}</td>
      <td>${record.name || '-'}</td>
      <td>${record.department || '-'}</td>
      <td>${record.position || '-'}</td>
      <td>${displayDate}</td>
      <td>${record.checkIn || '-'}</td>
      <td>${record.checkOut || '-'}</td>
      <td>${decimalHoursToHHMM(record.workHours) ?? '-'}</td> 
      <td>${decimalHoursToHHMM(record.otHours) ?? '-'}</td>   
      <td>${record.totalHours_HHMM ?? decimalHoursToHHMM(record.totalHours) ?? '-'}</td> 
      <td><span class="status-badge ${statusBadgeClass}">${record.status || '-'}</span></td>
      <td>${isOnsite ? 'ในออฟฟิศ' : 'นอกสถานที่'}</td>
      <td>${reasonCell}</td>   
      
      <td>${locationCell_In}</td>
      <td>${photoCell_In}</td>
      <td>${locationCell_Out}</td>
      <td>${photoCell_Out}</td>
      <td>${typeCell_Out}</td>   
      <td>${reasonCell_Out}</td>
       <td class="action-buttons">
        <button class="edit-btn" data-key="${record.empId}|${record.date}">แก้ไข</button>
        <button class="delete-btn" data-key="${record.empId}|${record.date}">ลบ</button>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}



  
 function applyFilters() {
  // ✨ [แก้ไข] รีเซ็ตการกรองสถิติเมื่อใช้ตัวกรองหลัก
  currentStatFilter = 'all';
  [statCardTotal, statCardOnTime, statCardLate, statCardAbsent].forEach(card => {
    card.classList.remove('active-stat');
  });
  if(statCardTotal) statCardTotal.classList.add('active-stat'); // ให้ "ทั้งหมด" เป็น active

  const start = filterDateStart.value; 
  const end   = filterDateEnd.value;
  const status = filterStatus.value;

  let departments = [];
  if (slimSelect && typeof slimSelect.getSelected === 'function') {
    departments = slimSelect.getSelected();
  } else {
    departments = Array.from(filterDepartment.selectedOptions).map(o => o.value);
  }

  const startKey = start ? dateKey(start) : '';
  const endKey   = end   ? dateKey(end)   : '';

  let filteredData = allAttendance;

  if (startKey) {
    filteredData = filteredData.filter(r => dateKey(r.date) >= startKey);
  }
  if (endKey) {
    filteredData = filteredData.filter(r => dateKey(r.date) <= endKey);
  }
  if (departments.length > 0) {
    filteredData = filteredData.filter(r => departments.includes(r.department || ''));
  }
  if (status) {
    filteredData = filteredData.filter(r => r.status === status);
  }

  renderAttendanceTable(filteredData);
  updateTodayStats(filteredData);
}



function clearFilters() {
  // ✨ [แก้ไข] การล้างตัวกรอง = รีเซ็ตกลับไปหน้าสถิติวันนี้ (ทั้งหมด)
  setStatFilter('all');
}

function updateTodayStats(data) {
  // 1) รวมวันทั้งหมด (เหมือนเดิม)
  const allDates = Array.from(new Set(
    (data || []).map(r => normalizeDateStr(r.date)).filter(Boolean)
  )).sort(); 

  if (allDates.length === 0) {
    // เคลียร์แดชบอร์ดกรณีไม่มีข้อมูลเลย (เหมือนเดิม)
    totalEmployees.textContent = 0;
    document.getElementById('totalEmployeesLabel').textContent = 'พนักงานที่ลงเวลาวันนี้';
    onTimeCount.textContent = 0;
    lateCount.textContent = 0;
    absentCount.textContent = 0;
    if (charts.todayChart) {
      charts.todayChart.data.labels = [];
      charts.todayChart.data.datasets[0].data = [];
      charts.todayChart.update();
    }
    return;
  }

  // 2) เลือก "วันที่มีอยู่ในข้อมูล" (เหมือนเดิม)
  const realToday = new Date().toLocaleDateString('en-CA'); 
  const targetDate = allDates.includes(realToday) ? realToday : allDates[allDates.length - 1];

  // 3) กรองเฉพาะแถวของ targetDate (เหมือนเดิม)
  const rows = data.filter(r => normalizeDateStr(r.date) === targetDate);

  // --- 4) ✨ [แก้ไข] นับสรุป (Part 1: ตัวเลขบนการ์ด - ใช้ 'rows' (ข้อมูลเต็ม)) ---
  const total = rows.length;
  const onTime = rows.filter(r => r.status === 'ตรงเวลา').length;
  // ❗️ นับ "สาย" และ "ลืม Check-Out" รวมกัน
  const late   = rows.filter(r => r.status === 'สาย' || r.status === 'ลืม Check-Out').length;
  const absent = rows.filter(r => r.status === 'ลาหยุดงาน').length; // (นับสถานะลา)

  totalEmployees.textContent = total;
  document.getElementById('totalEmployeesLabel').textContent = 'พนักงานที่ลงเวลาวันนี้';
  onTimeCount.textContent = onTime;
  lateCount.textContent = late;
  absentCount.textContent = absent;

  // --- 5) ✨ [แก้ไข] อัปเดตกราฟ (Part 2: ข้อมูลกราฟ - ใช้ข้อมูลที่กรองแล้ว) ---
  
  // กรอง 'rows' (ข้อมูลวันนี้) ด้วย currentStatFilter ที่เราคลิก
  const graphRows = applyStatFilter(rows); 

  if (charts.todayChart) {
    // ใช้ 'graphRows' แทน 'rows' สำหรับสร้างกราฟ
    const employeeNames = graphRows.map(r => r.name || r.empId || '-');
   const totalHours = graphRows.map(r => {
      if (r.checkOut) {
        // [FIX] เราจะใช้ค่า totalHours (ทศนิยม) สำหรับกราฟโดยตรง
        return parseFloat(r.totalHours) || 0;
      }
      // ยังไม่เช็กเอาต์ → คำนวณเวลาถึงตอนนี้
      if (r.checkIn) {
        const nowHHmm = new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',hour12:false});
        const live = calculateWorkHours(r.checkIn, nowHHmm).totalHours; // ได้เป็นทศนิยม
        return live;
      }
      return 0;
    });
    
    // ❗️ [แก้ไข] กำหนดสีแท่งกราฟ
    const barColors = graphRows.map(r => {
        if (r.status === 'สาย' || r.status === 'ลืม Check-Out') {
           return 'rgba(239, 68, 68, 0.7)'; // แดง
        }
        return 'rgba(34, 197, 94, 0.7)'; // เขียว
    });

    charts.todayChart.data.labels = employeeNames;
    charts.todayChart.data.datasets[0].data = totalHours;
    charts.todayChart.data.datasets[0].backgroundColor = barColors;

    // ปรับ title ให้โชว์วันที่ (เหมือนเดิม)
    const thDate = new Date(targetDate).toLocaleDateString('th-TH');
    charts.todayChart.options.plugins.title = {
      display: true,
      text: `ชั่วโมงการทำงานของพนักงาน (${thDate})`
    };

    charts.todayChart.update();
  } else {
    console.error('❌ Chart not initialized!');
  }
}

  function initCharts() {
    initTodayChart();
    initWeeklyChart();
    initPerformanceChart();
  }
  
  function refreshCharts() {
    Object.keys(charts).forEach(key => {
      if (charts[key] && typeof charts[key].resize === 'function') {
        charts[key].resize();
      }
    });
  }

// ⬇️ ค้นหาฟังก์ชัน initTodayChart แล้วแทนที่ด้วยโค้ดนี้ ⬇️

function initTodayChart() {
  if (!attendanceChartCtx) return;
  if (charts.todayChart) charts.todayChart.destroy(); 

  // ✨ [เพิ่ม] เช็คขนาดหน้าจอ ถ้าเล็กกว่า 768px ให้ถือว่าเป็นมือถือ
  const isMobile = window.innerWidth < 768;

  charts.todayChart = new Chart(attendanceChartCtx, {
    type: 'bar',
    data: {
      labels: [], 
      datasets: [{
        label: 'ชั่วโมงการทำงาน',
        data: [],  
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      // ✨ [แก้ไข] ถ้าเป็นมือถือ ให้ใช้แกน y (แนวนอน) ถ้าคอมใช้แกน x (แนวตั้ง)
      indexAxis: isMobile ? 'y' : 'x', 
      
      maintainAspectRatio: false, // ให้ยืดขยายตาม CSS ที่เราตั้งไว้
      responsive: true,
      
      plugins: {
        legend: { display: true },
        title: { display: true, text: 'ชั่วโมงการทำงานของพนักงาน' },
        tooltip: {
          callbacks: {
            label: function(tooltipItem) {
              const label = tooltipItem.dataset.label || 'ชั่วโมงการทำงาน';
              const decimalValue = tooltipItem.raw;
              const hhmmValue = decimalHoursToHHMM(decimalValue); 
              return `${label}: ${hhmmValue} (HH.MM)`;
            }
          }
        }
      },
      scales: {
        x: {
          // ✨ [แก้ไข] ถ้าแนวนอน (มือถือ) x คือชั่วโมง, ถ้าแนวตั้ง x คือชื่อคน
          title: { display: true, text: isMobile ? 'ชั่วโมงทำงาน' : 'พนักงาน' },
          ticks: {
            autoSkip: false, // พยายามแสดงชื่อให้ครบ
            maxRotation: isMobile ? 0 : 45, // ถ้าในคอม ให้เอียงชื่อได้
            minRotation: isMobile ? 0 : 45
          }
        },
        y: {
          beginAtZero: true,
          // ✨ [แก้ไข] สลับ title ตามแกน
          title: { display: true, text: isMobile ? 'พนักงาน' : 'ชั่วโมงทำงาน' }
        }
      }
    }
  });
  updateTodayStats(allAttendance);
}

  function initWeeklyChart() {
    if (!weeklyChartCtx) return;

    weeklyOnTime.textContent = 0;
    weeklyLate.textContent = 0;
    weeklyAbsent.textContent = 0;
    weeklyAvgHours.textContent = 0;
    
    if (charts.weeklyChart) charts.weeklyChart.destroy();
    
    charts.weeklyChart = new Chart(weeklyChartCtx, {
      type: 'bar',
      data: {
        labels: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์'],
        datasets: [{
          label: 'ชั่วโมงทำงาน',
          data: [0, 0, 0, 0, 0], 
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, title: { display: true, text: 'ชั่วโมง' } } },
        plugins: { legend: { display: false } }
      }
    });
  }
  
 
// ⬇️ ค้นหาฟังก์ชัน initPerformanceChart (บรรทัด 1094) แล้วแทนที่ด้วยโค้ดนี้ ⬇️

// ⬇️ แก้ไขเฉพาะส่วน options ใน initPerformanceChart ⬇️

function initPerformanceChart() {
  if (!employeePerformanceChartCtx) return;
  if (charts.performanceChart) charts.performanceChart.destroy();
  
  charts.performanceChart = new Chart(employeePerformanceChartCtx, {
    type: 'line', 
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false, // ✨ [สำคัญ] ต้องมีบรรทัดนี้ เพื่อให้มันสูงตาม CSS
      plugins: { 
        title: { display: true, text: 'ชั่วโมงการทำงานรวม (Total Hours)' },
        tooltip: {
          callbacks: {
            label: function(tooltipItem) {
              const label = tooltipItem.dataset.label || '';
              const decimalValue = tooltipItem.raw;
              const hhmmValue = decimalHoursToHHMM(decimalValue); 
              return `${label}: ${hhmmValue} (HH.MM)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'รวมชั่วโมง (totalHours)' }
        },
        x: {
           ticks: {
             maxRotation: 45, // เอียงวันที่นิดนึงกันทับกัน
             minRotation: 45
           }
        }
      }
    }
  });
}


// ⬇️ ค้นหาฟังก์ชัน updatePerformanceChart (ประมาณบรรทัด 1111) แล้วแทนที่ด้วยโค้ดนี้ ⬇️

// ⬇️ ค้นหาฟังก์ชัน updatePerformanceChart (ประมาณบรรทัด 1113) แล้วแทนที่ด้วยโค้ดนี้ ⬇️

function updatePerformanceChart() {
  const selectedIds = performanceSlimSelect.getSelected();
  const periodType = chartPeriodType.value; // อ่านค่าจาก Dropdown หลัก

  let startDate = ''; // "YYYY-MM-DD"
  let endDate = '';   // "YYYY-MM-DD"
  const now = new Date();

  // --- 1. กำหนดวันเริ่มต้นและสิ้นสุด (ตามตัวเลือก) ---
  if (periodType === 'custom') {
    startDate = chartDateStart.value;
    endDate = chartDateEnd.value;

  } else if (periodType === 'month') {
    const y = now.getFullYear();
    const m = now.getMonth();
    const startOfMonth = new Date(y, m, 1);
    const endOfMonth = new Date(y, m + 1, 0); // วันที่ 0 ของเดือนถัดไป = วันสุดท้ายของเดือนนี้

    startDate = startOfMonth.toLocaleDateString('en-CA');
    endDate = endOfMonth.toLocaleDateString('en-CA');

  } else if (periodType === 'year') {
    const y = now.getFullYear();
    const startOfYear = new Date(y, 0, 1);  // 1 ม.ค.
    const endOfYear = new Date(y, 11, 31); // 31 ธ.ค.

    startDate = startOfYear.toLocaleDateString('en-CA');
    endDate = endOfYear.toLocaleDateString('en-CA');
  }

  // --- 2. Validation ---
  if (selectedIds.length === 0) {
    showMessageModal('info', 'กรุณาเลือกพนักงานอย่างน้อย 1 คน');
    return;
  }
  if (!startDate || !endDate) {
    showMessageModal('info', 'กรุณาเลือกช่วงวันที่ให้ถูกต้อง');
    return;
  }
  const dStart = new Date(startDate);
  const dEnd = new Date(endDate);

  if (dStart > dEnd) {
    showMessageModal('error', 'วันเริ่มต้นต้องมาก่อนวันสิ้นสุด');
    return;
  }

  // แปลง dStart/dEnd กลับไปเป็น Date object ที่เที่ยงคืน
  const loopStart = new Date(dStart.getUTCFullYear(), dStart.getUTCMonth(), dStart.getUTCDate());
  const loopEnd = new Date(dEnd.getUTCFullYear(), dEnd.getUTCMonth(), dEnd.getUTCDate());

  // --- 3. สร้างแกน X (Labels) ---
  const chartLabels = []; // สำหรับแสดงผล
  const dateStrings = []; // สำหรับกรอง

  // ถ้าเป็น "ปีนี้" (periodType === 'year') เราจะกำหนดแกน X เป็นรายเดือน
  if (periodType === 'year') {
    chartLabels.push('ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.');
  } else {
    // ถ้าเป็น "เดือนนี้" หรือ "กำหนดเอง" ให้แสดงแกน X เป็นรายวัน
    let currentDate = new Date(loopStart);
    while (currentDate <= loopEnd) {
      dateStrings.push(currentDate.toLocaleDateString('en-CA')); // "YYYY-MM-DD"
      chartLabels.push(currentDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // จำกัดข้อมูล (กรณี "กำหนดเอง" ยาวไป)
  if (periodType === 'custom' && dateStrings.length > 90) { 
     showMessageModal('error', 'ช่วงวันที่ยาวเกินไป (สูงสุด 90 วัน)');
     return;
  }

  const chartDatasets = [];

  // --- 4. สร้างแกน Y (Datasets) ---
  selectedIds.forEach((id, index) => {
    const emp = allEmployees.find(e => e.empId === id);

    const empAttendance = allAttendance.filter(r => 
      r.empId === id &&
      r.date >= startDate &&
      r.date <= endDate
    );

    const empData = []; 

    // ถ้าเป็น "ปีนี้" (periodType === 'year') เราจะ "รวมยอดแต่ละเดือน"
    if (periodType === 'year') {
      const monthlyTotals = new Array(12).fill(0);

      empAttendance.forEach(rec => {
        const monthIndex = new Date(rec.date).getMonth(); // 0 = Jan, 1 = Feb
        monthlyTotals[monthIndex] += (parseFloat(rec.totalHours) || 0);
      });
      empData.push(...monthlyTotals);

    } else {
      // ถ้าเป็น "เดือนนี้" หรือ "กำหนดเอง" ให้แสดงข้อมูลรายวัน
      dateStrings.forEach(dateStr => {
        const recordsForDay = empAttendance.filter(r => r.date === dateStr);
        const totalHoursForDay = recordsForDay.reduce((sum, rec) => {
          // 💡 [FIX] ใช้ค่า totalHours (ทศนิยม) ที่มีอยู่แล้วโดยตรง
          // ไม่ต้องแปลงไปมา เพราะกราฟแกน Y ก็คือ totalHours
          return sum + (parseFloat(rec.totalHours) || 0);
        }, 0);
        empData.push(totalHoursForDay);
      });
    }

    chartDatasets.push({
      label: emp.name, // ✅ [แก้ไข] ใช้ emp.name
      data: empData,
      borderColor: generateChartColor(index),
      backgroundColor: generateChartColor(index).replace('0.8', '0.2'),
      fill: true,
      tension: 0.1
    });
  });

  // --- 5. อัปเดตกราฟ ---
  charts.performanceChart.data.labels = chartLabels;
  charts.performanceChart.data.datasets = chartDatasets;
  charts.performanceChart.update();
}

  function openModal(modal) {
    modal.style.display = 'block';
  }

  function closeModal(modal) {
    modal.style.display = 'none';
  }
  
  function showMessageModal(type, message) {
    messageModalBody.textContent = message;
    messageModalBody.className = `message-body ${type}`; 
    openModal(messageModal);
  }
  
  function showConfirmModal(message, onConfirm) {
    confirmMessage.textContent = message;
    
    const newConfirmBtn = confirmDeleteBtn.cloneNode(true);
    confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn);
    
    newConfirmBtn.addEventListener('click', onConfirm);
    
    openModal(confirmModal);
  }

  function showSummaryModal(record) {
    const employeeName = record.name;
    const employeeDept = record.department;
    
    let displayDate = record.date;
    try {
      displayDate = new Date(record.date).toLocaleDateString('th-TH')
    } catch(e) {}

    document.getElementById('summaryEmployeeName').textContent = employeeName;
    document.getElementById('summaryDepartment').textContent = employeeDept;
    document.getElementById('summaryDate').textContent = displayDate;
    document.getElementById('summaryCheckIn').textContent = record.checkIn;
    document.getElementById('summaryCheckOut').textContent = record.checkOut || '-';
    
    document.getElementById('summaryWorkHours').textContent = decimalHoursToHHMM(record.workHours);
    document.getElementById('summaryOvertimeHours').textContent = decimalHoursToHHMM(record.otHours);
    document.getElementById('summaryTotalHours').textContent = decimalHoursToHHMM(record.totalHours);
    document.getElementById('summaryStatus').textContent = record.status;
    
    if (record.checkOut) {
      document.getElementById('summaryMessage').textContent = "ขอบคุณสำหรับการทำงานหนักวันนี้! 🎉";
    } else {
      document.getElementById('summaryMessage').textContent = "ขอให้เป็นวันที่ดีในการทำงาน! 👍";
    }

    openModal(workSummaryModal);
  }


 function decimalHoursToHHMM(decimalHours) {
    const totalMins = Math.round((decimalHours || 0) * 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}.${m.toString().padStart(2, '0')}`;
  } 
  
  // ✨ [เพิ่มฟังก์ชันใหม่นี้]
/**
 * สุ่มสีสำหรับกราฟ
 */
function generateChartColor(index) {
  const colors = [
    'rgba(54, 162, 235, 0.8)', // Blue
    'rgba(255, 99, 132, 0.8)', // Red
    'rgba(75, 192, 192, 0.8)', // Green
    'rgba(255, 206, 86, 0.8)', // Yellow
    'rgba(153, 102, 255, 0.8)', // Purple
  ];
  return colors[index % colors.length];
}

/**
 * 💡 [เพิ่มใหม่] แปลง "HH.MM" (เช่น '0.03') กลับเป็นทศนิยม (เช่น 0.05)
 */
function HHMMToDecimal(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return 0;
  
  const parts = hhmm.split('.');
  const h = parseFloat(parts[0] || 0);
  const m = parseFloat(parts[1] || 0);
  
  // 3 นาที / 60 = 0.05
  return h + (m / 60); 
}

// ✨ [เพิ่มฟังก์ชันใหม่] จัดการการเปลี่ยนรหัสผ่าน
  async function handleSaveSettings(e) {
    e.preventDefault();
    
    const oldPass = document.getElementById('oldPassword').value.trim();
    const newName = document.getElementById('newName').value.trim();
    const newUser = document.getElementById('newUsername').value.trim();
    const newPass = document.getElementById('newPassword').value.trim();
    const confirmPass = document.getElementById('confirmNewPassword').value.trim();
    
    // Validation
    if (newPass !== confirmPass) {
        settingsError.textContent = "รหัสผ่านใหม่ไม่ตรงกัน";
        settingsError.style.display = 'block';
        return;
    }
    if (newPass.length < 4) { 
        settingsError.textContent = "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร";
        settingsError.style.display = 'block';
        return;
    }

    // UI Loading
    saveSettingsBtn.disabled = true;
    saveSettingsBtn.innerHTML = '<span>⏳</span> <span>กำลังบันทึก...</span>';
    settingsError.style.display = 'none';

    try {
        const response = await sendDataToSheet({
            action: 'changeCredentials',
            currentUsername: currentLoggedInUsername, // ส่งชื่อคนปัจจุบันไปเช็ค
            oldPassword: oldPass,
            newName: newName, // ✨ [เพิ่ม] ส่งชื่อใหม่ไปด้วย
            newUsername: newUser,
            newPassword: newPass
        });

        if (response.status === 'success') {
            // สำเร็จ -> บังคับ Logout
            alert(response.message); // แจ้งเตือนแบบ Alert
            closeModal(settingsModal);
            handleLogout(); // เด้งออกเพื่อให้ Login ใหม่
        } else {
            throw new Error(response.message);
        }

    } catch (error) {
        settingsError.textContent = error.message;
        settingsError.style.display = 'block';
    } finally {
        saveSettingsBtn.disabled = false;
        saveSettingsBtn.innerHTML = '<span>💾</span> <span>บันทึกการเปลี่ยนแปลง</span>';
    }
  }
  init();

});