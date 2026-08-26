import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Stethoscope } from 'lucide-react';
import { trackEvent } from './AnalyticsTracker';
import { useConfig } from '../context/ConfigContext';
import { getProxiedImageUrl } from '../utils/imageUtils';

const LOCAL_DOCTOR_FILES = [
    "dr. alex ranuseto, sp.pd.png","dr. amanda gracia manuputty, m.ked, sp.dv.png","dr. anitha marllyin mairuhu, m.ked.klin., sp.a., cps.png","dr. chaisari maria m. turnip, sp.btkv, fiatcvs.png","dr. chriscelia valery so, sptht-kl.png","dr. daniel siegers, sp.m.png","dr. david santoso tjoei, sp.kj, mars.png","dr. denny jolanda, sp.pd, finasim.png","dr. dian qisthi, sp.pd.png","dr. dr. rodrigo limmon, sp.tht-kl, mars.png","dr. elizabeth joan salim, sp.a.png","dr. enseline nikijuluw, sp.s.png","dr. erwin rahakbauw, spog, subsp.onk.png","dr. gery soemara, sp.jp.png","dr. hanny tanasal, sp.kk.png","dr. hery siswanto, sp.b, fics finacs.png","dr. i dewa gede sidan agung mahendra, sp.b.png","dr. i made kristya permana, sp.pd.png","dr. i wayan ardy paribrajaka, sp.m.png","dr. ika wiraswesty ciptaningdiah, sp.og, m.biomed.png","dr. iman haryana, sp.jp.png","dr. irene leha, sp.og.png","dr. ivanmorl ruspanah, sp.bs.png","dr. jansye cyntia pentury, sp.pd.png","dr. maria magdalena renjaan.png","dr. marisa afifudin, sp.p.png","dr. markus daniel taliak, sp.og.png","dr. maureen jaqualin paliyama, sp.kfr.png","dr. merlyn margareth maelissa, spog, subsp. kfm, m.kes.png","dr. mo tualeka, sp.b.png","dr. ni luh putu dirasandhi semedi putri, sp.n.png","dr. norma pattinama, sp.og.png","dr. rachmat ramadhani tuasikal, sp.og., subsp.onk.png","dr. rey jauwerissa, sp.og.png","dr. ria jauwerissa, m.biomed, sp.pd-kgh.png","dr. ria resti sukur, sp.a.png","dr. ricky masyudha, sp.b.png","dr. rina angriany, sp.p.png","dr. robby kalew, sp.a.png","dr. stanley permana setiawan, sp.tht-kl.png","dr. stefanus cahyo ariwicaksono, sp.u.png","dr. tjoa debby angela tjoanda, sp.m.png","dr. ubaidillah, sp.b (k) onk.png","dr. wigi.png","dr. wijaya johanes chendra, sp.ot (k), aifo-k, fics.png","dr. winny natacia leiwakabessy, m.kes, sppa (2).png","dr. wiwin lestari selawa, sp.kfr.png","dr. wyckmell octof ingratoeboen, sp.u.png","drg. hasrul husain, sp.pm.png","drg. imelda (2).png","drg. lieyanti melinda.png","drg. lisye fabiola loei.png","drg. roberto hutapea, sp.bmm.png","drg. slamet riyadi, sp.bmm.png","drg. stephanie astrid rehatta.png","drg. wendy agus wirawan, sp.pros.png","drg. wigiarti, sp.kg.png"
];

const getDoctorLocalPhoto = (name) => {
    if (!name) return null;
    const clean = name.toLowerCase().replace(/\s+/g, ' ').trim();
    if (LOCAL_DOCTOR_FILES.includes(clean + '.png')) return `/asset/150px/${clean}.png`;
    const parts = clean.split(',')[0].trim();
    const found = LOCAL_DOCTOR_FILES.find(f => f.startsWith(parts) || f.includes(parts.replace(/^dr\.\s*|^drg\.\s*/i, '')));
    return found ? `/asset/150px/${found}` : null;
};

const DoctorCard = ({ doctor, specialtyTitle, leaveStatus, selectedDate, isPopup = false, hideSchedule = false, onClick }) => {
    const config = useConfig();
    const isSingleDayMode = !!selectedDate;
    const cleanDoctorName = (doctor?.name || '').replace(/\s+,/g, ',').trim();
    const primaryImg = doctor?.image_url ? getProxiedImageUrl(doctor.image_url) : getDoctorLocalPhoto(doctor?.name);
    const [currentImg, setCurrentImg] = useState(primaryImg);
    const [hasError, setHasError] = useState(!primaryImg);

    useEffect(() => {
        const nextImg = doctor?.image_url ? getProxiedImageUrl(doctor.image_url) : getDoctorLocalPhoto(doctor?.name);
        setCurrentImg(nextImg);
        setHasError(!nextImg);
    }, [doctor?.image_url, doctor?.name]);

    const handleImgError = () => {
        const localPhoto = getDoctorLocalPhoto(doctor?.name);
        if (currentImg !== localPhoto && localPhoto) {
            setCurrentImg(localPhoto);
        } else {
            setHasError(true);
        }
    };

    // Check if on leave (on selectedDate if single day mode, or today if weekly mode)
    const isOnLeave = !!leaveStatus;

    // Determine status badge based on TODAY's actual day (always real-time, regardless of selectedDate)
    const todayDayKeys = { 0: 'minggu', 1: 'senin', 2: 'selasa', 3: 'rabu', 4: 'kamis', 5: 'jumat', 6: 'sabtu' };
    const todayDayKey = todayDayKeys[new Date().getDay()];
    const todayScheduleData = doctor.schedule?.[todayDayKey];
    let todayScheduleTime = null;
    if (typeof todayScheduleData === 'string') { todayScheduleTime = todayScheduleData; }
    else if (typeof todayScheduleData === 'object' && todayScheduleData !== null && todayScheduleData.jam) { todayScheduleTime = todayScheduleData.jam; }
    const isPracticingToday = !isOnLeave && todayScheduleTime && todayScheduleTime.trim() !== '-' && todayScheduleTime.trim() !== '';

    // Common styling helper
    const sanitizedSpecialty = specialtyTitle
        ? specialtyTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
        : 'general';
    const eventName = `interest_${sanitizedSpecialty}`;

    // Helper to get initials
    const getInitials = (name) => {
        let clean = name.replace(/^(Dr\.|dr\.|drg\.)\s*/i, "").trim();
        clean = clean.split(",")[0].trim();
        const parts = clean.split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0] ? parts[0][0].toUpperCase() : "DR";
    };

    // Parse weekly schedule unconditionally (always needed for popup or weekly view)
    const daysOrder = { senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu' };
    const scheduleRows = [];
    let scheduleTextForWhatsApp = '';

    for (const dayKey in daysOrder) {
        const scheduleData = doctor.schedule?.[dayKey];
        let time = null;
        if (typeof scheduleData === 'string') { time = scheduleData; }
        else if (typeof scheduleData === 'object' && scheduleData !== null && scheduleData.jam) { time = scheduleData.jam; }

        if (time && time.trim() !== '-' && time.trim() !== '') {
            scheduleRows.push({ day: daysOrder[dayKey], time: time });
            scheduleTextForWhatsApp += `*${daysOrder[dayKey]}*: ${time}\n`;
        }
    }

    const hasWeeklySchedule = scheduleRows.length > 0;

    // 1. Single Day Mode Schedule Processing
    let formattedDateString = '';
    let scheduleTime = null;
    let hasPracticingHours = false;
    let whatsappText = '';

    const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const indonesianMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    if (isSingleDayMode) {
        const activeDate = new Date(selectedDate);
        const dayName = indonesianDays[activeDate.getDay()];
        const monthName = indonesianMonths[activeDate.getMonth()];
        formattedDateString = `${dayName}, ${activeDate.getDate()} ${monthName} ${activeDate.getFullYear()}`;

        const indonesianDaysToKeys = {
            0: 'minggu',
            1: 'senin',
            2: 'selasa',
            3: 'rabu',
            4: 'kamis',
            5: 'jumat',
            6: 'sabtu'
        };
        const dayKey = indonesianDaysToKeys[activeDate.getDay()];
        const scheduleData = doctor.schedule?.[dayKey];
        
        if (typeof scheduleData === 'string') { 
            scheduleTime = scheduleData; 
        } else if (typeof scheduleData === 'object' && scheduleData !== null && scheduleData.jam) { 
            scheduleTime = scheduleData.jam; 
        }

        hasPracticingHours = scheduleTime && scheduleTime.trim() !== '-' && scheduleTime.trim() !== '';

        if (isPopup) {
            // When in details popup modal, we always want the weekly schedule details and share templates
            whatsappText = encodeURIComponent(
                `*INFORMASI JADWAL PRAKTIK DOKTER*\n` +
                `*${config.hospitalName || 'RSU Siloam Ambon'}*\n\n` +
                `*Nama Dokter*: ${cleanDoctorName}\n` +
                `*Spesialisasi*: ${specialtyTitle || '-'}\n` +
                (isOnLeave ? `*Status*: SEDANG CUTI (${leaveStatus.TanggalMulaiCuti} s/d ${leaveStatus.TanggalSelesaiCuti})\n\n` : `\n`) +
                `*Jadwal Praktik Mingguan*:\n` +
                (hasWeeklySchedule ? scheduleTextForWhatsApp : `Jadwal tidak tersedia / Perjanjian\n`) +
                `\n_Pendaftaran & Informasi lebih lanjut dapat melalui aplikasi MySiloam._`
            );
            hasPracticingHours = hasWeeklySchedule;
        } else {
            whatsappText = encodeURIComponent(
                `*INFORMASI JADWAL PRAKTIK DOKTER*\n` +
                `*${config.hospitalName || 'RSU Siloam Ambon'}*\n\n` +
                `*Nama Dokter:* ${doctor.name}\n` +
                `*Spesialisasi:* ${specialtyTitle}\n` +
                `*Hari/Tanggal:* ${formattedDateString}\n` +
                `*Jam Praktik:* ${hasPracticingHours ? scheduleTime : 'Tidak ada jadwal'}\n\n` +
                `*Buat janji temu menggunakan aplikasi MySiloam*`
            );
        }
    } else {
        hasPracticingHours = hasWeeklySchedule;

        whatsappText = encodeURIComponent(
            `*INFORMASI JADWAL PRAKTIK DOKTER*\n` +
            `*${config.hospitalName || 'RSU Siloam Ambon'}*\n\n` +
            `*Nama Dokter:* ${doctor.name}\n` +
            `*Spesialisasi:* ${specialtyTitle}\n\n` +
            `*Jadwal Praktik:*\n${scheduleTextForWhatsApp}\n` +
            `*Buat janji temu menggunakan aplikasi MySiloam*`
        );
    }

    return (
        <div
            onClick={(e) => {
                trackEvent(eventName, { doctor_name: cleanDoctorName, specialty: specialtyTitle });
                if (onClick) onClick(e);
            }}
            className={`flex items-start gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs transition-all duration-300 relative ${
                !isPopup ? 'cursor-pointer hover:shadow-md hover:border-slate-200/50 active:scale-[0.99]' : ''
            } ${
                isOnLeave ? 'bg-slate-50/60 opacity-90' : ''
            }`}
        >
            {/* Absolute Status Badge */}
            <div className="absolute top-4 right-4 z-10">
                {isOnLeave ? (
                    <span className="bg-red-50 text-red-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Cuti</span>
                ) : isPracticingToday ? (
                    <span className="bg-green-50 text-green-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Buka</span>
                ) : (
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Tutup</span>
                )}
            </div>

            {/* Left Column: Avatar */}
            <div className="flex flex-col items-center flex-shrink-0">
                {!hasError && currentImg ? (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xs">
                        <img
                            src={currentImg}
                            alt={`Foto ${cleanDoctorName}`}
                            loading="lazy"
                            onError={handleImgError}
                            className={`w-full h-full object-cover ${isOnLeave ? 'grayscale' : ''}`}
                        />
                    </div>
                ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100/50 border border-slate-100 flex flex-col justify-center items-center shadow-xs relative overflow-hidden">
                        <span className="text-xl md:text-2xl font-black font-sans tracking-tight text-blue-600/70 z-10 leading-none">
                            {getInitials(cleanDoctorName)}
                        </span>
                        <Stethoscope className="w-8 h-8 text-blue-500/10 absolute stroke-[1.5]" />
                    </div>
                )}
            </div>

            {/* Right Column: Doctor Info */}
            <div className="flex-1 min-w-0 pr-16">
                <h4 className="text-[15px] md:text-[17px] font-extrabold text-slate-800 leading-tight font-sans">
                    {cleanDoctorName}
                </h4>
                <p className="text-xs md:text-sm font-semibold text-slate-400 mt-1 font-sans leading-none">
                    {specialtyTitle}
                </p>

                {!hideSchedule && (
                    isSingleDayMode && !isPopup ? (
                        // --- Single Day Schedule View ---
                        <>
                            {/* Date Row */}
                            <div className="flex items-center gap-2 mt-2 text-xs md:text-sm text-slate-600 font-sans font-semibold">
                                <Calendar className="h-4 w-4 text-[#01007f]/80 flex-shrink-0" />
                                <span className="leading-none">{formattedDateString}</span>
                            </div>

                            {/* Clock Row */}
                            <div className="flex items-center gap-2 mt-1.5 text-xs md:text-sm text-slate-600 font-sans font-semibold">
                                <Clock className="h-4 w-4 text-[#01007f]/80 flex-shrink-0" />
                                <span className="leading-none">{hasPracticingHours ? scheduleTime : 'Tidak ada praktik'}</span>
                            </div>
                        </>
                    ) : (
                        // --- Weekly Full Schedule View ---
                        <>
                            <div className="flex items-center gap-2 mt-2 text-xs text-[#01007f] font-bold font-sans">
                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                <span className="leading-none">Jadwal Praktik</span>
                            </div>

                            <div className="mt-1.5 flex flex-col gap-1.5 text-xs text-slate-600 font-sans font-semibold">
                                {scheduleRows.length > 0 ? (
                                    scheduleRows.map((row, idx) => (
                                        <div key={idx} className="flex items-center gap-2 border-b border-slate-50 pb-1 last:border-none last:pb-0">
                                            <span className="w-14 text-slate-400 font-extrabold uppercase text-[9px]">{row.day}</span>
                                            <span className="text-slate-700">{row.time}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 italic">Jadwal tidak tersedia</p>
                                )}
                            </div>
                        </>
                    )
                )}

                {/* CTA Button (Only shown when inside popup detail) */}
                {isPopup && (
                    <>
                        {/* Book Appointment via Siloam Profile — only if siloam_url is set */}
                        {doctor.siloam_url && (
                            <a
                                href={doctor.siloam_url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    trackEvent('click_book_siloam', { doctor: doctor.name });
                                }}
                                className="flex items-center justify-center gap-2 w-full mt-4 bg-[#01007f] hover:bg-[#0100a0] text-white font-bold text-xs md:text-sm py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md active:scale-98 transition-all duration-200 text-center font-sans"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>
                                <span>Book Appointment</span>
                            </a>
                        )}

                        {/* WhatsApp Share / Status */}
                        {!isOnLeave && hasPracticingHours ? (
                            <a
                                href={`https://wa.me/?text=${whatsappText}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    trackEvent('click_whatsapp_schedule', { doctor: doctor.name });
                                }}
                                className="flex items-center justify-center gap-1.5 w-full mt-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm py-2.5 px-4 rounded-xl shadow-xs hover:shadow-sm active:scale-98 transition-all duration-200 text-center font-sans"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01C17.18 3.03 14.69 2 12.04 2M12.05 3.66c2.2 0 4.26.85 5.82 2.41 1.55 1.56 2.41 3.63 2.41 5.85 0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32c-.82-1.29-1.26-2.82-1.26-4.38 0-4.54 3.7-8.23 8.24-8.23" /></svg>
                                <span>Share WhatsApp</span>
                            </a>
                        ) : (
                            <div className={`w-full py-2.5 px-4 rounded-xl text-center bg-slate-100 text-slate-400 font-bold text-xs md:text-sm select-none font-sans ${doctor.siloam_url ? 'mt-2.5' : 'mt-4'}`}>
                                {isOnLeave ? 'Sedang Cuti' : 'Tidak Ada Praktik'}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DoctorCard;
