import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    bg: '#0c0414',
    card: '#160927',
    cardBorder: 'rgba(255, 0, 127, 0.25)',
    accent: '#ff007f',
    secondary: '#00f0ff',
    text: '#ffffff',
    subtext: '#a89bc0',
    navBg: 'rgba(16, 6, 33, 0.85)',
    glow: 'rgba(255, 0, 127, 0.35)',
    badgeBg: 'rgba(255, 0, 127, 0.15)',
  },
  matrix: {
    id: 'matrix',
    name: 'Matrix Neon',
    bg: '#040d06',
    card: '#091c0d',
    cardBorder: 'rgba(0, 255, 65, 0.25)',
    accent: '#00ff41',
    secondary: '#39ff14',
    text: '#e6ffe6',
    subtext: '#6ebd78',
    navBg: 'rgba(6, 20, 10, 0.85)',
    glow: 'rgba(0, 255, 65, 0.35)',
    badgeBg: 'rgba(0, 255, 65, 0.15)',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Dark',
    bg: '#0d1117',
    card: '#161b22',
    cardBorder: 'rgba(99, 102, 241, 0.25)',
    accent: '#6366f1',
    secondary: '#38bdf8',
    text: '#f0f6fc',
    subtext: '#8b949e',
    navBg: 'rgba(22, 27, 34, 0.85)',
    glow: 'rgba(99, 102, 241, 0.35)',
    badgeBg: 'rgba(99, 102, 241, 0.15)',
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Stealth',
    bg: '#12080a',
    card: '#1f0d11',
    cardBorder: 'rgba(239, 68, 68, 0.25)',
    accent: '#ef4444',
    secondary: '#f59e0b',
    text: '#fdf2f2',
    subtext: '#b98c92',
    navBg: 'rgba(28, 12, 16, 0.85)',
    glow: 'rgba(239, 68, 68, 0.35)',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
  },
  light: {
    id: 'light',
    name: 'Nordic Clean',
    bg: '#f1f5f9',
    card: '#ffffff',
    cardBorder: 'rgba(37, 99, 235, 0.2)',
    accent: '#2563eb',
    secondary: '#0284c7',
    text: '#0f172a',
    subtext: '#64748b',
    navBg: 'rgba(255, 255, 255, 0.9)',
    glow: 'rgba(37, 99, 235, 0.2)',
    badgeBg: 'rgba(37, 99, 235, 0.1)',
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('kryptic_theme') || 'cyberpunk';
  });

  const switchTheme = (themeKey) => {
    if (THEMES[themeKey]) {
      setCurrentTheme(themeKey);
      localStorage.setItem('kryptic_theme', themeKey);
    }
  };

  const theme = THEMES[currentTheme] || THEMES.cyberpunk;

  useEffect(() => {
    // Update theme meta color
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.bg);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, switchTheme, availableThemes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
