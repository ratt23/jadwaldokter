import React from 'react';
import { useConfig } from '../context/ConfigContext';

const Footer = () => {
    const config = useConfig();
    return (
        <footer className="fixed bottom-0 left-0 w-full bg-primary text-white z-40 py-2.5 font-['Inter'] text-xs shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
            <div className="max-w-[1200px] mx-auto px-6 flex justify-center items-center text-center">
                <div className="opacity-90">
                    <p>&copy; {new Date().getFullYear()} <b>{config.hospitalShortName || 'Healthcare Provider'}</b>. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
