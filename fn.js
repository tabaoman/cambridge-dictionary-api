const request = require('request-promise').defaults({ encoding: null });

const fn = {
  a2b64: async (url) => {
    try {
      const data = await request.get(url);
      const b64 = btoa(String.fromCharCode(...new Uint8Array(data)));
      return 'data:audio/mpeg;base64,' + b64;
    } catch (err) { }
    return url
  }
}

module.exports = fn;