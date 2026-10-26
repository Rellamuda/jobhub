/**
 * Disposable & Temporary Email Domain Blocklist
 * Blocks burner and throwaway email domains commonly used by automated bots
 * and spammers to bypass free tier quotas.
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  'tempmail.com',
  'temp-mail.org',
  'tempmail.net',
  'tempmailaddress.com',
  'tempail.com',
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'spam4.me',
  'yopmail.com',
  'yopmail.net',
  'yopmail.fr',
  'cool.fr.nf',
  'jetable.fr.nf',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'trash-mail.com',
  'throwawaymail.com',
  'fakeinbox.com',
  'burnermail.io',
  'dispostable.com',
  'mohmal.com',
  'crazymailing.com',
  'maildrop.cc',
  'getnada.com',
  'nada.ltd',
  'emailondeck.com',
  'fakemailgenerator.com',
  'mytemp.email',
  'generator.email',
  'inboxkitten.com',
  'tmpmail.org',
  'tmpmail.net',
  'harakirimail.com',
  'dropmail.me',
  'getairmail.com',
  'mytempemail.com',
  'instantemailaddress.com',
  'mintemail.com',
  'spamgourmet.com',
  'e4ward.com',
  'gishpuppy.com',
  'kasmail.com',
  'mailcatch.com',
  'spambox.us',
  'temporaryemail.net',
  'spamavert.com',
  'meltmail.com',
  'anonymbox.com',
  'binkmail.com',
  'bobmail.info',
  'chammy.info',
  'devnullmail.com',
  'letthemeatspam.com',
  'mailin8r.com',
  'mailinator2.com',
  'notmailinator.com',
  'reallymymail.com',
  'reconmail.com',
  'safetymail.info',
  'sendspamhere.com',
  'sogetthis.com',
  'spambooger.com',
  'spamherelots.com',
  'spamhereplease.com',
  'streetwisemail.com',
  'suremail.info',
  'thespamfocus.com',
  'tradermail.info',
  'veryrealemail.com',
  'zippymail.info',
]);

const SUSPICIOUS_SUBSTRINGS = [
  'tempmail',
  'disposable',
  'throwaway',
  'fakeinbox',
  'burnermail',
  '10minute',
  'trashmail',
  'spam4me',
];

/**
 * Validates that an email is not from a known disposable/burner email service.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;

  const domain = email.trim().toLowerCase().split('@')[1];
  if (!domain) return false;

  // Direct match
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return true;
  }

  // Check suspicious substrings
  return SUSPICIOUS_SUBSTRINGS.some((sub) => domain.includes(sub));
}
