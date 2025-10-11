export interface CookieConsent {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'cookie-consent';

export function getCookieConsent(): CookieConsent | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return parsed as CookieConsent;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
}

export function setCookieConsent(consent: Omit<CookieConsent, 'timestamp'>): void {
  try {
    const consentWithTimestamp: CookieConsent = {
      ...consent,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentWithTimestamp));
  } catch (error) {
    console.error('Error saving cookie consent:', error);
  }
}

export function hasUserMadeChoice(): boolean {
  return getCookieConsent() !== null;
}

export function acceptAllCookies(): void {
  setCookieConsent({
    essential: true,
    analytics: true,
    marketing: true,
  });
}

export function rejectOptionalCookies(): void {
  setCookieConsent({
    essential: true,
    analytics: false,
    marketing: false,
  });
}
