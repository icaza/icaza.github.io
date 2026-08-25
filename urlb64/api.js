/**
 * api.js
 *
 * API For encoding and decoding URL hash objects
 *
 * Created by Jacob Strieb
 * July 2020
 * Updated: HTTPS protocol and input validation
 */


/*******************************************************************************
 * Global Variables
 ******************************************************************************/

const LATEST_API_VERSION = "0.2.0";
const ALLOWED_DOMAINS = ['jstrieb.github.io', 'icaza.github.io'];
const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB

var apiVersions = {};



/*******************************************************************************
 * Utility Functions
 ******************************************************************************/

/**
 * Validate URL protocol and domain
 */
function validateUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    // Ensure HTTPS or same-origin
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return false;
    }
    // Validate domain is in whitelist
    return ALLOWED_DOMAINS.some(domain => url.hostname.endsWith(domain));
  } catch (err) {
    return false;
  }
}

/**
 * Validate payload size
 */
function validatePayloadSize(data) {
  if (typeof data === 'string' && data.length > MAX_PAYLOAD_SIZE) {
    throw new Error('Payload exceeds maximum size limit');
  }
  return true;
}



/*******************************************************************************
 * API Version 0.2.0 (Latest)
 ******************************************************************************/

apiVersions["0.2.0"] = {

  VERSION: "0.2.0",

  /* Return a link to view the page */
  getViewLink: function(pageData) {
    validatePayloadSize(pageData);
    
    var urlData = {
      version: this.VERSION,
      compressed: false,
      body: pageData,
    };

    const hashObject = b64.encode(JSON.stringify(urlData));
    // Use HTTPS instead of HTTP
    return `https://jstrieb.github.io/urlpages/#${hashObject}`;
  },

  /* Return the page data from the object */
  decode: function(urlData) {
    if (!urlData || typeof urlData !== 'object') {
      throw new Error('Invalid URL data object');
    }
    if (!urlData.body) {
      throw new Error('Missing body field in URL data');
    }
    return urlData.body;
  },

}



/*******************************************************************************
 * API Version 0.0.1 (Original)
 ******************************************************************************/

apiVersions["0.0.1"] = {

  VERSION: "0.0.1",

  /* Return a link to view the page */
  getViewLink: function(pageData) {
    validatePayloadSize(pageData);
    // Use HTTPS instead of HTTP
    return `https://jstrieb.github.io/urlpages/#${b64.encode(pageData)}`;
  },

}
