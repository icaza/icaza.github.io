javascript:(() => {
  /**
   * SECURITY & OPTIMIZATION UPDATES:
   * - Replaced string += with array.push() + join()
   * - Added URL validation for relative URL conversion
   * - Added payload size limits
   * - Use HTTPS for generated links
   * - Sanitize URLs before injection
   */

  const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_DOMAINS = ['jstrieb.github.io', 'icaza.github.io'];

  /* Generate the b64 API functions */
  var b64 = (() => {
    /* Generate a dictionary with {key: val} as {character: index in input string} */
    function generateIndexDict(a) {
      let result = {};
      for (let i = 0; i < a.length; i++) {
        result[a[i]] = i;
      }
      return result;
    }

    /* Decode URL safe even though it is not the primary encoding mechanism */
    const _a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const _aRev = generateIndexDict(_a);
    _aRev["-"] = _aRev["+"];
    _aRev["_"] = _aRev["/"];

    const _enc = new TextEncoder("utf-8");
    const _dec = new TextDecoder("utf-8");

    return {
      /* Decode base64 to a string */
      encode: function(s) {
        return this.binaryToBase64(this.asciiToBinary(s));
      },

      /* Convert a string to a Uint8Array */
      asciiToBinary: function(text) {
        return _enc.encode(text);
      },

      /* Return a base64-encoded string from a Uint8Array input */
      /* OPTIMIZATION: Use array + join instead of string += */
      binaryToBase64: function(originalBytes) {
        /* Pad the output array to a multiple of 3 bytes */
        let length = originalBytes.length;
        let added = (length % 3 == 0) ? 0 : (3 - length % 3);
        let bytes = new Uint8Array(length + added);
        bytes.set(originalBytes);

        let output = [];
        for (let i = 0; i < bytes.length; i += 3) {
          /*
          Convert 3 8-bit bytes into 4 6-bit indices and get a character from
          the master list based on each 6-bit index
             3 x 8-bit:  |------ --|---- ----|-- ------|
          => 4 x 6-bit:  |------|-- ----|---- --|------|
          */
          output.push(_a[ bytes[i] >>> 2 ]);
          output.push(_a[ ((bytes[i] & 0x3) << 4) | (bytes[i + 1] >>> 4) ]);
          output.push(_a[ ((bytes[i + 1] & 0xF) << 2) | (bytes[i + 2] >>> 6) ]);
          output.push(_a[ bytes[i + 2] & 0x3F ]);
        }

        /* Turn the final "A" characters into "=" depending on necessary padding */
        let result = output.join("");
        if (added > 0) {
          result = result.slice(0, -added) + ("=".repeat(added));
        }

        return result;
      },
    }
  })();

  /**
   * Validate and sanitize URLs
   */
  function isValidUrl(urlStr) {
    try {
      const url = new URL(urlStr);
      // Only allow http, https, data, and same-origin protocols
      return ['http:', 'https:', 'data:'].includes(url.protocol) ||
             url.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  /**
   * Safe URL assignment that validates protocol and origin
   */
  function safeSetUrl(element, attrName, url) {
    try {
      const resolvedUrl = new URL(url, document.baseURI).href;
      if (isValidUrl(resolvedUrl)) {
        element[attrName] = resolvedUrl;
      }
    } catch (err) {
      // Skip invalid URLs
      console.warn('Skipped invalid URL:', url);
    }
  }

  /* Generate the page -> base64 API functions */
  var api = {
    VERSION: "0.2.0",

    /* Return a link to view the page */
    getViewLink: function(pageData) {
      if (!pageData || pageData.length > MAX_PAYLOAD_SIZE) {
        throw new Error('Invalid or oversized payload');
      }

      var urlData = {
        version: this.VERSION,
        compressed: false,
        body: pageData,
      };

      const hashObject = b64.encode(JSON.stringify(urlData));
      // Use HTTPS instead of HTTP
      return `https://jstrieb.github.io/urlpages/#${hashObject}`;
    },
  };

  /* Replace all relative URLs with absolute ones (with validation) */
  try {
    Array.from(document.querySelectorAll("[src],[href]")).forEach(l => {
      if ("src" in l) {
        safeSetUrl(l, "src", l.src);
      } else if ("href" in l) {
        safeSetUrl(l, "href", l.href);
      }
    });
  } catch (err) {
    console.error('Error processing URLs:', err);
  }

  /* Redirect to the URL Page in a new tab */
  try {
    const html = document.documentElement.outerHTML;
    if (html.length > MAX_PAYLOAD_SIZE) {
      throw new Error('Page content exceeds maximum size limit');
    }
    window.open(api.getViewLink(html), "_blank");
  } catch (err) {
    alert('Error: ' + err.message);
  }
})();
