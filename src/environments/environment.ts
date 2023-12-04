// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  CORE_URL: 'http://localhost:3002',
  CASH_URL: 'http://localhost:3004',
  AUTH_URL: 'http://localhost:3005',
  CUSTOMER_URL: 'http://localhost:3006',
  BOOKKEEPING_URL: 'http://localhost:3007',
  BACKUP_URL: 'http://localhost:3008',
  ORGANIZATION_URL: 'http://localhost:3001',
  LOG_URL: 'http://localhost:3003',
  WEBSITE_URL: 'http://localhost:3010',
  FISKALY_URL: 'http://localhost:3020',
  apiBasePath: 'http://localhost',
  apiURL: 'http://localhost:3000',
  oldPlatformUrl: `http://localhost:3000/`, // https://kassa.prismanote.com,
  fiskalyURL: 'https://kassensichv-middleware.fiskaly.com/api/v2',
  indexedDBName: 'prismaNote'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
