/**
 * Messenger and phone contacts used by the on-page CTA (SmartCta, StickyCtaBar) and by
 * FormHandler's relay, which hands an undelivered lead to WhatsApp / email.
 *
 * The popup, live-chat and floating-contacts widgets this file once configured were
 * rejected by the client (docs/12) and deleted; their config went with them. Restore
 * them from git history if they are ever re-approved.
 */
export const conversionConfig = {
  contacts: {
    phone: '+998557050705',
    phoneDisplay: '+998 55 705 0 705',
    telegramManager: 'https://t.me/sofexpomgr',
    whatsapp: 'https://wa.me/998557050705',
    email: 'info@sofexpo.uz',
  },
} as const;
