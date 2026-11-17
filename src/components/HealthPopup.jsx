import React, { useState, useEffect, useRef } from 'react';
import { getApiBaseUrl } from '../utils/apiConfig';
import { ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';

const DEFAULT_IG_DM = 'https://ig.me/m/siloamambon';
const DISMISS_STORAGE_KEY = 'shab_popup_dismissed_until';

// Instagram Brand Icon
const IconInstagram = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor"/>
    </svg>
);

const HealthPopup = () => {
    const [visible, setVisible] = useState(false);
    const [exists, setExists] = useState(false);
    const [slides, setSlides] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dontShowToday, setDontShowToday] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Touch swipe refs
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);

    const API_BASE_URL = getApiBaseUrl();

    useEffect(() => {
        const fetchAd = async () => {
            try {
                if (!API_BASE_URL) return;

                // Check 24-hour dismissal in localStorage
                const dismissedUntil = localStorage.getItem(DISMISS_STORAGE_KEY);
                if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
                    // Still within 24h dismissal period
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/popup-ad`);
                if (!response.ok) return;

                const data = await response.json();
                if (data.active === false) return;

                // Parse and normalize slides (support both array of objects and strings)
                let normalized = [];
                if (Array.isArray(data.images)) {
                    normalized = data.images.map((item, idx) => {
                        if (typeof item === 'string') {
                            return { url: item, link: DEFAULT_IG_DM, title: '' };
                        }
                        return {
                            url: item.url || item.image_url || '',
                            link: item.link || item.link_url || DEFAULT_IG_DM,
                            title: item.title || ''
                        };
                    }).filter(s => Boolean(s.url));
                } else if (data.image_url) {
                    normalized = [{ url: data.image_url, link: DEFAULT_IG_DM, title: '' }];
                }

                if (normalized.length > 0) {
                    setSlides(normalized);
                    setExists(true);
                    // Slight delay for smooth entrance
                    setTimeout(() => setVisible(true), 150);
                }
            } catch (err) {
                console.warn('[HealthPopup] Failed to load popup ad:', err);
            }
        };

        fetchAd();
    }, [API_BASE_URL]);

    // Auto-play carousel effect
    useEffect(() => {
        if (!exists || slides.length <= 1 || isPaused) return;

        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % slides.length);
        }, 4500);

        return () => clearInterval(timer);
    }, [exists, slides.length, isPaused]);

    const handleClose = () => {
        if (dontShowToday) {
            // Dismiss for 24 hours
            localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
        }
        setVisible(false);
        setTimeout(() => setExists(false), 300);
    };

    const nextSlide = () => {
        setCurrentIndex(prev => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
    };

    // Touch handlers for mobile swipe
    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
        setIsPaused(true);
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        setIsPaused(false);
        if (!touchStartX.current || !touchEndX.current) return;
        const distance = touchStartX.current - touchEndX.current;
        const isLeftSwipe = distance > 45;
        const isRightSwipe = distance < -45;

        if (isLeftSwipe && slides.length > 1) {
            nextSlide();
        } else if (isRightSwipe && slides.length > 1) {
            prevSlide();
        }

        touchStartX.current = null;
        touchEndX.current = null;
    };

    if (!exists || slides.length === 0) return null;

    const current = slides[currentIndex] || slides[0];
    const destinationLink = current.link || DEFAULT_IG_DM;

    return (
        <div 
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs transition-opacity duration-300 p-4 ${
                visible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={handleClose}
        >
            <div 
                className="w-full max-w-[340px] sm:max-w-[380px] relative animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center select-none"
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Floating Top Close Button */}
                <button
                    onClick={handleClose}
                    className="self-end mb-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-lg transition transform hover:scale-110 active:scale-95"
                    title="Tutup (Esc)"
                    aria-label="Tutup Banner"
                >
                    <X size={18} strokeWidth={2.5} />
                </button>

                {/* Main Card Container */}
                <div className="w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/60 flex flex-col">
                    {/* Clickable Image Banner */}
                    <a
                        href={destinationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative w-full aspect-[4/5] bg-slate-100 block overflow-hidden group cursor-pointer"
                        title={current.title ? `${current.title} - Klik untuk DM Instagram` : "Klik untuk kirim DM Instagram"}
                    >
                        <img
                            src={current.url}
                            alt={current.title || `Promosi ${currentIndex + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                if (slides.length === 1) handleClose();
                            }}
                        />

                        {/* Slide Indicator Dots inside image */}
                        {slides.length > 1 && (
                            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full z-10 pointer-events-auto">
                                {slides.map((_, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex(idx); }}
                                        className={`rounded-full transition-all ${
                                            idx === currentIndex 
                                                ? 'bg-white w-4 h-1.5' 
                                                : 'bg-white/50 w-1.5 h-1.5 hover:bg-white/80'
                                        }`}
                                        aria-label={`Ke slide ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Navigation Arrows for desktop hover */}
                        {slides.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevSlide(); }}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition backdrop-blur-xs z-10"
                                    aria-label="Slide sebelumnya"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextSlide(); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition backdrop-blur-xs z-10"
                                    aria-label="Slide berikutnya"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </>
                        )}
                    </a>

                    {/* Footer / Instagram DM Call to Action Button */}
                    <div className="p-3.5 bg-white flex flex-col items-center gap-2">
                        {current.title && (
                            <p className="text-xs font-bold text-slate-800 text-center truncate max-w-full">
                                {current.title}
                            </p>
                        )}

                        <a
                            href={destinationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-[0.98] transition tracking-wide uppercase"
                        >
                            <IconInstagram className="w-4 h-4" />
                            <span>Kirim DM di Instagram</span>
                            <ExternalLink size={13} className="opacity-80" />
                        </a>
                    </div>
                </div>

                {/* Dismiss Checklist (Jangan tampilkan lagi hari ini) */}
                <label className="mt-3 flex items-center gap-2 text-[11px] text-white/90 font-medium cursor-pointer bg-black/50 hover:bg-black/70 px-3 py-1.5 rounded-full backdrop-blur-xs transition select-none">
                    <input
                        type="checkbox"
                        checked={dontShowToday}
                        onChange={(e) => setDontShowToday(e.target.checked)}
                        className="rounded text-pink-600 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Jangan tampilkan lagi hari ini</span>
                </label>
            </div>
        </div>
    );
};

export default HealthPopup;
