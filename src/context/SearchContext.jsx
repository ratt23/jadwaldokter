import React, { createContext, useContext } from 'react';
import { useStore } from '../store/useStore';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
    const searchQuery = useStore((state) => state.searchQuery);
    const setSearchQuery = useStore((state) => state.setSearchQuery);

    return (
        <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearchContext = () => {
    const searchQuery = useStore((state) => state.searchQuery);
    const setSearchQuery = useStore((state) => state.setSearchQuery);
    return { searchQuery, setSearchQuery };
};

