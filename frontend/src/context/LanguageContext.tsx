// src/context/LanguageContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

interface LanguageContextProps {
  lang: string;
  translations: Record<string, string>;
  changeLanguage: (lang: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextProps>({
  lang: 'en',
  translations: {},
  changeLanguage: async () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const loadLanguage = async (lang: string) => {
    try {
      const response = await axios.get( import.meta.env.VITE_API_BASE_URL + `/translations/${lang}`);
      const data = response.data;
      setLang(lang);
      setTranslations(data);
      localStorage.setItem('xintra-lang', lang);
      localStorage.setItem('xintra-translations', JSON.stringify(data));
    } catch (error) {
      console.error('Language loading failed:', error);
    }
  };

  const changeLanguage = async (newLang: string) => {
    try {
      await loadLanguage(newLang);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('xintra-lang') || 'en';
    const savedTranslations = localStorage.getItem('xintra-translations');

    if (savedTranslations) {
      setLang(savedLang);
      setTranslations(JSON.parse(savedTranslations));
    } else {
      loadLanguage(savedLang);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, translations, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
