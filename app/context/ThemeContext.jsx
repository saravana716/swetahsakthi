import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext({
  isGold: true,
  setIsGold: () => {},
  isDarkMode: false,
  toggleDarkMode: () => {},
  themeColor: '#EAB308',
  theme: {
    background: '#FAFAF4',
    card: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#9CA3AF',
    border: '#F3F4F6',
    itemBg: '#FFFBF0',
    primary: '#EAB308',
    isDarkMode: false,
  }
});

export const ThemeProvider = ({ children }) => {
  const [isGold, setIsGold] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const themeColor = isGold ? '#EAB308' : '#A3B1C6';

  const theme = {
    background: isDarkMode ? '#121212' : '#FAFAF4',
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    textPrimary: isDarkMode ? '#F9FAFB' : '#1A1A1A',
    textSecondary: isDarkMode ? '#9CA3AF' : '#9CA3AF',
    border: isDarkMode ? '#333333' : '#F3F4F6',
    itemBg: isDarkMode ? '#2D2D2D' : '#FFFBF0',
    primary: themeColor,
    isDarkMode,
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{ isGold, setIsGold, isDarkMode, toggleDarkMode, themeColor, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
