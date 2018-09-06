/**
 * Auth class that connects to a native app for authentication.
 */
import { Auth } from 'home-assistant-js-websocket';

const CALLBACK_SET_TOKEN = 'externalAuthSetToken';
const CALLBACK_REVOKE_TOKEN = 'externalAuthRevokeToken';

if (!window.externalApp && !window.webkit) {
  throw new Error('External auth requires either externalApp or webkit defined on Window object.');
}

function getMeth(name) {
  window.externalApp ?
      window.externalApp[name] :
      window.webkit.messageHandlers[name].postMessage;
}

export default class ExternalAuth extends Auth {
  constructor(hassUrl) {
    super();

    this.data = {
      hassUrl,
      access_token: '',
      // This will trigger connection to do a refresh right away
      expires: 0,
    };
  }

  async refreshAccessToken() {
    const responseProm = new Promise((resolve) => { window[CALLBACK_SET_TOKEN] = resolve; });

    // Allow promise to set resolve on window object.
    await 0;

    getMeth('getExternalAuth')({ callback: CALLBACK_SET_TOKEN });

    // Response we expect back:
    // {
    //   "access_token": "qwere",
    //   "expires_in": 1800
    // }
    const tokens = await responseProm;

    this.data.access_token = tokens.access_token;
    this.data.expires = (tokens.expires_in * 1000) + Date.now();
  }

  async revoke() {
    const responseProm = new Promise((resolve) => { window[CALLBACK_REVOKE_TOKEN] = resolve; });

    // Allow promise to set resolve on window object.
    await 0;

    getMeth('revokeExternalAuth')({ callback: CALLBACK_REVOKE_TOKEN });

    await responseProm;
  }
}
