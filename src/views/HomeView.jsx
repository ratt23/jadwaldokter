import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { useDoctorData } from '../hooks/useDoctorData';
import { useSearchContext } from '../context/SearchContext';
import { parseDateFromString, formatDisplayDate, formatLeaveDates } from '../utils/dateUtils';
import DoctorCard from '../components/DoctorCard';
import SpecialtySelectorModal from '../components/SpecialtySelectorModal';
import DateSelectorModal from '../components/DateSelectorModal';
import NotificationSection from '../components/NotificationSection';
import AdDisplay from '../components/AdDisplay';
import { Search, Calendar, Stethoscope, SlidersHorizontal, X, Phone, Smartphone } from 'lucide-react';
import PingPongText from '../components/PingPongText';
import { getProxiedImageUrl } from '../utils/imageUtils';
import ListModal from '../components/ListModal';

const HomeView = () => {
    const config = useConfig();
    const { doctorsData, leaveData, loading } = useDoctorData();
    const { searchQuery, setSearchQuery } = useSearchContext();
    const { specialtyId } = useParams();
    const navigate = useNavigate();

    const handleDownloadMySiloam = () => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/android/i.test(userAgent)) {
            window.open('https://play.google.com/store/apps/details?id=com.siloam.mysiloam', '_blank');
        } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            window.open('https://apps.apple.com/id/app/mysiloam/id1256314055', '_blank');
        } else {
            window.open('https://www.siloamhospitals.com/mysiloam', '_blank');
        }
    };

    // Filters and Modals States
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [selectedSpecialtyKey, setSelectedSpecialtyKey] = useState(null);
    const [selectedSpecialtyData, setSelectedSpecialtyData] = useState(null);
    
    const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState(false);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [selectedPopupDoctor, setSelectedPopupDoctor] = useState(null);

    // Doctor Updates & Header CTA Banner States
    const [currentUpdateIdx, setCurrentUpdateIdx] = useState(0);
    const [currentLeaveIdx, setCurrentLeaveIdx] = useState(0);
    const [activeCtaIdx, setActiveCtaIdx] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    // Weekday names for date formatting
    const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const indonesianMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    // Map weekday indexes to database keys
    const indonesianDaysToKeys = {
        0: 'minggu',
        1: 'senin',
        2: 'selasa',
        3: 'rabu',
        4: 'kamis',
        5: 'jumat',
        6: 'sabtu'
    };

    const formattedToday = useMemo(() => {
        const today = new Date();
        return `${indonesianDays[today.getDay()]}, ${today.getDate()} ${indonesianMonths[today.getMonth()]} ${today.getFullYear()}`;
    }, [indonesianDays, indonesianMonths]);

    // Effect to handle URL based specialty selection
    useEffect(() => {
        if (specialtyId && !loading && doctorsData) {
            const specialtyData = doctorsData[specialtyId];
            if (specialtyData) {
                setSelectedSpecialtyKey(specialtyId);
                setSelectedSpecialtyData(specialtyData);
            }
        }
    }, [specialtyId, loading, doctorsData]);

    const handleSelectSpecialty = (key, data) => {
        setSelectedSpecialtyKey(key);
        setSelectedSpecialtyData(data);
        if (key) {
            navigate(`/jadwal-dokter/siloam-ambon/${key}`);
        } else {
            navigate('/home');
        }
    };

    const handleClearSpecialty = (e) => {
        e.stopPropagation();
        setSelectedSpecialtyKey(null);
        setSelectedSpecialtyData(null);
        navigate('/home');
    };

    const handleSelectDate = (date) => {
        setSelectedDate(date);
    };

    const handleClearDate = (e) => {
        e.stopPropagation();
        setSelectedDate(null); // reset to Semua Hari
    };

    const handleOpenDoctorPopup = (doctorName) => {
        if (!doctorsData) return;
        for (const specKey in doctorsData) {
            const spec = doctorsData[specKey];
            if (spec && spec.doctors) {
                const foundDoc = spec.doctors.find(d => d.name === doctorName);
                if (foundDoc) {
                    const leaveStatus = leaveData.find(l => {
                        const start = parseDateFromString(l.TanggalMulaiCuti);
                        const end = parseDateFromString(l.TanggalSelesaiCuti);
                        const target = selectedDate ? new Date(selectedDate) : new Date();
                        target.setHours(0,0,0,0);
                        start.setHours(0,0,0,0);
                        end.setHours(0,0,0,0);
                        return l.NamaDokter === foundDoc.name && target >= start && target <= end;
                    });
                    
                    setSelectedPopupDoctor({
                        doctor: foundDoc,
                        specialtyTitle: spec.title,
                        leaveStatus: leaveStatus
                    });
                    break;
                }
            }
        }
    };

    // --- Extract Recently Updated Doctors ---
    const updatedDoctors = useMemo(() => {
        if (!doctorsData) return [];
        const list = [];
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        for (const specKey in doctorsData) {
            const spec = doctorsData[specKey];
            if (spec && spec.doctors) {
                spec.doctors.forEach(doc => {
                    const isNew = config?.manualUpdateIds && (config.manualUpdateIds.includes(doc.id) || config.manualUpdateIds.includes(String(doc.id)));
                    const isRecentlyUpdated = doc.updated_at && new Date(doc.updated_at) > threeDaysAgo;
                    
                    if (isNew || isRecentlyUpdated) {
                        list.push({
                            name: doc.name,
                            specialty: spec.title,
                            specialtyKey: specKey
                        });
                    }
                });
            }
        }
        return list;
    }, [doctorsData, config]);

    // Handle smooth rotation for doctor updates (slide-up)
    useEffect(() => {
        if (updatedDoctors.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentUpdateIdx((prev) => (prev + 1) % updatedDoctors.length);
        }, 5000); // rotate every 5s

        return () => clearInterval(interval);
    }, [updatedDoctors]);

    // --- Extract Active Leave Doctors ---
    const leaveDoctors = useMemo(() => {
        if (!leaveData || !leaveData.length) return [];
        return leaveData.map(l => {
            let image = '/asset/logo/logo.png';
            for (const key in doctorsData) {
                if (doctorsData[key] && doctorsData[key].doctors) {
                    const found = doctorsData[key].doctors.find(d => d.name === l.NamaDokter);
                    if (found) { image = getProxiedImageUrl(found.image_url || '/asset/logo/logo.png'); break; }
                }
            }
            return {
                name: l.NamaDokter,
                image,
                start: formatDisplayDate(l.TanggalMulaiCuti),
                end: formatDisplayDate(l.TanggalSelesaiCuti)
            };
        });
    }, [leaveData, doctorsData]);

    const processedLeaveList = useMemo(() => {
        if (!leaveDoctors.length) return [];
        const groups = {};
        leaveDoctors.forEach(item => {
            if (!groups[item.name]) {
                groups[item.name] = {
                    name: item.name,
                    image: item.image,
                    dates: []
                };
            }
            groups[item.name].dates.push({ start: item.start, end: item.end });
        });
        const result = Object.values(groups).map(group => ({
            ...group,
            formattedDates: formatLeaveDates(group.dates)
        }));
        return result.sort((a, b) => {
            const dateA = a.dates[0]?.start ? parseDateFromString(a.dates[0].start) : new Date(8640000000000000);
            const dateB = b.dates[0]?.start ? parseDateFromString(b.dates[0].start) : new Date(8640000000000000);
            return dateA - dateB;
        });
    }, [leaveDoctors]);

    // Handle smooth rotation for leave doctors (slide-up)
    useEffect(() => {
        if (processedLeaveList.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentLeaveIdx((prev) => (prev + 1) % processedLeaveList.length);
        }, 4000); // rotate every 4s

        return () => clearInterval(interval);
    }, [processedLeaveList]);

    // Handle alternating header CTAs (MySiloam vs Emergency) with custom timed slide-out & scroll duration
    useEffect(() => {
        let activeTimers = [];
        
        const clearTimers = () => {
            activeTimers.forEach(clearTimeout);
            activeTimers = [];
        };

        const runCycle = () => {
            clearTimers();
            setIsExpanded(false);
            
            // 1. Expand after a short delay (e.g., 600ms) to let the fade in complete
            const t1 = setTimeout(() => {
                setIsExpanded(true);
            }, 600);
            activeTimers.push(t1);
            
            // 2. Start collapsing after 5.4s (at 6.0s total) so the 5.2s marquee text completes fully and returns to start
            const t2 = setTimeout(() => {
                setIsExpanded(false);
            }, 6000);
            activeTimers.push(t2);
            
            // 3. Switch to the next CTA and trigger next cycle (at 6.6s total)
            const t3 = setTimeout(() => {
                setActiveCtaIdx(prev => (prev === 0 ? 1 : 0));
                runCycle();
            }, 6600);
            activeTimers.push(t3);
        };
        
        runCycle();
        
        return () => {
            clearTimers();
        };
    }, []);

    // --- Search & Filter Results Logic ---
    const filteredDoctors = useMemo(() => {
        const results = [];
        if (!doctorsData || Object.keys(doctorsData).length === 0) return [];

        const dayKey = selectedDate ? indonesianDaysToKeys[selectedDate.getDay()] : null;
        const query = searchQuery ? searchQuery.toLowerCase() : '';

        for (const specKey in doctorsData) {
            // Apply specialty filter
            if (selectedSpecialtyKey && specKey !== selectedSpecialtyKey) {
                continue;
            }

            const spec = doctorsData[specKey];
            if (spec && spec.doctors) {
                spec.doctors.forEach(doc => {
                    // Match Search Query
                    const matchesSearch = !query || 
                        doc.name.toLowerCase().includes(query) || 
                        spec.title.toLowerCase().includes(query);

                    if (!matchesSearch) return;

                    if (dayKey) {
                        // Match Practicing Weekday Schedule (Single Day Mode)
                        const scheduleData = doc.schedule?.[dayKey];
                        let scheduleTime = null;
                        if (typeof scheduleData === 'string') { 
                            scheduleTime = scheduleData; 
                        } else if (typeof scheduleData === 'object' && scheduleData !== null && scheduleData.jam) { 
                            scheduleTime = scheduleData.jam; 
                        }

                        const hasSchedule = scheduleTime && scheduleTime.trim() !== '-' && scheduleTime.trim() !== '';

                        // Filter out doctors with no schedule on this weekday
                        if (!hasSchedule) return;
                    } else {
                        // Verify doctor has at least one practicing schedule in weekly mode
                        const daysList = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
                        const hasAnySchedule = daysList.some(day => {
                            const scheduleData = doc.schedule?.[day];
                            let time = null;
                            if (typeof scheduleData === 'string') { time = scheduleData; }
                            else if (typeof scheduleData === 'object' && scheduleData !== null && scheduleData.jam) { time = scheduleData.jam; }
                            return time && time.trim() !== '-' && time.trim() !== '';
                        });
                        if (!hasAnySchedule) return;
                    }

                    // Dynamic leave checking for selectedDate (or today if weekly mode)
                    const leaveStatus = leaveData.find(l => {
                        const start = parseDateFromString(l.TanggalMulaiCuti);
                        const end = parseDateFromString(l.TanggalSelesaiCuti);
                        
                        const target = selectedDate ? new Date(selectedDate) : new Date();
                        target.setHours(0,0,0,0);
                        start.setHours(0,0,0,0);
                        end.setHours(0,0,0,0);

                        return l.NamaDokter === doc.name && target >= start && target <= end;
                    });

                    results.push({
                        ...doc,
                        specialtyTitle: spec.title,
                        specialtyKey: specKey,
                        leaveStatus
                    });
                });
            }
        }

        // Sort by start time if in Single Day Mode (e.g. today)
        if (dayKey) {
            const parseStartTime = (timeStr) => {
                if (!timeStr) return 9999;
                const clean = timeStr.trim();
                if (clean === '-' || clean === '') return 9999;

                const match = clean.match(/(\d{1,2})[:.](\d{2})/);
                if (match) {
                    const hours = parseInt(match[1], 10);
                    const minutes = parseInt(match[2], 10);
                    return hours * 60 + minutes;
                }
                return 9999;
            };

            results.sort((a, b) => {
                const getScheduleTime = (doc) => {
                    const scheduleData = doc.schedule?.[dayKey];
                    if (typeof scheduleData === 'string') return scheduleData;
                    if (typeof scheduleData === 'object' && scheduleData !== null && scheduleData.jam) return scheduleData.jam;
                    return null;
                };

                const timeA = getScheduleTime(a);
                const timeB = getScheduleTime(b);

                return parseStartTime(timeA) - parseStartTime(timeB);
            });
        }

        return results;
    }, [searchQuery, doctorsData, leaveData, selectedDate, selectedSpecialtyKey]);

    // Format active date label
    const activeDateLabel = useMemo(() => {
        if (!selectedDate) {
            return 'Semua Hari';
        }
        
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const isSameDay = (d1, d2) => {
            return d1.getFullYear() === d2.getFullYear() &&
                   d1.getMonth() === d2.getMonth() &&
                   d1.getDate() === d2.getDate();
        };

        if (isSameDay(selectedDate, today)) {
            return 'Hari Ini';
        } else if (isSameDay(selectedDate, tomorrow)) {
            return 'Besok';
        } else {
            const dayName = indonesianDays[selectedDate.getDay()];
            const dateNum = selectedDate.getDate();
            const monthName = indonesianMonths[selectedDate.getMonth()];
            return `${dayName}, ${dateNum} ${monthName}`;
        }
    }, [selectedDate]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-16 text-[#01007f]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#01007f] border-t-transparent mb-4 shadow-xs"></div>
                <p className="font-bold text-sm tracking-wide">Memuat data dokter...</p>
            </div>
        );
    }

    return (
        <div id="home-view" className="pt-5 pb-12 bg-slate-50/50 min-h-screen">
            <style>{`
                @keyframes marquee-scroll-siloam {
                    0% { transform: translateX(0); }
                    15% { transform: translateX(0); }
                    80% { transform: translateX(calc(-100% + 55px)); }
                    90% { transform: translateX(calc(-100% + 55px)); }
                    100% { transform: translateX(0); }
                }
                @keyframes marquee-scroll-emergency {
                    0% { transform: translateX(0); }
                    15% { transform: translateX(0); }
                    80% { transform: translateX(calc(-100% + 85px)); }
                    90% { transform: translateX(calc(-100% + 85px)); }
                    100% { transform: translateX(0); }
                }
                @media (min-width: 640px) {
                    @keyframes marquee-scroll-siloam {
                        0% { transform: translateX(0); }
                        15% { transform: translateX(0); }
                        80% { transform: translateX(calc(-100% + 115px)); }
                        90% { transform: translateX(calc(-100% + 115px)); }
                        100% { transform: translateX(0); }
                    }
                    @keyframes marquee-scroll-emergency {
                        0% { transform: translateX(0); }
                        15% { transform: translateX(0); }
                        80% { transform: translateX(calc(-100% + 185px)); }
                        90% { transform: translateX(calc(-100% + 185px)); }
                        100% { transform: translateX(0); }
                    }
                }
                .run-marquee-siloam {
                    animation: marquee-scroll-siloam 5.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                .run-marquee-emergency {
                    animation: marquee-scroll-emergency 5.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
            `}</style>
            <h1 className="sr-only">Jadwal Praktik Dokter Spesialis {config.hospitalName || 'RSU Siloam Ambon'}</h1>

            {/* Dashboard Header Block */}
            <div className="max-w-4xl mx-auto px-3 sm:px-5 mb-6">
                <div className="bg-gradient-to-br from-blue-100/75 to-indigo-100/45 p-3.5 sm:p-5 rounded-3xl border border-blue-200 shadow-xs">
                    <div className="flex justify-between items-center gap-2 sm:gap-4">
                        <div className="flex-shrink-0">
                            <h2 className="text-[17px] sm:text-2xl md:text-3xl font-extrabold text-[#01007f] tracking-tight font-sans whitespace-nowrap">
                                Jadwal Poliklinik
                            </h2>
                            <p className="text-[10px] sm:text-xs md:text-sm text-slate-500 font-semibold mt-0.5 font-sans whitespace-nowrap">
                                RSU Siloam Ambon - {formattedToday}
                            </p>
                        </div>

                        {/* Alternating Small CTA Icons (Slide left + Fade) */}
                        <div className={`relative h-10 flex-shrink-0 transition-all duration-500 ease-in-out w-10 ${
                            isExpanded 
                                ? (activeCtaIdx === 0 ? 'w-[115px] sm:w-[180px]' : 'w-[145px] sm:w-[245px]') 
                                : ''
                        }`}>
                            {/* 1. MySiloam App Download CTA */}
                            <button
                                onClick={handleDownloadMySiloam}
                                className={`absolute right-0 top-0 h-10 rounded-full flex items-center bg-white border border-blue-200 text-[#01007f] shadow-xs hover:shadow-sm active:scale-95 transition-all duration-500 ease-in-out overflow-hidden w-10 ${
                                    activeCtaIdx === 0 
                                        ? 'opacity-100 translate-x-0 pointer-events-auto' 
                                        : 'opacity-0 translate-x-4 pointer-events-none'
                                } ${
                                    isExpanded ? 'w-[115px] sm:w-[180px] px-2 sm:px-3' : 'w-10 px-0 justify-center'
                                }`}
                                title="Download MySiloam App"
                            >
                                {/* Text container */}
                                <div className={`mr-1 sm:mr-2 transition-all duration-500 ease-in-out overflow-hidden flex items-center ${
                                    isExpanded ? 'w-[55px] sm:w-[115px] opacity-100' : 'w-0 opacity-0'
                                }`}>
                                    <span className={`text-[9px] sm:text-[11px] font-extrabold text-[#01007f] tracking-wide whitespace-nowrap uppercase pl-1 ${
                                        isExpanded ? 'run-marquee-siloam' : ''
                                    }`}>
                                        Download MySiloam
                                    </span>
                                </div>
                                
                                {/* Icon Container */}
                                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                                    <img 
                                        src="/asset/icon/icomysiloam.webp" 
                                        className="w-7 h-7 object-contain rounded-lg" 
                                        alt="MySiloam" 
                                    />
                                </div>
                            </button>

                            {/* 2. Emergency Call CTA */}
                            <a
                                href="tel:1500911"
                                className={`absolute right-0 top-0 h-10 rounded-full flex items-center bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-md hover:shadow-lg active:scale-95 transition-all duration-500 ease-in-out overflow-hidden w-10 ${
                                    activeCtaIdx === 1 
                                        ? 'opacity-100 translate-x-0 pointer-events-auto' 
                                        : 'opacity-0 translate-x-4 pointer-events-none'
                                } ${
                                    isExpanded ? 'w-[145px] sm:w-[245px] px-2 sm:px-3' : 'w-10 px-0 justify-center'
                                }`}
                                title="Emergency 1500911"
                            >
                                {/* Text container */}
                                <div className={`mr-1 sm:mr-2 transition-all duration-500 ease-in-out overflow-hidden flex items-center ${
                                    isExpanded ? 'w-[85px] sm:w-[185px] opacity-100' : 'w-0 opacity-0'
                                }`}>
                                    <span className={`text-[8px] sm:text-[9.5px] font-extrabold text-white tracking-wider whitespace-nowrap uppercase pl-1 ${
                                        isExpanded ? 'run-marquee-emergency' : ''
                                    }`}>
                                        24/7 Emergency & Contact Center
                                    </span>
                                </div>
                                
                                {/* Icon Container */}
                                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center relative">
                                    <span className="animate-ping absolute inset-2 rounded-full bg-red-400 opacity-30"></span>
                                    <Phone className="h-5 w-5 text-white animate-pulse" />
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Glowing Static Border Search Container */}
                    <div className="relative mt-5 p-[1.5px] rounded-2xl overflow-hidden bg-[#2563eb]/20 flex items-center shadow-xs focus-within:shadow-md focus-within:shadow-blue-100 transition-all duration-300">
                        {/* Static Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#2563eb] to-[#60a5fa]"></div>
                        
                        {/* Inner Container holding the actual input */}
                        <div className="relative w-full flex items-center bg-white rounded-[14.5px] overflow-hidden">
                            <input
                                type="text"
                                placeholder="Cari nama dokter / spesialis..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-5 pr-14 py-3.5 bg-transparent border-none text-sm focus:outline-none placeholder:text-slate-400 font-sans font-medium text-slate-700"
                            />
                            <button 
                                className="absolute right-2.5 p-2 bg-[#01007f]/5 hover:bg-[#01007f]/10 text-[#01007f] rounded-xl transition-colors"
                                aria-label="Cari"
                            >
                                <Search className="h-5 w-5 stroke-[2.5]" />
                            </button>
                        </div>
                    </div>

                    {/* Banners Grid Container */}
                    <div className={`mt-3.5 grid grid-cols-1 ${updatedDoctors.length > 0 ? 'sm:grid-cols-2' : 'grid-cols-1'} gap-2`}>
                        {/* Sliding Banner for Doctor Updates */}
                        {updatedDoctors.length > 0 && (
                            <div 
                                className="px-4 py-2.5 bg-green-50/70 border border-green-150 rounded-2xl flex items-center gap-2 text-xs md:text-sm text-green-800 transition-all duration-300 font-sans font-semibold cursor-pointer hover:bg-green-100/70 active:scale-99"
                                onClick={() => {
                                    const currentDoc = updatedDoctors[currentUpdateIdx];
                                    handleOpenDoctorPopup(currentDoc.name);
                                }}
                            >
                                <span className="flex h-2 w-2 relative flex-shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-[9px] font-extrabold uppercase bg-green-200/60 px-2 py-0.5 rounded-full text-green-700 tracking-wider flex-shrink-0 leading-none">
                                    UPDATE
                                </span>
                                <div className="relative h-5 overflow-hidden flex-1">
                                    <div 
                                        className="transition-transform duration-500 ease-in-out" 
                                        style={{ transform: `translateY(-${currentUpdateIdx * 20}px)` }}
                                    >
                                        {updatedDoctors.map((doc, idx) => (
                                            <div key={idx} className="h-5 flex items-center pr-4">
                                                <PingPongText 
                                                    text={
                                                        <span>
                                                            Jadwal Baru: <strong className="text-green-900">{doc.name}</strong> ({doc.specialty})
                                                        </span>
                                                    } 
                                                    className="w-full text-xs md:text-sm text-green-800" 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sliding Banner for Doctors on Leave */}
                        <div 
                            className="px-4 py-2.5 bg-red-50/70 border border-red-150 rounded-2xl flex items-center gap-2 text-xs md:text-sm text-red-800 transition-all duration-300 font-sans font-semibold cursor-pointer hover:bg-red-100/70 active:scale-99"
                            onClick={() => setIsLeaveModalOpen(true)}
                        >
                            <span className="flex h-2 w-2 relative flex-shrink-0">
                                {processedLeaveList.length > 0 && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${processedLeaveList.length > 0 ? 'bg-red-500' : 'bg-red-300'}`}></span>
                            </span>
                            <span className="text-[9px] font-extrabold uppercase bg-red-200/60 px-2 py-0.5 rounded-full text-red-700 tracking-wider flex-shrink-0 leading-none">
                                CUTI
                            </span>
                            <div className="relative h-5 overflow-hidden flex-1">
                                {processedLeaveList.length > 0 ? (
                                    <div 
                                        className="transition-transform duration-500 ease-in-out" 
                                        style={{ transform: `translateY(-${currentLeaveIdx * 20}px)` }}
                                    >
                                        {processedLeaveList.map((doc, idx) => (
                                            <div key={idx} className="h-5 flex items-center pr-4">
                                                <PingPongText 
                                                    text={
                                                        <span>
                                                            Cuti: <strong className="text-red-900">{doc.name}</strong> ({doc.formattedDates})
                                                        </span>
                                                    } 
                                                    className="w-full text-xs md:text-sm text-red-800" 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-5 flex items-center text-red-700">
                                        -
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {/* Specialty Selector Button */}
                        <button
                            onClick={() => setIsSpecialtyModalOpen(true)}
                            className={`flex items-center gap-2 px-4 py-3 bg-white border border-slate-100 rounded-2xl text-left shadow-xs hover:shadow-sm active:scale-98 transition-all duration-200 ${
                                selectedSpecialtyKey ? 'ring-1.5 ring-[#01007f] border-[#01007f]' : ''
                            }`}
                        >
                            <Stethoscope className="h-4.5 w-4.5 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0 pr-1">
                                <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase leading-none font-sans">
                                    Spesialisasi
                                </p>
                                <p className="text-xs font-extrabold text-slate-700 mt-1 truncate leading-tight font-sans">
                                    {selectedSpecialtyData ? selectedSpecialtyData.title : 'Pilih Spesialis'}
                                </p>
                            </div>
                            {selectedSpecialtyKey ? (
                                <div 
                                    onClick={handleClearSpecialty}
                                    className="p-0.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                    <X className="h-3 w-3 stroke-[2.5]" />
                                </div>
                            ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                            )}
                        </button>

                        {/* Date Selector Button */}
                        <button
                            onClick={() => setIsDateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-100 rounded-2xl text-left shadow-xs hover:shadow-sm active:scale-98 transition-all duration-200"
                        >
                            <Calendar className="h-4.5 w-4.5 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase leading-none font-sans">
                                    Tanggal
                                </p>
                                <p className="text-xs font-extrabold text-slate-700 mt-1 truncate leading-tight font-sans">
                                    {activeDateLabel}
                                </p>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Section (Only show when not searching) */}
            {!searchQuery && (
                <div className="max-w-4xl mx-auto px-5 mb-4">
                    <NotificationSection doctorsData={doctorsData} leaveData={leaveData} />
                </div>
            )}

            {/* Doctors Available List Section */}
            <div className="max-w-4xl mx-auto px-5">
                <div className="flex items-center justify-between mb-4 mt-2">
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight font-sans">
                        Jadwal Poliklinik Hari Ini
                    </h3>
                    <span className="text-xs font-bold text-[#01007f] bg-blue-50 px-2.5 py-1 rounded-full font-sans">
                        {filteredDoctors.length} Dokter
                    </span>
                </div>

                {filteredDoctors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredDoctors.map((doc, idx) => (
                            <DoctorCard
                                key={idx}
                                doctor={doc}
                                specialtyTitle={doc.specialtyTitle}
                                leaveStatus={doc.leaveStatus}
                                selectedDate={selectedDate}
                                onClick={() => handleOpenDoctorPopup(doc.name)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-xs px-6">
                        <div className="inline-flex p-4 rounded-full bg-blue-50/50 text-[#01007f] mb-4">
                            <SlidersHorizontal className="h-7 w-7 stroke-[1.5]" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-700 font-sans">
                            Tidak Ada Dokter Praktik
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto font-sans font-medium leading-relaxed">
                            Coba ubah tanggal atau bersihkan pencarian dan spesialis untuk melihat jadwal lainnya.
                        </p>
                        {(searchQuery || selectedSpecialtyKey) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedSpecialtyKey(null);
                                    setSelectedSpecialtyData(null);
                                    navigate('/home');
                                }}
                                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 font-sans"
                            >
                                Reset Filter Pencarian
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Banner Ad */}
            <div className="mt-10 mb-6 max-w-4xl mx-auto px-5">
                <div className="flex justify-center bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
                    <AdDisplay
                        slotId="home-bottom-banner"
                        style={{ width: '100%', maxWidth: '728px', height: '90px' }}
                    />
                </div>
            </div>

            {/* Specialty Selector Modal */}
            <SpecialtySelectorModal
                isOpen={isSpecialtyModalOpen}
                onClose={() => setIsSpecialtyModalOpen(false)}
                doctorsData={doctorsData}
                onSelectSpecialty={handleSelectSpecialty}
                selectedSpecialty={selectedSpecialtyKey}
            />

            {/* Date Selector Modal */}
            <DateSelectorModal
                isOpen={isDateModalOpen}
                onClose={() => setIsDateModalOpen(false)}
                onSelectDate={handleSelectDate}
                selectedDate={selectedDate}
            />

            {/* Doctor Detail Popup Modal */}
            <DoctorPopupModal
                isOpen={!!selectedPopupDoctor}
                onClose={() => setSelectedPopupDoctor(null)}
                doctorData={selectedPopupDoctor}
                selectedDate={selectedDate}
            />

            {/* Doctors on Leave List Modal */}
            <ListModal
                isOpen={isLeaveModalOpen}
                onClose={() => setIsLeaveModalOpen(false)}
                title="Informasi Dokter Cuti"
                data={processedLeaveList}
                type="leave"
            />

        </div>
    );
};

const DoctorPopupModal = ({ isOpen, onClose, doctorData, selectedDate }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    if (!isOpen || !doctorData) return null;

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300);
    };

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleClose}
        >
            <div 
                className={`bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-transform duration-300 ${visible ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:scale-95'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-[#01007f] text-white">
                    <div className="flex items-center gap-2.5">
                        <Stethoscope className="h-5 w-5 text-blue-200" />
                        <h3 className="text-lg font-bold font-sans">Jadwal Dokter</h3>
                    </div>
                    <button 
                        onClick={handleClose} 
                        className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                {/* Doctor Card Container */}
                <div className="p-6 bg-slate-50/50">
                    <DoctorCard
                        doctor={doctorData.doctor}
                        specialtyTitle={doctorData.specialtyTitle}
                        leaveStatus={doctorData.leaveStatus}
                        selectedDate={selectedDate}
                        isPopup={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default HomeView;
