import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSearchContext } from '../context/SearchContext';
import { Search } from 'lucide-react';
import IOSInstallPrompt from './IOSInstallPrompt';

import { useConfig } from '../context/ConfigContext';
import PingPongText from './PingPongText'; // Import PingPongText
import { getProxiedImageUrl } from '../utils/imageUtils'; // Import proxy util

const Header = () => {
    const { searchQuery, setSearchQuery } = useSearchContext();
    const config = useConfig();
    const location = useLocation();
    const navigate = useNavigate();

    const [isSubscribed, setIsSubscribed] = React.useState(false);
    const [showIOSPrompt, setShowIOSPrompt] = React.useState(false);

    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Live Clock and Date state
    const [currentTime, setCurrentTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedHeaderTime = React.useMemo(() => {
        const hours = String(currentTime.getHours()).padStart(2, '0');
        const minutes = String(currentTime.getMinutes()).padStart(2, '0');
        const seconds = String(currentTime.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }, [currentTime]);

    const formattedHeaderDate = React.useMemo(() => {
        const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const indonesianMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        
        const dayName = indonesianDays[currentTime.getDay()];
        const dateNum = currentTime.getDate();
        const monthName = indonesianMonths[currentTime.getMonth()];
        const year = currentTime.getFullYear();
        
        return `${dayName}, ${dateNum} ${monthName} ${year}`;
    }, [currentTime]);

    // Helper: Detect iOS
    const isIOS = () => {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    };

    // Helper: Detect Standalone (PWA) Mode
    const isStandalone = () => {
        return ('standalone' in window.navigator) && (window.navigator.standalone);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        // If on article page, stay there for article search
        // If on other pages, navigate to home for doctor search
        if (location.pathname.startsWith('/article')) {
            // Stay on article page for article search
            return;
        }
        if (location.pathname !== '/home') {
            navigate('/home');
        }
    };

    // Determine placeholder based on current page
    const searchPlaceholder = location.pathname.startsWith('/article')
        ? 'Cari artikel...'
        : 'Cari dokter atau spesialis...';

    React.useEffect(() => {
        if (window.OneSignalDeferred) {
            window.OneSignalDeferred.push(async function (OneSignal) {
                // Cek status awal
                setIsSubscribed(OneSignal.User.PushSubscription.optedIn);

                // Listen perubahan subscription
                OneSignal.User.PushSubscription.addEventListener("change", (event) => {
                    setIsSubscribed(event.current.optedIn);
                });
            });
        }
    }, []);

    const handleBellClick = () => {
        // Logika khusus iPhone (Jika iOS & Bukan PWA)
        if (isIOS() && !isStandalone()) {
            setShowIOSPrompt(true);
            return;
        }

        if (window.OneSignalDeferred) {
            window.OneSignalDeferred.push(async function (OneSignal) {
                if (isSubscribed) {
                    const confirmUnsub = window.confirm("Apakah Anda ingin berhenti berlangganan notifikasi?");
                    if (confirmUnsub) {
                        await OneSignal.User.PushSubscription.optOut();
                        alert("Berhasil berhenti berlangganan. 🔕");
                    }
                } else {
                    await OneSignal.Slidedown.promptPush({ force: true });
                }
            });
        }
    };

    if (isMobile && (location.pathname === '/home' || location.pathname.startsWith('/jadwal-dokter/'))) {
        return (
            <>
                <IOSInstallPrompt isOpen={showIOSPrompt} onClose={() => setShowIOSPrompt(false)} />
                <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
                    {/* Row 1: Brand & Clock */}
                    <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                        {/* Brand Logo */}
                        <div 
                            className="flex-shrink-0 w-[35%] max-w-[85px] cursor-pointer"
                            onClick={() => {
                                setSearchQuery('');
                                navigate('/home');
                            }}
                        >
                            {config?.logoUrl ? (
                                <img src={config.logoUrl} alt={`Logo ${config?.hospitalShortName || 'Healthcare'}`} className="w-full h-auto" />
                            ) : (
                                <img src="/asset/logo/logo.png" alt={`Logo ${config?.hospitalShortName || 'Healthcare'}`} className="w-full h-auto" />
                            )}
                        </div>

                        {/* Mobile Clock & Date Display */}
                        <div className="flex-grow flex items-center justify-end pr-1">
                            <div className="flex flex-col items-end justify-center text-right leading-none">
                                <div className="text-[1.05rem] font-black text-[#01007f] font-mono tracking-wide tabular-nums leading-none">
                                    {formattedHeaderTime}
                                </div>
                                <div className="text-[7.5px] font-extrabold text-slate-500 font-sans tracking-wider mt-1 uppercase leading-none">
                                    {formattedHeaderDate}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Mobile Navigation Menu Bar (Dynamic from Site Menu Manager) */}
                    {config?.menu && config.menu.length > 0 && (
                        <div className="border-t border-slate-100 px-3 py-1.5 overflow-x-auto no-scrollbar flex items-center gap-1.5 bg-white">
                            {config.menu.map((item) => {
                                const isExternal = item.url?.startsWith('http://') || item.url?.startsWith('https://');
                                if (isExternal) {
                                    return (
                                        <a
                                            key={item.id}
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-primary whitespace-nowrap rounded-md hover:bg-slate-50 transition-colors"
                                        >
                                            {item.label}
                                        </a>
                                    );
                                }
                                return (
                                    <NavLink
                                        key={item.id}
                                        to={item.url}
                                        className={({ isActive }) => `px-2.5 py-1 text-xs font-semibold whitespace-nowrap rounded-md transition-colors ${
                                            isActive
                                                ? 'text-primary bg-blue-50 border-b-2 border-primary'
                                                : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                                        }`}
                                    >
                                        {item.label}
                                    </NavLink>
                                );
                            })}
                        </div>
                    )}
                </header>
            </>
        );
    }

    return (
        <>
            <IOSInstallPrompt isOpen={showIOSPrompt} onClose={() => setShowIOSPrompt(false)} />
            <header className="bg-white shadow-md sticky top-0 z-50">
                {/* Row 1: Brand & Info (Existing) */}
                <div className="flex items-center justify-between gap-3 md:gap-4 p-3 md:p-6 pb-2 md:pb-4 border-b border-slate-50">
                    <div className="flex-shrink-0 w-[40%] max-w-[100px] md:w-auto md:max-w-none cursor-pointer" onClick={() => navigate('/home')}>
                        {config?.logoUrl ? (
                            <img src={config.logoUrl} alt={`Logo ${config?.hospitalShortName || 'Healthcare'} `} className="w-full h-auto md:h-14 md:w-auto" />
                        ) : (
                            <img src="/asset/logo/logo.png" alt={`Logo ${config?.hospitalShortName || 'Healthcare'} `} className="w-full h-auto md:h-14 md:w-auto" />
                        )}
                    </div>

                    {/* Desktop Clock & Date Display */}
                    <div className="h-10 md:h-14 flex-grow flex items-center justify-end pr-1">
                        <div className="flex flex-col items-end justify-center text-right leading-none">
                            <div className="text-xl md:text-2xl font-black text-[#01007f] font-mono tracking-wider tabular-nums leading-none">
                                {formattedHeaderTime}
                            </div>
                            <div className="text-[10px] md:text-xs font-extrabold text-slate-500 font-sans tracking-wide mt-1.5 md:mt-2 uppercase leading-none">
                                {formattedHeaderDate}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Navigation & Search */}
                <div className="flex flex-wrap items-center justify-between px-3 md:px-6 py-2 gap-2 bg-white">
                    <nav className="flex items-center gap-1 md:gap-6 overflow-x-auto no-scrollbar mask-image-linear-to-r w-full md:w-auto">
                        {config?.menu && config.menu.map((item) => {
                            const isExternal = item.url?.startsWith('http://') || item.url?.startsWith('https://');
                            if (isExternal) {
                                return (
                                    <a
                                        key={item.id}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 text-sm md:text-base font-semibold text-slate-500 hover:text-primary transition-colors duration-200 whitespace-nowrap"
                                    >
                                        {item.label}
                                    </a>
                                );
                            }
                            return (
                                <NavLink
                                    key={item.id}
                                    to={item.url}
                                    className={({ isActive }) => `px-3 py-1.5 text-sm md:text-base font-semibold transition-colors duration-200 whitespace-nowrap ${isActive ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-primary'} `}
                                >
                                    {item.label}
                                </NavLink>
                            );
                        })}
                    </nav>

                    <div className="flex-grow md:flex-grow-0 w-full md:w-auto min-w-[200px] md:min-w-0 flex items-center justify-end gap-2">
                        <button
                            onClick={handleBellClick}
                            className={`p-2 rounded-full transition-colors relative ${isSubscribed ? 'text-primary bg-blue-50' : 'text-slate-500 hover:text-primary hover:bg-slate-100'} `}
                            title={isSubscribed ? "Anda sudah berlangganan" : "Langganan Notifikasi"}
                        >
                            {isSubscribed ? (
                                // Solid Bell with Checkmark Badge for Subscribed
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                    </svg>
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
                                    </span>
                                </div>
                            ) : (
                                // Outline Bell for Not Subscribed
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            )}
                        </button>
                        <div className="relative flex-grow md:hidden">
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full pl-9 pr-9 py-1.5 bg-slate-100 border-none rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-400"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;
