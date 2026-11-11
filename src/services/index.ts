/**
 * The app's data layer. UI code imports from here only.
 *
 * Today every service reads and writes browser storage (localStorage + IndexedDB) as a mock database.
 * To connect Supabase later, re-implement these modules with the same function names and return types;
 * pages and components do not need to change.
 */
export * as authService from './authService';
export * as adminService from './adminService';
export * as shopService from './shopService';
export * as publicService from './publicService';
export { ServiceError, toServiceError } from './errors';
export { onDbChange } from './storage/localDb';
export { resetDemoData, DEMO_ACCOUNTS } from './seed';
