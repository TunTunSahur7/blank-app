/**
 * Store and legal links. Fill APP_STORE_ID once App Store Connect assigns one
 * (App Information › Apple ID); until then sharing omits the link.
 */
export const APP_STORE_ID = '';

export const APP_STORE_URL = APP_STORE_ID ? `https://apps.apple.com/app/id${APP_STORE_ID}` : '';

/** Apple's standard EULA covers auto-renewing subscriptions unless you publish your own. */
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export const PRIVACY_URL = 'https://github.com/TunTunSahur7/blank-app/blob/main/habit-app/PRIVACY.md';

export const MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

/** Weeks of history a free member sees on a habit. */
export const FREE_HISTORY_WEEKS = 12;
