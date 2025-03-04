/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type TableStyle = 'regular'|'grouped';

interface AppContextProps {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  toggleTheme: () => void;
  
  tableStyle: TableStyle;
  setTableStyle: React.Dispatch<React.SetStateAction<TableStyle>>;
  toggleTableStyle: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  //#region Theme
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme as Theme;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  //#endregion

  //#region Table Style
  const [tableStyle, setTableStyle] = useState<TableStyle>(() => {
    const savedTableStyle = localStorage.getItem('tableStyle');
    if (savedTableStyle) {
      return savedTableStyle as TableStyle;
    }
    return 'regular';
  });

  const toggleTableStyle = () => {
    setTableStyle((prevTableStyle) => (prevTableStyle === 'regular' ? 'grouped' : 'regular'));
  }

  useEffect(() => {
    localStorage.setItem('tableStyle', tableStyle);
  }, [tableStyle]);
  //#endregion

  return (
    <AppContext.Provider value={{ theme, setTheme, toggleTheme, tableStyle, setTableStyle, toggleTableStyle }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within a AppProvider');
  }
  return context;
};