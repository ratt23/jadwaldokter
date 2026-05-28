import React, { useState, useEffect } from 'react';
import { Search, X, Stethoscope, ChevronRight } from 'lucide-react';

const SpecialtySelectorModal = ({ isOpen, onClose, doctorsData, onSelectSpecialty, selectedSpecialty }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [visible, setVisible] = useState(false);

    // Smooth enter/exit transition trigger
    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Filter specialties list based on local search
    const filteredSpecialties = Object.entries(doctorsData).filter(([key, value]) => {
        return value.title.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleSelect = (key, data) => {
        onSelectSpecialty(key, data);
        handleClose();
    };

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300); // match transition speed
    };

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
                        <Stethoscope className="h-5 w-5 text-blue-200" />
                        <h3 className="text-lg font-bold font-sans">Pilih Spesialis</h3>
                    </div>
                    <button 
                        onClick={handleClose} 
                        className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari spesialis..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#01007f]/20 focus:border-[#01007f] placeholder:text-slate-400 font-sans"
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                </div>

                {/* Specialties List */}
                <div className="overflow-y-auto flex-grow px-3 py-2 bg-slate-50/20 max-h-[50vh]">
                    {/* All Specialties Option */}
                    <button
                        onClick={() => handleSelect(null, null)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 my-1 rounded-xl text-left transition-all ${!selectedSpecialty ? 'bg-blue-50 text-[#01007f] font-bold' : 'hover:bg-slate-100 text-slate-700 font-medium'}`}
                    >
                        <span className="text-sm font-sans">Semua Spesialis</span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${!selectedSpecialty ? 'text-[#01007f]' : 'text-slate-400'}`} />
                    </button>

                    {filteredSpecialties.length > 0 ? (
                        filteredSpecialties.map(([key, data]) => {
                            const isSelected = selectedSpecialty === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleSelect(key, data)}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 my-1 rounded-xl text-left transition-all ${isSelected ? 'bg-blue-50 text-[#01007f] font-bold' : 'hover:bg-slate-100 text-slate-700 font-medium'}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-sans">{data.title}</span>
                                        <span className="text-xs text-slate-400 font-normal mt-0.5">{data.doctors?.length || 0} Dokter</span>
                                    </div>
                                    <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'text-[#01007f]' : 'text-slate-400'}`} />
                                </button>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-sm font-sans">
                            Tidak ada spesialisasi yang cocok.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpecialtySelectorModal;
