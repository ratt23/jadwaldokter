// ==========================================
// 1. VARIABEL GLOBAL & KONFIGURASI
// ==========================================
let leaveData = [];
let doctorsData = {};

// Nomor WhatsApp
const ADMIN_WA_NUMBER = "6285158441599"; // Untuk Form MCU
const ADMIN_WA_NUMBER2 = "628114788008"; // Untuk Tombol Melayang

// --- KONFIGURASI ADDITIONAL MCU PELAUT (FITUR BARU) ---
const pelautAddons = [
    { id: 'golongan_darah', label: 'Golongan Darah', price: 50000 },
    { id: 'IGM', label: 'IGM Anti HAV', price: 300000 }
];

let currentBasePrice = 0;
let currentTotalPrice = 0;
let currentPackageName = "";

// Urutan Tampilan Spesialis (Agar tombol yang digenerate rapi)
const specialtyCustomOrder = [
    'anak', 'kandungan', 'penyakit-dalam', 'mata', 'urologi', 'saraf', 'tht', 'paru',
    'bedah-saraf', 'jantung', 'rehab-medik', 'kulit-kelamin', 'bedah', 'jiwa',
    'bedah-toraks', 'gigi-umum', 'bedah-mulut', 'konservasi-gigi', 'penyakit-mulut',
    'prostodonsia', 'ortopedi', 'orthopedi', 'sub-spesialis-orthopaedi', // Handle variasi nama
    'kandungan-onkologi', 'kandungan-fetomaternal',
    'penyakit-dalam-ginjal', 'ginjal-hipertensi', // Handle variasi nama
    'bedah-onkologi', 'umum', 'medical-check-up'
];

// ==========================================
// 2. INISIALISASI UTAMA (DOM LOADED)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Referensi Elemen DOM
    const views = { home: document.getElementById('home-view'), mcu: document.getElementById('mcu-view') };
    const navs = { home: document.getElementById('nav-home'), mcu: document.getElementById('nav-mcu') };
    const mcuModal = document.getElementById('mcuFormModal');
    const loadingAnimation = document.getElementById('loadingAnimation');
    const gmbWidget = document.getElementById('floating-gmb-widget');
    const waButton = document.querySelector('a.whatsapp-button');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const doctorModal = document.getElementById('doctorModal');
    const closeGmbBtn = document.getElementById('close-gmb-widget');
    
    // Setup Fitur
    setupNavigation(views, navs);
    setupMcuButtons(mcuModal);
    setupMcuForm();
    setupReadMore(); 

    // Fetch Data API
    const LEAVE_DATA_API_URL = 'https://dashboarddev.netlify.app/.netlify/functions/getLeaveData';
    const DOCTOR_DATA_API_URL = 'https://dashboarddev.netlify.app/.netlify/functions/getDoctors';

    if(loadingAnimation) loadingAnimation.classList.remove('hidden');

    try {
        const cacheBuster = '?v=' + new Date().getTime();
        const [leaveResponse, doctorResponse] = await Promise.all([ 
            fetch(LEAVE_DATA_API_URL + cacheBuster), 
            fetch(DOCTOR_DATA_API_URL + cacheBuster) 
        ]);
        
        if (!leaveResponse.ok || !doctorResponse.ok) throw new Error("Gagal mengambil data dari server.");
        
        leaveData = await leaveResponse.json();
        doctorsData = await doctorResponse.json();
        
        // ============================================================
        // LOGIKA GENERATE TOMBOL DARI API (VERSI AWAL - ANTI ERROR)
        // ============================================================
        const specialistList = document.getElementById('specialist-list');
        
        if (specialistList) {
            // 1. Bersihkan dulu isi HTML (agar tidak bentrok/dobel dengan yang hardcoded)
            specialistList.innerHTML = ''; 

            // 2. Ambil Key Asli dari API
            const apiKeys = Object.keys(doctorsData);

            // 3. Urutkan Sesuai Custom Order
            apiKeys.sort((a, b) => {
                let indexA = specialtyCustomOrder.indexOf(a);
                let indexB = specialtyCustomOrder.indexOf(b);
                
                // Jika tidak ada di list urutan, coba cari kemiripan string
                if (indexA === -1) indexA = specialtyCustomOrder.findIndex(x => a.includes(x));
                if (indexB === -1) indexB = specialtyCustomOrder.findIndex(x => b.includes(x));

                // Jika masih tidak ada, taruh di belakang
                if (indexA === -1) indexA = 999;
                if (indexB === -1) indexB = 999;
                
                return indexA - indexB;
            });

            // 4. Buat Tombol Baru Berdasarkan Data API
            apiKeys.forEach(key => {
                const data = doctorsData[key];
                
                const link = document.createElement('a');
                link.href = "#";
                link.className = "specialist-link"; 
                link.setAttribute('data-specialty', key); // Key ini PASTI cocok dengan doctorsData[key]
                link.innerHTML = `<span>${data.title}</span>`; 

                // Event Listener
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    displayDoctors(key);
                });

                specialistList.appendChild(link);
            });
        }
        // ============================================================

        displayPoliklinikHariIni();
        displayOnLeaveDoctors();

        if (document.getElementById('poliklinik-hari-ini')?.offsetParent) setupTicker('poliklinik-hari-ini');
        if (document.getElementById('info-dokter-cuti')?.offsetParent) setupTicker('info-dokter-cuti');

    } catch (error) {
        console.error("Gagal memuat data:", error);
        document.getElementById('notifications-section')?.classList.add('hidden');
    } finally {
        if(loadingAnimation) loadingAnimation.classList.add('hidden');
        if (gmbWidget) gmbWidget.classList.remove('hidden');
        
        // Update Tombol WA Melayang
        if (waButton) {
            waButton.href = `https://wa.me/${ADMIN_WA_NUMBER2}`; 
            waButton.classList.remove('hidden');
        }
        setupPopup();
    }
    
    if(searchInput) searchInput.addEventListener('keyup', handleSearch);
    if(clearSearchBtn) clearSearchBtn.addEventListener('click', clearSearch);
    window.addEventListener('click', (e) => { if (e.target === doctorModal) doctorModal.classList.add('hidden'); });
    if (closeGmbBtn) closeGmbBtn.addEventListener('click', () => gmbWidget.classList.add('hidden')); 
});

// ==========================================
// 3. FUNGSI LOGIKA (HELPER)
// ==========================================

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

function setupTicker(tickerWrapId) {
    const scrollContainer = document.getElementById(tickerWrapId).querySelector('.ticker-wrap');
    if (!scrollContainer) return;
    let autoScrollInterval;
    const scrollSpeed = 50; 
    const startAutoScroll = () => {
        clearInterval(autoScrollInterval);
        autoScrollInterval = setInterval(() => {
            if (scrollContainer.scrollTop >= (scrollContainer.scrollHeight / 2)) scrollContainer.scrollTop = 0;
            else scrollContainer.scrollTop += 1;
        }, scrollSpeed);
    };
    const stopAutoScroll = () => clearInterval(autoScrollInterval);
    startAutoScroll();
    scrollContainer.addEventListener('mouseenter', stopAutoScroll);
    scrollContainer.addEventListener('touchstart', stopAutoScroll, { passive: true });
    scrollContainer.addEventListener('mouseleave', startAutoScroll);
    scrollContainer.addEventListener('touchend', startAutoScroll);
}

function formatDisplayDate(dateString) {
    if (!dateString) return 'Tanggal tidak tersedia';
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    let parts = String(dateString).split('-');
    let dateObj;
    if (parts[0].length === 4) dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    else dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
    if (isNaN(dateObj.getTime())) return dateString;
    return `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

function parseDateFromString(ds) {
    const parts = ds.split('-');
    return new Date(parts[2], parts[1] - 1, parts[0]); 
};

function createDoctorCardHTML(doctor, specialtyTitle) {
    const getDoctorLeaveStatus = (doctorName) => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return leaveData.find(l => {
            const start = parseDateFromString(l.TanggalMulaiCuti);
            const end = parseDateFromString(l.TanggalSelesaiCuti);
            return l.NamaDokter === doctorName && today >= start && today <= end;
        });
    };
    const leaveStatus = getDoctorLeaveStatus(doctor.name);
    const onLeaveClass = leaveStatus ? 'on-leave' : '';
    let leaveMessage = leaveStatus ? `<div class="leave-badge">Cuti hingga ${formatDisplayDate(leaveStatus.TanggalSelesaiCuti)}</div>` : '';
    
    let scheduleHTML = '', scheduleTextForWhatsApp = '';
    const daysOrder = { senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu' };
    
    let scheduleRows = [];
    for (const dayKey in daysOrder) {
        const scheduleData = doctor.schedule?.[dayKey];
        let scheduleTime = null;
        if (typeof scheduleData === 'string') { scheduleTime = scheduleData; } 
        else if (typeof scheduleData === 'object' && scheduleData !== null && scheduleData.jam) { scheduleTime = scheduleData.jam; }
        
        if (scheduleTime && scheduleTime.trim() !== '-' && scheduleTime.trim() !== '') {
            let time = scheduleTime;
            scheduleTextForWhatsApp += `${daysOrder[dayKey]}: ${time}\n`;
            if (specialtyTitle.includes('Dokter Umum') && time.includes('/')) {
                const parts = time.split('/');
                time = `${parts[0].trim()} / <span class="mcu-highlight">(MCU)</span> ${parts[1].trim()}`;
            }
            scheduleRows.push({ day: daysOrder[dayKey], time: time });
        }
    }
    
    if (scheduleRows.length > 0) {
        scheduleHTML = `<table class="doctor-schedule-table"><thead><tr><th>Hari</th><th>Jam</th></tr></thead><tbody>${scheduleRows.map(row => `<tr><td>${row.day}</td><td>${row.time}</td></tr>`).join('')}</tbody></table>`;
    } else {
        scheduleHTML = '<p class="text-sm text-gray-500">Jadwal tidak tersedia.</p>';
        scheduleTextForWhatsApp = 'Jadwal tidak tersedia.';
    }

    const whatsappText = encodeURIComponent(`Jadwal Dokter:\nNama: ${doctor.name}\nSpesialisasi: ${specialtyTitle}\n\nJadwal Praktik:\n${scheduleTextForWhatsApp}`);
    const whatsappIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 14.2c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.7-.8.9-.1.1-.3.2-.5.1-.2-.1-.9-.3-1.8-1.1-.7-.6-1.1-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.2.4-.4.1-.1.2-.2.2-.4.1-.1.1-.3 0-.4-.1-.1-.6-1.5-.8-2-.2-.5-.4-.5-.5h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2 1 2.3c.1.1 1.5 2.3 3.6 3.2.5.2.9.4 1.2.5.5.2 1 .1 1.3-.1.4-.2.6-.7.8-.9.1-.2.1-.4 0-.5l-.3-.5zM12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>`;
    const imageUrl = doctor.image_url || 'asset/logo/logo.png'; 
    return `<div class="doctor-card ${onLeaveClass}"><img src="${imageUrl}" alt="Foto ${doctor.name}" class="doctor-photo"><div class="doctor-info"><h4 class="doctor-name">${doctor.name}</h4><p class="doctor-specialty">${specialtyTitle}</p>${leaveMessage}<p class="schedule-title">Jadwal Praktik:</p><div class="schedule-list">${scheduleHTML}</div><a href="https://wa.me/?text=${whatsappText}" target="_blank" class="share-btn">${whatsappIconSVG}<span>Bagikan Jadwal</span></a></div></div>`;
}

function displayDoctors(specialtyKey) {
    const doctorModal = document.getElementById('doctorModal');
    // Tidak perlu validasi ketat di sini karena tombol di-generate dari data yang ada
    if (!doctorsData || !doctorsData[specialtyKey]) {
        alert("Data dokter sedang dimuat atau tidak tersedia. Silakan coba sesaat lagi.");
        return;
    }
    const data = doctorsData[specialtyKey];
    const skeletonCardHTML = `<div style="display:flex;flex-direction:row;gap:1rem;align-items:center;background-color:#f1f5f9;padding:1rem;border-radius:12px;"><div style="width:80px;height:80px;border-radius:8px;background-color:#e0e0e0;" class="skeleton"></div><div style="flex-grow:1;"><div style="height:20px;width:90%;background-color:#e0e0e0;border-radius:4px;" class="skeleton"></div><div style="height:16px;width:50%;margin-top:0.5rem;background-color:#e0e0e0;border-radius:4px;" class="skeleton"></div></div></div>`;
    const modalContent = doctorModal.querySelector('.modal-content');
    modalContent.innerHTML = `<div class="modal-header"><h3 class="text-2xl font-bold">${data.title}</h3><button id="closeModalBtn" class="close-btn">&times;</button></div><div class="modal-body-container"><div class="flex flex-col gap-4">${skeletonCardHTML.repeat(3)}</div></div>`;
    doctorModal.classList.remove('hidden');
    document.getElementById('closeModalBtn').addEventListener('click', () => doctorModal.classList.add('hidden'));
    setTimeout(() => {
        if (doctorModal.classList.contains('hidden')) return;
        const doctorCardsHTML = data.doctors.map(doctor => createDoctorCardHTML(doctor, data.title)).join('');
        const modalBody = modalContent.querySelector('.modal-body-container');
        if (modalBody) { modalBody.innerHTML = `<div class="flex flex-col gap-4">${doctorCardsHTML}</div>`; }
    }, 250);
}

function handleSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const specialistSection = document.querySelector('#specialist-list').parentElement;
    const notificationsSection = document.getElementById('notifications-section');
    const clearSearchBtn = document.getElementById('clearSearch');
    if (query.length === 0) { clearSearch(); return; }
    if (notificationsSection) notificationsSection.classList.add('hidden');
    searchResultsContainer.classList.remove('hidden');
    clearSearchBtn.classList.remove('hidden');
    if(specialistSection) specialistSection.classList.add('hidden');
    searchResultsContainer.innerHTML = '';
    const foundDoctors = [];
    for (const specialtyKey in doctorsData) {
        const specialtyData = doctorsData[specialtyKey];
        specialtyData.doctors.forEach(doctor => {
            if ((doctor.name.toLowerCase().includes(query) || specialtyData.title.toLowerCase().includes(query)) && !foundDoctors.some(d => d.name === doctor.name)) {
                foundDoctors.push({ ...doctor, specialtyTitle: specialtyData.title });
            }
        });
    }
    if (foundDoctors.length > 0) {
        searchResultsContainer.innerHTML = `<div class="flex flex-col gap-4">${foundDoctors.map(doc => createDoctorCardHTML(doc, doc.specialtyTitle)).join('')}</div>`;
    } else {
        searchResultsContainer.innerHTML = `<p class="text-center text-lg col-span-full">Tidak ada dokter atau spesialisasi yang cocok.</p>`;
    }
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').classList.add('hidden');
    const specialistSection = document.querySelector('#specialist-list').parentElement;
    if(specialistSection) specialistSection.classList.remove('hidden');
    document.getElementById('searchResultsContainer').classList.add('hidden');
    document.getElementById('searchResultsContainer').innerHTML = '';
    displayOnLeaveDoctors();
    displayPoliklinikHariIni();
}

function displayPoliklinikHariIni() {
    const container = document.getElementById('poliklinik-ticker');
    const section = document.getElementById('poliklinik-hari-ini');
    if (!container || !section) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dayNames = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const todayKey = dayNames[today.getDay()];
    const onLeaveDoctorNames = leaveData
        .filter(l => {
            const start = parseDateFromString(l.TanggalMulaiCuti);
            const end = parseDateFromString(l.TanggalSelesaiCuti);
            return today >= start && today <= end; 
        })
        .map(l => l.NamaDokter);
    let doctorsToday = [];
    for (const specialtyKey in doctorsData) {
        const specialty = doctorsData[specialtyKey];
        specialty.doctors.forEach(doctor => {
            const scheduleData = doctor.schedule?.[todayKey];
            let scheduleTime = null;
            if (typeof scheduleData === 'string') {
                scheduleTime = scheduleData;
            } else if (typeof scheduleData === 'object' && scheduleData !== null && scheduleData.jam) {
                scheduleTime = scheduleData.jam;
            }
            const hasScheduleToday = scheduleTime && scheduleTime.trim() !== '-';
            const isNotOnLeave = !onLeaveDoctorNames.includes(doctor.name);
            if (hasScheduleToday && isNotOnLeave) {
                doctorsToday.push({ name: doctor.name, image: doctor.image_url || 'asset/logo/logo.png', specialtyTitle: specialty.title, schedule: scheduleTime });
            }
        });
    }
    if (doctorsToday.length > 0) {
        const initialBatchSize = 20;
        const initialDoctors = doctorsToday.slice(0, initialBatchSize);
        const remainingDoctors = doctorsToday.slice(initialBatchSize);
        const generateHTML = (doctors) => {
            return doctors.map(doc => {
                const scheduleText = doc.schedule.replace(/<[^>]*>?/gm, '');
                return `<div class="poliklinik-item"><img src="${doc.image}" alt="${doc.name}"><div class="poliklinik-info"><div class="name">${doc.name}</div><div class="specialty">${doc.specialtyTitle}</div><div class="schedule-time">${scheduleText}</div></div></div>`;
            }).join('');
        };
        const initialHTML = generateHTML(initialDoctors);
        container.innerHTML = initialHTML + initialHTML; 
        section.classList.remove('hidden');
        if (remainingDoctors.length > 0) {
            setTimeout(() => {
                const remainingHTML = generateHTML(remainingDoctors);
                container.insertAdjacentHTML('beforeend', remainingHTML + remainingHTML);
            }, 500); 
        }
    } else {
        section.classList.add('hidden');
    }
}

function displayOnLeaveDoctors() {
    const notificationsSection = document.getElementById('notifications-section');
    const container = document.getElementById('cuti-ticker');
    const section = document.getElementById('info-dokter-cuti');
    if (!notificationsSection || !container || !section) return;
    if (leaveData.length === 0) { section.classList.add('hidden'); return; }
    notificationsSection.classList.remove('hidden');
    section.classList.remove('hidden');
    let listHTML = leaveData.map(leave => { 
        let doctorImage = 'asset/logo/logo.png';
        for (const key in doctorsData) {
            const found = doctorsData[key].doctors.find(doc => doc.name === leave.NamaDokter);
            if (found) { doctorImage = found.image_url || 'asset/logo/logo.png'; break; }
        }
        const startDate = formatDisplayDate(leave.TanggalMulaiCuti);
        const endDate = formatDisplayDate(leave.TanggalSelesaiCuti);
        return `<div class="leave-carousel-card on-leave"><img src="${doctorImage}" alt="Foto ${leave.NamaDokter}"><div class="leave-carousel-card-info"><div class="name">${leave.NamaDokter}</div><div class="status">Cuti: <b>${startDate}</b> s/d <b>${endDate}</b></div></div></div>`;
    }).join('');
    container.innerHTML = listHTML + listHTML;
}

function setupPopup() {
    const healthPopup = document.getElementById('healthPopup');
    const closeHealthPopupBtn = document.getElementById('closeHealthPopup');
    if (healthPopup) {
        healthPopup.classList.remove('hidden');
        healthPopup.classList.add('show');
        const autoClose = setTimeout(() => {
            healthPopup.classList.remove('show');
            setTimeout(() => healthPopup.classList.add('hidden'), 300);
        }, 10000);
        if (closeHealthPopupBtn) {
            closeHealthPopupBtn.addEventListener('click', () => { 
                healthPopup.classList.remove('show'); 
                clearTimeout(autoClose);
                setTimeout(() => healthPopup.classList.add('hidden'), 300);
            });
        }
    }
}

// ==========================================
// 4. FUNGSI NAVIGASI & MCU 
// ==========================================
function setupNavigation(views, navs) {
    const renderPage = (hash) => {
        const target = hash === '#mcu' ? 'mcu' : 'home';
        if (target === 'home') {
            views.home.classList.remove('hidden');
            views.mcu.classList.add('hidden');
            navs.home.classList.add('active');
            navs.mcu.classList.remove('active');
            document.title = "Jadwal Dokter - Siloam Hospitals Ambon";
        } else {
            views.home.classList.add('hidden');
            views.mcu.classList.remove('hidden');
            navs.home.classList.remove('active');
            navs.mcu.classList.add('active');
            document.title = "Paket Medical Check Up - Siloam Hospitals Ambon";
        }
    };
    const handleNavClick = (e, hash) => {
        e.preventDefault();
        history.pushState(null, null, hash);
        renderPage(hash);
    };
    navs.home.addEventListener('click', (e) => handleNavClick(e, '#home'));
    navs.mcu.addEventListener('click', (e) => handleNavClick(e, '#mcu'));
    const backBtn = document.getElementById('backToHomeBtn');
    if(backBtn) backBtn.addEventListener('click', (e) => handleNavClick(e, '#home'));
    renderPage(window.location.hash);
    window.addEventListener('popstate', () => renderPage(window.location.hash));
}

function setupMcuButtons(modal) {
    const buttons = document.querySelectorAll('.btn-select-package');
    const displayPackageName = document.getElementById('selectedPackageDisplay');
    const additionalContainer = document.getElementById('additionalOptionsContainer');
    const checkboxList = document.getElementById('checkboxList');
    const totalPriceContainer = document.getElementById('totalPriceContainer');
    const dynamicPriceDisplay = document.getElementById('dynamicTotalPrice');

    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            currentPackageName = this.getAttribute('data-package');
            const isPelaut = this.getAttribute('data-is-pelaut') === 'true';
            currentBasePrice = parseInt(this.getAttribute('data-base-price')) || 0;
            currentTotalPrice = currentBasePrice;

            displayPackageName.innerText = `Paket Dipilih: ${currentPackageName}`;
            checkboxList.innerHTML = '';

            if (isPelaut) {
                additionalContainer.classList.remove('hidden');
                totalPriceContainer.classList.remove('hidden');
                
                pelautAddons.forEach(addon => {
                    const div = document.createElement('div');
                    div.className = 'flex items-center justify-between';
                    div.innerHTML = `
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" class="addon-checkbox w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
                                   data-price="${addon.price}" 
                                   data-label="${addon.label}" 
                                   value="${addon.id}">
                            <span class="text-slate-700">${addon.label}</span>
                        </label>
                        <span class="text-slate-500 font-semibold text-xs">+${formatRupiah(addon.price)}</span>
                    `;
                    checkboxList.appendChild(div);
                });

                dynamicPriceDisplay.innerText = formatRupiah(currentTotalPrice);
                
                const checkboxes = checkboxList.querySelectorAll('.addon-checkbox');
                checkboxes.forEach(box => {
                    box.addEventListener('change', () => {
                        let addOnTotal = 0;
                        checkboxes.forEach(cb => { if(cb.checked) addOnTotal += parseInt(cb.getAttribute('data-price')); });
                        currentTotalPrice = currentBasePrice + addOnTotal;
                        dynamicPriceDisplay.innerText = formatRupiah(currentTotalPrice);
                    });
                });
            } else {
                additionalContainer.classList.add('hidden');
                totalPriceContainer.classList.add('hidden');
            }
            modal.classList.remove('hidden');
        });
    });
    document.getElementById('closeMcuForm').addEventListener('click', () => { modal.classList.add('hidden'); });
}

function setupReadMore() {
    const buttons = document.querySelectorAll('.btn-read-more');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const list = this.previousElementSibling.querySelector('.extra-items');
            if (!list) return;
            const isOpen = this.getAttribute('data-state') === 'open';
            if (isOpen) {
                list.classList.add('hidden');
                this.innerText = 'Lihat Selengkapnya';
                this.setAttribute('data-state', 'closed');
            } else {
                list.classList.remove('hidden');
                this.innerText = 'Tutup Detail';
                this.setAttribute('data-state', 'open');
            }
        });
    });
}

function setupMcuForm() {
    const form = document.getElementById('orderForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const nama = document.getElementById('mcuNama').value;
		const tanggal = document.getElementById('mcuTanggal').value;
        const hp = document.getElementById('mcuPhone').value;
        const email = document.getElementById('mcuEmail').value;
        let tanggalFormatted = tanggal; 
        if(tanggal) { const parts = tanggal.split('-'); tanggalFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`; }

        let additionalText = "";
        let finalPriceText = "";
        const checkboxes = document.querySelectorAll('.addon-checkbox:checked');
        if (checkboxes.length > 0) {
            const selectedLabels = Array.from(checkboxes).map(cb => cb.getAttribute('data-label'));
            additionalText = `%0A%0A*Tambahan (Add-on):*%0A- ${selectedLabels.join('%0A- ')}`;
        }
        if (currentBasePrice > 0) {
            finalPriceText = `%0A%0A*Total Estimasi: ${formatRupiah(currentTotalPrice)}*`;
        }

        const message = `Halo Admin Siloam Hospitals Ambon,%0A%0ASaya ingin mendaftar Medical Check Up:%0A*${currentPackageName}*${additionalText}${finalPriceText}%0A%0AData Diri:%0ANama: ${nama}%0AHp: ${hp}%0ATanggal: ${tanggalFormatted}%0AEmail: ${email}%0AKTP: (Foto KTP akan saya lampirkan manual setelah ini)`;
        alert("Sistem akan membuka WhatsApp.\n\nSilakan 'Paste' atau 'Lampirkan' foto KTP secara manual di chat WhatsApp.");
        window.open(`https://wa.me/${ADMIN_WA_NUMBER}?text=${message}`, '_blank');
        
        document.getElementById('mcuFormModal').classList.add('hidden');
        form.reset();
        document.getElementById('checkboxList').innerHTML = '';
        document.getElementById('additionalOptionsContainer').classList.add('hidden');
        document.getElementById('totalPriceContainer').classList.add('hidden');
    });
}