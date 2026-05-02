const translations = {
    en: {
        tagline: "Book your table.. and enjoy the finest moments",
        title: "✨ Table Reservation",
        name: "Full Name",
        phone: "Phone Number",
        branch: "Select Branch",
        people: "Number of Guests",
        date: "Date",
        time: "Time",
        notes: "Additional Notes",
        submit: "Book Now",
        hours: "Working Hours: 9 AM - 9 PM",
        success: "✨ Your table has been booked successfully! ✨",
        error_time: "⚠️ Sorry, this time slot is already booked. Please choose another time.",
        error_fields: "❌ Please fill in all required fields"
    },
    ar: {
        tagline: "احجز طاولتك .. واستمتع بأجمل الأوقات",
        title: "✨ حجز طاولة",
        name: "الاسم الكامل",
        phone: "رقم الهاتف",
        branch: "اختر الفرع",
        people: "عدد الأشخاص",
        date: "التاريخ",
        time: "الوقت",
        notes: "ملاحظات إضافية",
        submit: "احجز الآن",
        hours: "ساعات العمل: 9 صباحاً - 9 مساءً",
        success: "✨ تم حجز طاولتك بنجاح! ✨",
        error_time: "⚠️ عذراً، هذا الوقت محجوز مسبقاً. الرجاء اختيار وقت آخر.",
        error_fields: "❌ الرجاء تعبئة جميع الحقول المطلوبة"
    }
};

let currentLang = 'en';

function setLanguage(lang) {
    currentLang = lang;
    
    if (lang === 'ar') {
        document.body.dir = 'rtl';
        document.documentElement.lang = 'ar';
    } else {
        document.body.dir = 'ltr';
        document.documentElement.lang = 'en';
    }
    
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        if (translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((lang === 'en' && btn.textContent.includes('English')) ||
            (lang === 'ar' && btn.textContent.includes('العربية'))) {
            btn.classList.add('active');
        }
    });
}

function setMinDate() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setMinDate();
    setLanguage('en');
});