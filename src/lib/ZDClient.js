'use client';

// ZDClient.js
// A client wrapper around the Zendesk App Framework SDK (zendesk_app_framework_sdk)
// Provides a promise-based, race-free initialization and convenience methods
// for making requests and invoking Zendesk client actions from anywhere in a
// Next.js client-side environment.

let CLIENT = null;
let APP_CONTEXT = null;
let APP_SETTINGS = null;
let APP_METADATA = null;
let ZD_SUBDOMAIN = null;

// Holds the in-progress initialization promise so multiple callers share it
let initPromise = null;

const ZDClient = {
  /**
   * Initialize the Zendesk App Framework client.
   * This function is idempotent and safe to call multiple times. The first
   * caller will trigger a dynamic import of the SDK and initialize the client.
   * Subsequent callers will receive the same client (or await the same
   * initialization promise).
   *
   * @returns {Promise<Object|null>} Resolves with the initialized client or null if SSR.
   */
  async init() {
    if (typeof window === 'undefined') return null; // guard SSR

    // If client already initialized, return it immediately
    if (CLIENT) return CLIENT;

    // If initialization already in progress, return the existing promise
    if (initPromise) return initPromise;

    // Start initialization and cache the promise
    initPromise = (async () => {
      const { default: ZAFClient } = await import('zendesk_app_framework_sdk');
      CLIENT = await ZAFClient.init();

      // Set color scheme from settings
      CLIENT.on('colorScheme.changed', (colorScheme) => this.setAppTheme(colorScheme));
      return CLIENT;
    })();

    return initPromise;
  },

  /**
   * Ensure the client is available and return it. If the client isn't ready,
   * this function will call and await init().
   *
   * @returns {Promise<Object|null>} The initialized client instance.
   */
  async getClient() {
    if (!CLIENT) await this.init();
    return CLIENT;
  },

  events: {
    /**
     * Register a callback for the Zendesk `app.registered` event.
     * The callback will receive the registration `data` object. If the
     * client isn't ready yet, the caller should ensure init() is awaited
     * first so that CLIENT.on is available.
     *
     * @param {Function} cb - callback to run when the app registers
     * @returns {Function|undefined} The event unbind function (if available).
     */
    ON_APP_REGISTERED(cb) {
      if (!CLIENT) return;
      return CLIENT.on('app.registered', async (data) => {
        APP_CONTEXT = data.context;
        APP_SETTINGS = data.metadata?.settings;
        APP_METADATA = data.metadata;
        ZD_SUBDOMAIN = APP_CONTEXT?.account?.subdomain;
        return cb(data);
      });
    },
  },

  // -------- app getters (read-only) --------
  app: {
    /** @returns {Object|null} */
    get settings() {
      return APP_SETTINGS;
    },

    /** @returns {Object|null} */
    get context() {
      return APP_CONTEXT;
    },

    /** @returns {Object|null} */
    get metadata() {
      return APP_METADATA;
    },

    /** @returns {string|null} */
    get subdomain() {
      return ZD_SUBDOMAIN;
    },

    /**
     * Returns true if the app settings indicate a production installation.
     * Uses the `IS_PRODUCTION` setting key (adjust name to match your setting).
     * @returns {boolean}
     */
    get isProduction() {
      return !!this.settings?.['IS_PRODUCTION'];
    },
  },

  /**
   * Sets a "data-theme" attribute on the html tag
   * @param {String} base
   */
  setAppTheme(base) {
    document.documentElement.classList.remove('light', 'dark', 'contrast');
    document.documentElement.classList.add(base);
  },

  // -------- core helper methods that ensure initialization --------
  /**
   * Generic wrapper around CLIENT.request(). Ensures client is initialized
   * before calling request.
   *
   * @param {string} url - request URL
   * @param {Object|string} data - request body or payload
   * @param {Object} options - extra options to merge into the request
   * @returns {Promise<any>} Zendesk request response
   */
  async request(url, data, options = {}) {
    const client = await this.getClient();
    return client.request({
      url,
      data,
      secure: false,
      contentType: 'application/json',
      cache: true,
      ...options,
    });
  },

  /**
   * Wrapper around CLIENT.get(). Ensures client is initialized.
   * @param {string} getter
   * @returns {Promise<any>} The value for the requested key
   */
  async get(getter) {
    const client = await this.getClient();
    return (await client.get(getter))[getter];
  },

  /**
   * Get app params from the apps parent context.
   * @returns {Promise<any>} The value for the requested key
   */
  async appParams() {
    const client = await this.getClient();
    return APP_CONTEXT?.appParams || {};
  },

  /**
   * Resize the Zendesk iframe to `appHeight` pixels. If appHeight is not
   * provided, default to 80.
   *
   * @param {number} appHeight
   */
  async resizeFrame(appHeight = 80) {
    const client = await this.getClient();
    client.invoke('resize', { width: '100%', height: `${appHeight}px` });
  },

  /**
   * Open a user tab in the agent interface for a given requesterId.
   * @param {string|number} requesterId
   * @returns {Promise<any>}
   */
  async openUserTab(requesterId) {
    const client = await this.getClient();
    return client.invoke('routeTo', 'user', requesterId);
  },

  /**
   * Open a ticket tab in the agent interface for a given ticketId.
   * @param {string|number} ticketId
   * @returns {Promise<any>}
   */
  async openTicketTab(ticketId) {
    const client = await this.getClient();
    return client.invoke('routeTo', 'ticket', ticketId);
  },

  // -------- ZIS-specific convenience APIs --------
  /**
   * Get the list of ZIS integrations.
   * @returns {Promise<any>}
   */
  getIntegrations() {
    return this.request(`/api/services/zis/registry/integrations`, {}, { method: 'GET' });
  },

  /**
   * Get ZIS configs for a given integrationKey.
   * @param {string} integrationKey
   * @returns {Promise<any>}
   */
  getZisConfigApi(integrationKey) {
    return this.request(
      `/api/services/zis/integrations/${integrationKey}/configs?filter[scope]=${integrationKey}_settings`,
      {},
      { method: 'GET' }
    );
  },

  /**
   * Create ZIS configs for a given integrationKey with the provided payload.
   * @param {Object} payload
   * @param {string} integrationKey
   * @returns {Promise<any>}
   */
  createZisConfigApi(payload, integrationKey) {
    return this.request(`/api/services/zis/integrations/${integrationKey}/configs`, JSON.stringify(payload), {
      method: 'POST',
    });
  },

  /**
   * Update ZIS configs for a given integrationKey with the provided payload.
   * @param {Object} payload
   * @param {string} integrationKey
   * @returns {Promise<any>}
   */
  updateZisConfigApi(payload, integrationKey) {
    return this.request(
      `/api/services/zis/integrations/${integrationKey}/configs/${integrationKey}_settings`,
      JSON.stringify(payload),
      { method: 'PUT' }
    );
  },

  /**
   * Get bundle UUIDs for a given integrationKey.
   * @param {string} integrationKey
   * @returns {Promise<any>}
   */
  getBundleUUID(integrationKey) {
    return this.request(`/api/services/zis/registry/${integrationKey}/bundles`, {}, { method: 'GET' });
  },

  /**
   * Get a specific bundle by integrationKey and uuid.
   * @param {string} integrationKey
   * @param {string} uuid
   * @returns {Promise<any>}
   */
  getBundle(integrationKey, uuid) {
    return this.request(`/api/services/zis/registry/${integrationKey}/bundles/${uuid}`, {}, { method: 'GET' });
  },

  /**
   * Generate new integration token for a given integrationId.
   * @param {string} integrationId
   * @returns {Promise<any>}
   */
  generateNewIntegrationToken(integrationId) {
    return this.request(
      `/api/v2/oauth/clients/${integrationId}/generate_secret`,
      {},
      {
        method: 'PUT',
      }
    );
  },

  /**
   * Create a new integration for a given integrationKey with the provided payload.
   * @param {string} integrationKey
   * @param {Object} payload
   * @returns {Promise<any>}
   */
  createIntegration(integrationKey, payload) {
    return this.request(`/api/services/zis/registry/${integrationKey}`, JSON.stringify(payload), { method: 'POST' });
  },

  /**
   * Create a new bearer token for a given integrationKey with the provided payload.
   * @param {Object} payload
   * @returns {Promise<any>}
   */
  createBearerToken(payload) {
    return this.request(`/api/v2/oauth/tokens.json`, JSON.stringify(payload), { method: 'POST' });
  },

  /**
   * Create a oauth client for a given integrationKey with the provided payload.
   * @param {string} integrationKey
   * @param {string} token
   * @param {Object} payload
   * @returns {Promise<any>}
   */
  createOauthClient(integrationKey, token, payload) {
    return this.request(`/api/services/zis/connections/oauth/clients/${integrationKey}`, JSON.stringify(payload), {
      method: 'POST',
    });
  },

  /**
   * Create start oauth process for a given integrationKey with the provided payload.
   * @param {string} integrationKey
   * @param {string} token
   * @param {Object} payload
   * @returns {Promise<any>}
   */
  startOauthFlow(integrationKey, token, payload) {
    return this.request(`/api/services/zis/connections/oauth/start/${integrationKey}`, JSON.stringify(payload), {
      method: 'POST',
    });
  },

  /**
   * Create/Save Bundle for a given integrationKey with the provided payload.
   * @param {string} integrationKey
   * @param {Object} payload
   * @returns {Promise<any>}
   */
  saveBundle(integrationKey, payload) {
    return this.request(`/api/services/zis/registry/${integrationKey}/bundles`, JSON.stringify(payload), {
      method: 'POST',
    });
  },

  /**
   * Installs the bundle associated with the workflow
   * @param {string} integrationKey
   * @param {string} jobspecName
   * @param {Object} payload
   * @returns {Promise<any>}
   */
  installBundle(integrationKey, jobspecName) {
    return this.request(
      `/api/services/zis/registry/job_specs/install?job_spec_name=zis:${integrationKey}:job_spec:${jobspecName}`,
      {},
      {
        method: 'POST',
      }
    );
  },

  /**
   * List job specs for given integrationKey.
   * @param {string} integrationKey
   * @returns {Promise<any>}
   */
  listJobSpecs(integrationKey) {
    return this.request(`/api/services/zis/registry/${integrationKey}/job_specs`, {}, { method: 'GET' });
  },

  /**
   * Uninstall the bundle associated with the workflow
   * @param {string} integrationKey
   * @param {string} jobspecName
   * @returns {Promise<any>}
   */
  uninstallBundle(integrationKey, jobspecName) {
    return this.request(
      `/api/services/zis/registry/job_specs/install?job_spec_name=zis:${integrationKey}:job_spec:${jobspecName}`,
      {},
      {
        method: 'DELETE',
      }
    );
  },

  /**
   * Generate Webhook URL for a given integrationKey.
   * @param {string} integrationKey
   * @param {Object} payload
   * @param {string} fullToken
   * @returns {Promise<any>}
   */
  createInboundWebhook(integrationKey, payload, fullToken) {
    return this.request(`/api/services/zis/inbound_webhooks/generic/${integrationKey}`, JSON.stringify(payload), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fullToken}`,
      },
    });
  },

  /**
   * Get ticket fields
   * @returns {Promise<any>}
   */
  getTicketFields() {
    return this.request(
      `/api/v2/ticket_fields.json`,
      {},
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  /**
   * Get user fields
   * @returns {Promise<any>}
   */
  getUserFields() {
    return this.request(
      `/api/v2/user_fields.json`,
      {},
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  /**
   * Get organization fields
   * @returns {Promise<any>}
   */
  getOrganizationFields() {
    return this.request(
      `/api/v2/organization_fields.json`,
      {},
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },
};

export default ZDClient;
