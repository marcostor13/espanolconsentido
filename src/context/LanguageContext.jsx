import React, { createContext, useState, useContext } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // La página siempre carga en inglés por defecto; el cambio de idioma
  // solo aplica para la sesión actual (no se recuerda entre visitas).
  const [language, setLanguage] = useState('en');

  const toggleLanguage = (lang) => {
    setLanguage(lang);
  };

  const t = (path) => {
    return path.split('.').reduce((obj, key) => (obj && obj[key] ? obj[key] : null), translations[language]) || path;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  return useContext(LanguageContext);
};
