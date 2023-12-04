const CORE_URL = 'https://core.e-orderportal.com';
const CASH_URL = 'https://cashregister.backend-retailgear.org';
const AUTH_URL = 'https://auth.e-orderportal.com';
const CUSTOMER_URL = 'https://customer.backend-retailgear.org';
const WEBSITE_URL = 'https://website.backend-retailgear.org';
const BOOKKEEPING_URL = 'https://bookkeeping.backend-retailgear.org';
const BACKUP_URL = 'https://backup.e-orderportal.com';
const ORGANIZATION_URL = 'https://organization.e-orderportal.com';
const LOG_URL = 'https://log.e-orderportal.com';
const FISKALY_URL = 'https://fiskaly.backend-retailgear.org';
const JEWELS_AND_WATCHES_URL = 'https://jewels.backend-retailgear.org';
const CRON_URL = 'https://cron.e-orderportal.com';
/* IF YOU ARE ADDING ANY URL HERE, then don't forgot add in CSP at below */

export const environment = {
  production: true,
  CORE_URL: CORE_URL,
  CRON_URL: CRON_URL,
  CASH_URL: CASH_URL,
  AUTH_URL: AUTH_URL,
  CUSTOMER_URL: CUSTOMER_URL,
  WEBSITE_URL: WEBSITE_URL,
  BOOKKEEPING_URL: BOOKKEEPING_URL,
  BACKUP_URL: BACKUP_URL,
  ORGANIZATION_URL: ORGANIZATION_URL,
  LOG_URL: LOG_URL,
  FISKALY_URL: FISKALY_URL,
  JEWELS_AND_WATCHES_URL: JEWELS_AND_WATCHES_URL,
  apiURL: 'https://prismanote.com',
  oldPlatformUrl: 'https://kassa.prismanote.com',
  fiskalyURL: 'https://kassensichv-middleware.fiskaly.com/api/v2',
  indexedDBName: 'indexedDB1',
  csp: `
    default-src 'self';
    img-src https://* 'self' data:;
    font-src 'self' https://fonts.gstatic.com;
    style-src 'self'  https://fonts.googleapis.com https://fonts.googleapis.com 'unsafe-inline';
    script-src 'self' https://s3.eu-central-1.amazonaws.com/directives-multiscreenplatform.com/ ${ORGANIZATION_URL};
    connect-src 'self' ${CORE_URL} ${CRON_URL} ${CASH_URL} ${AUTH_URL} ${CUSTOMER_URL} ${WEBSITE_URL} ${BOOKKEEPING_URL} ${BACKUP_URL} ${ORGANIZATION_URL} ${LOG_URL} ${FISKALY_URL};
    frame-src 'self' 
  `
};
