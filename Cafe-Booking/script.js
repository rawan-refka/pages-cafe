// ============================================
// 🔴🔴🔴 غيّر هذا الإيميل إلى إيميل مدير الكافيه 🔴🔴🔴
// ============================================
const OWNER_EMAIL = 'rowanrefka@gmail.com';
// ============================================

// ========== Google Sheets API ==========
// هذا هو رابط Google Apps Script تبعك
const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbwVDFTp8UobayO4NCMXcpQPHZueoujdT9GBOHcXbMrS79i9Me-1mCBJmOoucyy1u_zFXQ/exec';

// جلب الحجوزات من Google Sheet
async function fetchReservationsFromSheet() {
    try {
        const response = await fetch(SHEET_API_URL);
        const data = await response.json();
        console.log('✅ تم جلب الحجوزات من Google Sheet:', data.length);
        return data;
    } catch (error) {
        console.error('❌ فشل جلب الحجوزات من Google Sheet:', error);
        return [];
    }
}

// إضافة حجز إلى Google Sheet
async function addReservationToSheet(reservation) {
    try {
        const response = await fetch(SHEET_API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservation)
        });
        console.log('✅ تم إرسال الحجز إلى Google Sheet');
        return true;
    } catch (error) {
        console.error('❌ فشل إضافة الحجز إلى Google Sheet:', error);
        return false;
    }
}

// ========== دوال تنسيق التاريخ والوقت ==========
function formatDate(dateValue) {
    if (!dateValue) return 'No date';
    try {
        if (typeof dateValue === 'string' && dateValue.includes('T')) {
            const d = new Date(dateValue);
            return d.toISOString().split('T')[0];
        }
        if (typeof dateValue === 'number') {
            const date = new Date((dateValue - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }
        return dateValue.split('T')[0];
    } catch(e) {
        return dateValue;
    }
}

function formatTime(timeValue) {
    if (!timeValue) return 'No time';
    try {
        if (typeof timeValue === 'string' && timeValue.includes('T')) {
            const d = new Date(timeValue);
            return d.toTimeString().slice(0, 5);
        }
        if (typeof timeValue === 'string' && timeValue.includes(':')) {
            return timeValue.slice(0, 5);
        }
        return timeValue;
    } catch(e) {
        return timeValue;
    }
}

// ========== التخزين المحلي (احتياطي) ==========
const STORAGE_KEY = 'cafe_reservations';

function initStorage() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        console.log('✅ تم تهيئة التخزين المحلي');
    }
}

function getLocalReservations() {
    initStorage();
    const reservations = localStorage.getItem(STORAGE_KEY);
    return reservations ? JSON.parse(reservations) : [];
}

function saveLocalReservations(reservations) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
    console.log('✅ تم حفظ الحجوزات محلياً، العدد:', reservations.length);
}

// التحقق من توفر الوقت (من Google Sheet)
async function isTimeAvailable(branch, date, time, currentId = null) {
    const reservations = await fetchReservationsFromSheet();
    return !reservations.some(res => 
        res.id !== currentId &&
        res.Branch === branch && 
        res.Date === date && 
        res.Time === time
    );
}

// إرسال إيميل للمدير (اختياري)
function sendEmailToOwner(reservation) {
    const form = document.getElementById('hiddenEmailForm');
    if (!form) {
        console.log('⚠️ نموذج الإيميل غير موجود');
        return;
    }
    
    document.getElementById('hiddenName').value = reservation.customerName;
    document.getElementById('hiddenPhone').value = reservation.customerPhone;
    document.getElementById('hiddenBranch').value = reservation.branch;
    document.getElementById('hiddenPeople').value = reservation.peopleCount;
    document.getElementById('hiddenDate').value = reservation.date;
    document.getElementById('hiddenTime').value = reservation.time;
    document.getElementById('hiddenNotes').value = reservation.notes || 'No notes';
    document.getElementById('hiddenId').value = reservation.id;
    
    form.action = `https://formsubmit.co/${OWNER_EMAIL}`;
    
    fetch(form.action, {
        method: 'POST',
        body: new FormData(form)
    }).then(response => {
        if (response.ok) {
            console.log('✅ تم إرسال الإيميل بنجاح');
        }
    }).catch(err => console.log('❌ خطأ في الإيميل:', err));
}

// معالجة الحجز
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reservationForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const customerName = document.getElementById('customerName').value.trim();
            const customerPhone = document.getElementById('customerPhone').value.trim();
            const branch = document.getElementById('branch').value;
            const peopleCount = parseInt(document.getElementById('peopleCount').value);
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            const notes = document.getElementById('notes').value;
            
            if (!customerName || !customerPhone || !date) {
                showMessage(translations[currentLang]?.error_fields || '❌ Please fill all fields', 'error');
                return;
            }
            
            // التحقق من توفر الوقت
            const available = await isTimeAvailable(branch, date, time);
            if (!available) {
                showMessage(translations[currentLang]?.error_time || '⚠️ Time already booked', 'error');
                return;
            }
            
            const reservation = {
                id: Date.now(),
                customerName: customerName,
                customerPhone: customerPhone,
                branch: branch,
                peopleCount: peopleCount,
                date: date,
                time: time,
                notes: notes,
                createdAt: new Date().toISOString()
            };
            
            // إرسال الحجز إلى Google Sheet
            const sheetSuccess = await addReservationToSheet(reservation);
            
            // حفظ احتياطي محلياً
            const localReservations = getLocalReservations();
            localReservations.push(reservation);
            saveLocalReservations(localReservations);
            
            // إرسال إيميل (اختياري)
            sendEmailToOwner(reservation);
            
            // عرض رسالة نجاح
            if (sheetSuccess) {
                showMessage(`✅ Your table has been booked successfully at ${branch} at ${time} on ${date}`, 'success');
            } else {
                showMessage(`✅ Booking saved locally! (Internet issue)`, 'success');
            }
            
            // مسح الحقول
            document.getElementById('customerName').value = '';
            document.getElementById('customerPhone').value = '';
            document.getElementById('notes').value = '';
            document.getElementById('peopleCount').value = 2;
            setMinDate();
        });
    }
});

function showMessage(msg, type) {
    const msgDiv = document.getElementById('message');
    if (!msgDiv) return;
    msgDiv.textContent = msg;
    msgDiv.className = type;
    msgDiv.style.display = 'block';
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 5000);
}

// ========== دوال لوحة التحكم (تجلب من Google Sheet) ==========
async function loadReservationsForDashboard() {
    const reservations = await fetchReservationsFromSheet();
    const container = document.getElementById('reservationsList');
    if (!container) return;
    
    if (!reservations || reservations.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#d4af37;">✨ No reservations yet</p>';
        return;
    }
    
    reservations.sort((a, b) => {
        const dateA = a.Date || a.date;
        const dateB = b.Date || b.date;
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        const timeA = a.Time || a.time;
        const timeB = b.Time || b.time;
        return timeA.localeCompare(timeB);
    });
    
    let html = '';
    reservations.forEach(res => {
        html += `
            <div class="reservation-card">
                <h3>👑 ${res.Name || res.customerName}</h3>
                <p>📞 ${res.Phone || res.customerPhone}</p>
                <p>🏢 ${res.Branch || res.branch}</p>
                <p>👥 ${res.People || res.peopleCount} people</p>
                <p>📅 ${formatDate(res.Date || res.date)} | ⏰ ${formatTime(res.Time || res.time)}</p>
                <p>📝 ${res.Notes || res.notes || 'No notes'}</p>
                <p>🆔 ${res.ID || res.id}</p>
                <small>⏱️ ${new Date(res['Created At'] || res.createdAt).toLocaleString()}</small>
            </div>
        `;
    });
    container.innerHTML = html;
    console.log('✅ تم تحديث لوحة التحكم، عدد الحجوزات:', reservations.length);
}

// تحديث الإحصائيات
async function updateStats() {
    const reservations = await fetchReservationsFromSheet();
    const today = new Date().toISOString().split('T')[0];
    const todayReservations = reservations.filter(r => (r.Date || r.date) === today);
    
    const totalEl = document.getElementById('totalCount');
    const todayEl = document.getElementById('todayCount');
    if (totalEl) totalEl.innerText = reservations.length;
    if (todayEl) todayEl.innerText = todayReservations.length;
}

// تصدير إلى Excel من Google Sheet
async function exportToExcel() {
    const reservations = await fetchReservationsFromSheet();
    if (reservations.length === 0) {
        alert('No reservations to export');
        return;
    }
    
    let csv = 'Name,Phone,Branch,People,Date,Time,Notes,ID\n';
    reservations.forEach(res => {
        csv += `"${res.Name || res.customerName}","${res.Phone || res.customerPhone}","${res.Branch || res.branch}",${res.People || res.peopleCount},"${res.Date || res.date}","${res.Time || res.time}","${res.Notes || res.notes || ''}",${res.ID || res.id}\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `reservations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// حذف الحجوزات (ملاحظة: حذف من Google Sheet يتطلب إعداد إضافي)
function deleteReservation(id) {
    alert('⚠️ Delete feature requires additional setup. Please delete from Google Sheet manually.');
}

function deleteAllReservations() {
    alert('⚠️ Delete all requires additional setup. Please delete from Google Sheet manually.');
}

// تعبئة أوقات العمل
function populateTimes() {
    const timeSelect = document.getElementById('time');
    if (!timeSelect) return;
    
    timeSelect.innerHTML = '';
    for (let hour = 9; hour <= 21; hour++) {
        for (let minute of [0, 30]) {
            if (hour === 21 && minute > 0) continue;
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = timeString;
            timeSelect.appendChild(option);
        }
    }
}

function setMinDate() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }
}

// تشغيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    populateTimes();
    setMinDate();
    if (typeof setLanguage === 'function') {
        setLanguage('en');
    }
});

console.log('✅ System ready with Google Sheets integration!');