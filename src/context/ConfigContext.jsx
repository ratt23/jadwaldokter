import React, { createContext, useContext } from 'react';
import { useStore } from '../store/useStore';

const ConfigContext = createContext();

export const useConfig = () => {
    return useStore((state) => state.config);
};

export const ConfigProvider = ({ children }) => {
    const config = useStore((state) => state.config);
    return (
        <ConfigContext.Provider value={config}>
            {children}
        </ConfigContext.Provider>
    );
};

