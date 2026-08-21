import React, { useState, useEffect, useRef } from 'react';

const DoctorTickerBanner = ({
    items = [],
    badgeText = 'CUTI',
    type = 'leave', // 'leave' | 'update'
    renderItem,
    onClick
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const timerRef = useRef(null);

    // Reset index if items length changes
    useEffect(() => {
        if (currentIndex >= items.length) {
            setCurrentIndex(0);
        }
    }, [items.length]);

    const currentItem = items[currentIndex];

    useEffect(() => {
        if (!items || items.length === 0) return;

        if (timerRef.current) clearTimeout(timerRef.current);

        const checkAndSchedule = () => {
            if (!containerRef.current || !textRef.current) return;

            const contW = containerRef.current.clientWidth;
            const textW = textRef.current.scrollWidth;
            const overflow = textW - contW;

            if (overflow > 4 && items.length > 0) {
                // Duration based on overflow distance (smooth readable speed ~25-30px/s)
                const scrollSeconds = Math.max(3.5, overflow / 26);
                const pauseStart = 1.8;
                const pauseEnd = 2.2;
                const totalSeconds = pauseStart + scrollSeconds + pauseEnd + scrollSeconds + 0.8;

                if (textRef.current) {
                    textRef.current.style.setProperty('--scroll-dist', `-${overflow + 8}px`);
                    textRef.current.style.animation = `marquee-sequence ${totalSeconds}s ease-in-out forwards`;
                }

                if (items.length > 1) {
                    timerRef.current = setTimeout(() => {
                        nextItem();
                    }, totalSeconds * 1000);
                }
            } else {
                // Fits without overflow
                if (textRef.current) {
                    textRef.current.style.animation = 'none';
                    textRef.current.style.transform = 'translateX(0)';
                }

                if (items.length > 1) {
                    timerRef.current = setTimeout(() => {
                        nextItem();
                    }, 4500);
                }
            }
        };

        const nextItem = () => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % items.length);
                setIsAnimating(false);
            }, 250);
        };

        const initTimer = setTimeout(checkAndSchedule, 80);

        return () => {
            clearTimeout(initTimer);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [currentIndex, items]);

    if (!items || items.length === 0) return null;

    const isLeave = type === 'leave';
    const bgClass = isLeave
        ? 'bg-red-50/70 border-red-150 text-red-800 hover:bg-red-100/70'
        : 'bg-emerald-50/70 border-emerald-150 text-emerald-800 hover:bg-emerald-100/70';
    const pingDotClass = isLeave ? 'bg-red-400' : 'bg-emerald-400';
    const dotClass = isLeave ? 'bg-red-500' : 'bg-emerald-500';
    const badgeClass = isLeave ? 'bg-red-200/60 text-red-700' : 'bg-emerald-200/60 text-emerald-700';

    return (
        <div
            className={`px-4 py-2.5 border rounded-2xl flex items-center gap-2 text-xs md:text-sm transition-all duration-300 font-sans font-semibold cursor-pointer active:scale-99 ${bgClass}`}
            onClick={onClick}
        >
            <span className="flex h-2 w-2 relative flex-shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingDotClass}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotClass}`}></span>
            </span>
            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider flex-shrink-0 leading-none ${badgeClass}`}>
                {badgeText}
            </span>
            <div ref={containerRef} className="relative h-5 overflow-hidden flex-1 flex items-center">
                <div
                    key={currentIndex}
                    ref={textRef}
                    className={`whitespace-nowrap inline-block transition-opacity duration-250 ${
                        isAnimating ? 'opacity-0' : 'opacity-100'
                    }`}
                >
                    {currentItem ? renderItem(currentItem) : '-'}
                </div>
            </div>
        </div>
    );
};

export default DoctorTickerBanner;
