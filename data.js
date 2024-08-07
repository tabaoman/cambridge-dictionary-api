const cheerio = require("cheerio");
const request = require("request");
const express = require("express");
const axios = require("axios");
const app = express();
const cors = require("cors");
const fn = require("./fn");

const fetchVerbs = (wiki) => {
  return new Promise((resolve, reject) => {
    axios
      .get(wiki)
      .then((response) => {
        const $$ = cheerio.load(response.data);
        const verb = $$("tr > td > p ").text();

        const lines = verb
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        const verbs = [];
        for (let i = 0; i < lines.length; i += 2) {
          if (verbs.includes({ type: lines[i], text: lines[i + 1] })) {
            break;
          }
          const type = lines[i];
          const text = lines[i + 1];
          if (type && text) {
            verbs.push({ id: verbs.length, type, text });
          } else {
            verbs.push();
          }
        }
        resolve(verbs);
      })
      .catch((error) => {
        resolve();
      });
  });
};

app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/api/suggest/:dict/:word", (req, res) => {
  const word = req.params.word;
  const url = `https://dictionary.cambridge.org/autocomplete/amp?dataset=${fn.dict(req.params.dict)}&q=${word}&__amp_source_origin=https%3A%2F%2Fdictionary.cambridge.org`;
  request(url, async (error, resp, html) => {
    if (error || resp.statusCode !== 200) return;
    res.status(200).json(JSON.parse(html).map(w => w.word));
  });
});

app.get("/api/dictionary/:dict/:word", async (req, res, next) => {
  const b64 = req.query.hasOwnProperty('b') || req.query.hasOwnProperty('b64');
  const entry = req.params.word;
  const dict = fn.dict(req.params.dict);
  const lang = req.params.dict === "uk" ? "uk" : "us";

  // Try cache
  const cache = await fn.tryWordFile(fn.dictKey(req.params.dict), entry);
  if (cache) {
    res.status(200).json(fn.normResult(JSON.parse(cache), { b64 }));
    return;
  }

  const url = `https://dictionary.cambridge.org/${lang}/dictionary/${dict}/${entry}`;
  request(url, async (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html);
      const siteurl = "https://dictionary.cambridge.org";
      const wiki = `https://simple.wiktionary.org/wiki/${entry}`;

      // get verbs

      const verbs = await fetchVerbs(wiki);

      // basic

      const word = $(".hw.dhw").first().text();
      const getPos = $(".pos.dpos") // part of speech
        .map((index, element) => {
          return $(element).text();
        })
        .get();
      const pos = getPos.filter(
        (item, index) => getPos.indexOf(item) === index,
      );

      // Phonetics audios
      const audio = [];
      for (const s of $(".pos-header.dpos-h")) {
        const posNode = s.childNodes.find(c => c.attribs && c.attribs.class && c.attribs.class.includes('dpos-g'));
        if (!posNode || posNode.childNodes.length === 0) continue;
        const p = $(posNode.childNodes[0]).text();
        const nodes = s.childNodes.filter(c => c.name === 'span' && c.attribs && c.attribs.class && c.attribs.class.includes('dpron-i'));
        if (nodes.length === 0) continue;
        for (const node of nodes) {
          if (node.childNodes.length < 3) continue;
          const l = $(node.childNodes[0]).text();
          const aud = node.childNodes[1].childNodes.find(c => c.name === 'audio');
          if (!aud) continue;
          const src = aud.childNodes.find(c => c.name === 'source');
          if (!src) continue;
          const url = siteurl + $(src).attr('src');
          const pron = $(node.childNodes[2]).text();
          audio.push({pos: p, lang: l, base64: await fn.a2b64(url), url: url, pron: pron});
        }
      }

      // definition & example
      const exampleCount = $(".def-body.ddef_b")
        .map((index, element) => {
          const exampleElements = $(element).find(".examp.dexamp");
          return exampleElements.length;
        })
        .get();
      for (let i = 0; i < exampleCount.length; i++) {
        if (i == 0) {
          exampleCount[i] = exampleCount[i];
        } else {
          exampleCount[i] = exampleCount[i] + exampleCount[i - 1];
        }
      }

      const exampletrans = $(
        ".examp.dexamp > .trans.dtrans.dtrans-se.hdb.break-cj",
      ); // translation of the example
      const example = $(".examp.dexamp > .eg.deg")
        .map((index, element) => {
          return {
            id: index,
            text: $(element).text(),
            translation: exampletrans.eq(index).text(),
          };
        })
        .get();

      const definitiontrans = $(
        ".def-body.ddef_b > .trans.dtrans.dtrans-se.break-cj",
      );

      const source = (element) => {
        const defElement = $(element);
        const parentElement = defElement.closest(".pr.dictionary");
        const dataId = parentElement.attr("data-id");
        return dataId;
      };

      const defPos = (element) => {
        const defElement = $(element);
        const partOfSpeech = defElement
          .closest(".pr.entry-body__el")
          .find(".pos.dpos")
          .first()
          .text(); // Get the part of speech
        return partOfSpeech;
      };

      // translation of the definition
      let offset = 0;
      const definition = $(".def.ddef_d.db")
        .map((index, element) => {
          const parentPhraseBlock = $(element).closest(
            ".pr.phrase-block.dphrase-block",
          );
          if (parentPhraseBlock.length > 0) {
            offset++;
            return;
          } else {
            return {
              id: index,
              pos: defPos(element), // TODO: Implement defPos function
              source: source(element), // TODO: Implement source function
              text: $(element).text(),
              translation: definitiontrans.eq(index - offset).text(),
              example: example.slice(
                exampleCount[index - 1],
                exampleCount[index],
              ),
            };
          }
        })
        .get();

      // api response

      if (word === "") {
        res.status(404).json({
          error: "word not found",
        });
      } else {
        const json = {
          word: word,
          pos: pos,
          verbs: verbs,
          pronunciation: audio,
          definition: definition,
        };
        fn.saveWord(fn.dictKey(req.params.dict), word, JSON.stringify(json))
        res.status(200).json(fn.normResult(json, { b64 }));
      }
    }
  });
});
module.exports = app;
