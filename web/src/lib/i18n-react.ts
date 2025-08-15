// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import React from 'react';

// Import messages for internationalization
import enMessages from '../../messages/en.json';
import zhMessages from '../../messages/zh.json';

const messages = {
  en: enMessages,
  zh: zhMessages,
};

// Get locale from browser or default to 'en'
const getLocale = () => {
  if (typeof window !== 'undefined') {
    return navigator.language.split('-')[0] || 'en';
  }
  return 'en';
};

interface I18nContextType {
  locale: string;
  messages: any;
  t: (key: string) => string;
  setLocale: (locale: string) => void;
}

const I18nContext = React.createContext<I18nContextType | undefined>(undefined);

export const useTranslations = (namespace?: string) => {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslations must be used within an I18nProvider');
  }
  
  const { t, messages } = context;
  
  const translator = (key: string) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return t(fullKey);
  };
  
  // Add raw method to get the raw value without string conversion
  translator.raw = (key: string) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const keys = fullKey.split('.');
    let value: any = messages;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  };
  
  return translator;
};

export const useLocale = () => {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error('useLocale must be used within an I18nProvider');
  }
  return context.locale;
};

export const useSetLocale = () => {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error('useSetLocale must be used within an I18nProvider');
  }
  return context.setLocale;
};

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = React.useState(() => getLocale());
  
  const currentMessages = messages[locale as keyof typeof messages] || messages.en;
  
  const t = React.useCallback((key: string) => {
    const keys = key.split('.');
    let value: any = currentMessages;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  }, [currentMessages]);

  const setLocale = React.useCallback((newLocale: string) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=lax`;
    }
  }, []);

  const value = React.useMemo(() => ({
    locale,
    messages: currentMessages,
    t,
    setLocale,
  }), [locale, currentMessages, t, setLocale]);

  return React.createElement(I18nContext.Provider, { value }, children);
}
