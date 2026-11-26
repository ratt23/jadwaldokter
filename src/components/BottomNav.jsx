import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
    { to: '/home', label: 'Home' },
    { to: '/mcu', label: 'MCU' },
    { to: '/homecare', label: 'Home Care' },
];

const BottomNav = () => {
    const location = useLocation();

    return (
        <footer className="fixed bottom-[50px] left-1/2 -translate-x-1/2 w-auto h-auto bg-[#01007f]/95 backdrop-blur-md flex justify-center items-center gap-1.5 p-1.5 rounded-full shadow-[0_12px_32px_rgba(1,0,127,0.28)] border border-white/15 z-[100] sm:bottom-[45px]">
            {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.to || (item.to === '/home' && location.pathname.startsWith('/jadwal-dokter'));
                return (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={`relative py-2 px-4 text-[0.85rem] font-semibold rounded-full no-underline transition-colors duration-200 whitespace-nowrap ${
                            isActive ? 'text-[#01007f] font-bold' : 'text-[#a9a8ff] hover:text-white'
                        }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="siloamBottomNavPill"
                                className="absolute inset-0 bg-white rounded-full shadow-sm"
                                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                            />
                        )}
                        <span className="relative z-10">{item.label}</span>
                    </NavLink>
                );
            })}
        </footer>
    );
};

export default BottomNav;
