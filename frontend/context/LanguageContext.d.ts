export interface LanguageContextValue {
  language: string;
  setLanguage: (code: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
}

export function LanguageProvider(props: {
  children: React.ReactNode;
}): React.JSX.Element;

export function useLanguage(): LanguageContextValue;

export function useLocalePath(): (href: string) => string;

export function stripLocale(pathname: string): string;
