const fs = require('node:fs').promises;
const path = require('path');
const request = require('request-promise').defaults({ encoding: null });

const dictMap = {
  en: "english",
  uk: "english",
  "en-cn": "english-chinese-simplified",
  "en-tw": "english-chinese-traditional"
};

const fn = {
  a2b64: async (url) => {
    try {
      const data = await request.get(url);
      const b64 = btoa(String.fromCharCode(...new Uint8Array(data)));
      return 'data:audio/mpeg;base64,' + b64;
    } catch (err) { }
    return url
  },
  dict: (d) => {
    return dictMap[d] || "english";
  },
  normResult: (res, param) => {
    if (param && param.b64) {
      res.pronunciation = res.pronunciation.map(p => ({ pos: p.pos, lang: p.lang, url: p.base64 }));
    } else {
      res.pronunciation = res.pronunciation.map(p => ({ pos: p.pos, lang: p.lang, url: p.url }));
    }
    return res;
  },
  tryWordFile: async (dict, word) => {
    let dir = '/tmp/cam-dict';
    try {
      const config = require('./config.json');
      dir = config.filePath;
    } catch (err) {
      //dir = path.join(process.cwd(), 'cam-dict');
    }
    word = word.replace(/\s/, '_').replace(/\//, '|') + '.json';
    const p = path.join(dir, dict, word);
    try {
      return await fs.readFile(p, {encoding: 'utf8'});
    } catch (err) {
      return null;
    }
  },
  saveWord: (dict, word, content) => {
    let dir = '/tmp/cam-dict';
    try {
      const config = require('./config.json');
      dir = config.filePath;
    } catch (err) {
      //dir = path.join(process.cwd(), 'cam-dict');
    }
    word = word.replace(/\s/, '_').replace(/\//, '|') + '.json';
    const p = path.join(dir, dict, word);
    fs.mkdir(path.dirname(p), { recursive: true }).then(() => {
      fs.writeFile(p, content);
    });
  }
}

module.exports = fn;