import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar } from 'lucide-react';

const DateSelectorModal = ({ isOpen, onClose, onSelectDate, selectedDate }) => {
    const [visible, setVisible] = useState(false);

    // Smooth enter/exit transition trigger
    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    // Generate list of next 14 days
    const datesList = useMemo(() => {
        const list = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + i);
            list.push(nextDate);
        }
        return list;
    }, []);

    if (!isOpen) return null;

    const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const indonesianMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const isSameDay = (date1, date2) => {
        if (!date1 || !date2) return false;
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    const handleSelect = (date) => {
        onSelectDate(date);
        handleClose();
    };

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300); // match transition speed
    };

    const todayDate = new Date();

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleClose}
        >
            <div 
                className={`bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] transition-transform duration-300 ${visible ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:scale-95'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-[#01007f] text-white">
                    <div className="flex items-center gap-2.5">
                        <Calendar className="h-5 w-5 text-blue-200" />
                        <h3 className="text-lg font-bold font-sans">Pilih Tanggal</h3>
                    </div>
                    <button 
                        onClick={handleClose} 
                        className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Dates List Container */}
                <div className="overflow-y-auto flex-grow p-4 bg-slate-50 max-h-[50vh]">
                    {/* Semua Hari Option */}
                    <button
                        onClick={() => handleSelect(null)}
                        className={`w-full flex items-center justify-center gap-2 py-3 mb-3.5 rounded-2xl border font-bold text-sm font-sans active:scale-98 transition-all ${
                            !selectedDate 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-250' 
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs'
                        }`}
                    >
                        <Calendar className="h-4 w-4" />
                        <span>Semua Hari</span>
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        {datesList.map((date, idx) => {
                            const isSelected = isSameDay(date, selectedDate);
                            const isToday = isSameDay(date, todayDate);
                            const dayName = indonesianDays[date.getDay()];
                            const monthName = indonesianMonths[date.getMonth()];
                            const dateNum = date.getDate();

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(date)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all relative ${
                                        isSelected 
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' 
                                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs'
                                    }`}
                                >
                                    {isToday && (
                                        <span className={`absolute top-1.5 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full leading-none tracking-wide ${
                                            isSelected ? 'bg-white text-blue-600' : 'bg-[#01007f] text-white'
                                        }`}>
                                            HARI INI
                                        </span>
                                    )}
                                    <span className={`text-xs font-bold font-sans tracking-wide uppercase ${
                                        isSelected ? 'text-blue-100' : 'text-slate-400'
                                    }`}>
                                        {dayName}
                                    </span>
                                    <span className="text-2xl font-extrabold font-sans my-1.5">
                                        {dateNum}
                                    </span>
                                    <span className={`text-[11px] font-semibold font-sans ${
                                        isSelected ? 'text-blue-100' : 'text-slate-500'
                                    }`}>
                                        {monthName}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DateSelectorModal;
