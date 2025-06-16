
export const LOCAL_STORAGE_KEYS = {
  PATIENTS: 'triful_arogya_niketan_patients',
  VISITS: 'triful_arogya_niketan_visits',
  PRESCRIPTIONS: 'triful_arogya_niketan_prescriptions',
  PAYMENT_SLIPS: 'triful_arogya_niketan_payment_slips',
  SETTINGS: 'triful_arogya_niketan_settings',
};

export const ROUTES = {
  DASHBOARD: '/dashboard',
  PATIENT_ENTRY: '/entry',
  PATIENT_SEARCH: '/search',
  DAILY_REPORT: '/report',
  SLIP_SEARCH: '/slip',
  DICTIONARY: '/dictionary',
  PRESCRIPTION: '/prescription',
  CLINIC_INFORMATION: '/clinic-information',
  APP_SETTINGS: '/settings',
  AI_SUMMARY: '/ai-summary',
  MEDICINE_INSTRUCTIONS: '/medicine-instructions',
  STORE_MANAGEMENT: '/store-management',
  PERSONAL_EXPENSES: '/personal-expenses',
  LOGIN: '/login', // Added LOGIN route
};

export const APP_NAME = 'ত্রিফুল আরোগ্য নিকেতন';
export const APP_VERSION = '1.1.1';

export const BENGALI_ALPHABET_FULL = [
  'অ', 'আ', 'ই', 'ঈ', 'উ', 'ঊ', 'ঋ', 'এ', 'ঐ', 'ও', 'ঔ',
  'ক', 'খ', 'গ', 'ঘ', 'ঙ',
  'চ', 'ছ', 'জ', 'ঝ', 'ঞ',
  'ট', 'ঠ', 'ড', 'ঢ', 'ণ',
  'ত', 'থ', 'দ', 'ধ', 'ন',
  'প', 'ফ', 'ব', 'ভ', 'ম',
  'য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ',
  'ড়', 'ঢ়', 'য়', 'ৎ', 'ং', 'ঃ', 'ঁ'
];

export const BENGALI_VOWELS_FOR_FILTER = ['সব', 'অ', 'আ', 'ই', 'ঈ', 'উ', 'ঊ', 'ঋ', 'এ', 'ঐ', 'ও', 'ঔ'];
export const BENGALI_CONSONANTS_FOR_FILTER = [
  'ক', 'খ', 'গ', 'ঘ', 'ঙ',
  'চ', 'ছ', 'জ', 'ঝ', 'ঞ',
  'ট', 'ঠ', 'ড', 'ঢ', 'ণ',
  'ত', 'থ', 'দ', 'ধ', 'ন',
  'প', 'ফ', 'ব', 'ভ', 'ম',
  'য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ',
  'ড়', 'ঢ়', 'য়'
];
