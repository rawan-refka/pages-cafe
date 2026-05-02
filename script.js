// ============================================
// 🔴🔴🔴 غيّر هذا الإيميل إلى إيميل مدير الكافيه 🔴🔴🔴
// ============================================
const OWNER_EMAIL = 'rowanrefka@gmail.com';
// ============================================

const STORAGE_KEY = 'cafe_reservations';

// تهيئة التخزين إذا كان فارغاً
function initStorage() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        console.log('✅ تم تهيئة التخزين');
    }
}

// تحميل الحجوزات
function getReservations() {
    initStorage();
    const reservations = localStorage.getItem(STORAGE_KEY);
    return reservations ? JSON.parse(reservations) : [];
}

// حفظ الحجوزات
function saveReservations(reservations) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
    console.log('✅ تم حفظ الحجوزات، العدد:', reservations.length);
    // تحديث لوحة التحكم إذا كانت مفتوحة
    if (typeof loadReservationsForDashboard === 'function') {
        try {
            loadReservationsForDashboard();
        } catch(e) {}
    }
}

// التحقق من توفر الوقت
function isTimeAvailable(branch, date, time, currentId = null) {
    const reservations = getReservations();
    return !reservations.some(res => 
        res.id !== currentId &&
        res.branch === branch && 
        res.date === date && 
        res.time === time
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
        form.addEventListener('submit', (e) => {
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
            
            if (!isTimeAvailable(branch, date, time)) {
                showMessage(translations[currentLang]?.error_time || '⚠️ Time already booked', 'error');
                return;
            }
            
            const reservation = {
                id: Date.now(),
                customerName,
                customerPhone,
                branch,
                peopleCount,
                date,
                time,
                notes,
                status: 'confirmed',
                createdAt: new Date().toISOString()
            };
            
            // حفظ الحجز
            const reservations = getReservations();
            reservations.push(reservation);
            saveReservations(reservations);
            
            // إرسال إيميل (اختياري)
            sendEmailToOwner(reservation);
            
            // عرض رسالة نجاح
            showMessage(`✅ Your table has been booked successfully at ${branch} at ${time} on ${date}`, 'success');
            
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

// ========== دوال لوحة التحكم ==========
function loadReservationsForDashboard() {
    const reservations = getReservations();
    const container = document.getElementById('reservationsList');
    if (!container) return;
    
    if (reservations.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#d4af37;">✨ No reservations yet</p>';
        return;
    }
    
    reservations.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
    });
    
    let html = '';
    reservations.forEach(res => {
        html += `
            <div class="reservation-card">
                <button class="btn-delete" onclick="deleteReservation(${res.id})">🗑️ Delete</button>
                <h3>👑 ${res.customerName}</h3>
                <p>📞 ${res.customerPhone}</p>
                <p>🏢 ${res.branch}</p>
                <p>👥 ${res.peopleCount} people</p>
                <p>📅 ${res.date} | ⏰ ${res.time}</p>
                <p>📝 ${res.notes || 'No notes'}</p>
                <p>🆔 ${res.id}</p>
                <small>⏱️ ${new Date(res.createdAt).toLocaleString()}</small>
            </div>
        `;
    });
    container.innerHTML = html;
    console.log('✅ تم تحديث لوحة التحكم، عدد الحجوزات:', reservations.length);
}

function deleteReservation(id) {
    if (confirm('Are you sure?')) {
        let reservations = getReservations();
        reservations = reservations.filter(res => res.id !== id);
        saveReservations(reservations);
        loadReservationsForDashboard();
        console.log('✅ تم حذف الحجز:', id);
    }
}

function deleteAllReservations() {
    if (confirm('⚠️ Delete ALL reservations? This cannot be undone!')) {
        saveReservations([]);
        loadReservationsForDashboard();
        console.log('✅ تم حذف جميع الحجوزات');
    }
}

function exportToExcel() {
    const reservations = getReservations();
    if (reservations.length === 0) {
        alert('No reservations to export');
        return;
    }
    
    let csv = 'Name,Phone,Branch,People,Date,Time,Notes,ID\n';
    reservations.forEach(res => {
        csv += `"${res.customerName}","${res.customerPhone}","${res.branch}",${res.peopleCount},"${res.date}","${res.time}","${res.notes || ''}",${res.id}\n`;
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

// فحص التخزين عند التحميل
initStorage();
console.log('📦 التخزين جاهز، الحجوزات الحالية:', getReservations().length);