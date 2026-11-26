import React from 'react';
import { motion } from 'framer-motion';

const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className="mb-6 overflow-x-auto scrollbar-hide">
            <div className="inline-flex gap-1.5 min-w-max bg-slate-100/80 border border-black/[0.06] p-1.5 rounded-full mx-6">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`relative flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-colors duration-200 whitespace-nowrap ${
                                isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="siloamMcuTabPill"
                                    className="absolute inset-0 bg-gradient-to-r from-[#01007f] to-[#0c4a6e] rounded-full shadow-md shadow-[#01007f]/25"
                                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                                />
                            )}
                            <span className="relative z-10 text-base">{tab.icon}</span>
                            <span className="relative z-10">{tab.title}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TabNavigation;
