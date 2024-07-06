# Cambridge Dictionary API

A simple API for [Cambridge Dictionary](https://dictionary.cambridge.org/), built with Node.js.

<a href="https://www.buymeacoffee.com/tabaoman"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coke&emoji=😘&slug=tabaoman&button_colour=FFDD00&font_colour=ff0000&font_family=Cookie&outline_colour=ff0000&coffee_colour=000000" /></a>

## Manual

### ⚠️ Before starting
1. Thank [Cambridge Dictionary](https://dictionary.cambridge.org/) nicely compiling the words.\
The API entries contain dictionary option, deciding which the dictionary database to use:

    | Dictionary  | Database                    |
    |-------------|-----------------------------|
    | **`en`**    | English (US)                |
    | **`uk`**    | English (UK)                |
    | **`en-cn`** | English-Chinese-Simplified  |
    | **`en-tw`** | English-Chinese-Traditional |

2. You have to remember to encode the query by yourself. A common use is:
    ```javascript
    encodeURIComponent('cook eggs')  // -> cook%20eggs
    ```
3. By default, you will get some pronunciation audios in url (ending with .mp3).\
But sometimes you need the audio data.\
You can append the api with `?b` ot `?b64` to get the base64 texts instead of audio urls.\
**⚠️ Note: base64 text will significantly increase the data size of the response.**

4. I have deployed a service you can use it for free:\
🔗 https://cam-dict.ping1service.top

4. This repository is built and enhanced based on Elias's [work](https://github.com/chenelias/cambridge-dictionary-api)\
 ❤️ Let's thank Elias!

### API Entries
#### 1. Lookup a word within the specified dictionary
```
/api/dictionary/`{dictionary}`/`{word}`
```

#### 2. Get a suggested word list for a key word
```
/api/suggest/`{dictionary}`/`{word}`
```

## 💻 Self hosted

```bash
npm install
npm run dev
```

Then fetch `http://localhost:3000/api/dictionary/en/hello` to test it
or use / to test it out with UI.

## 📖 Example

/api/dictionary/`en-tw`/`cook`

```json
{
  "word": "cook",
  "pos": ["verb", "noun"],
  "verbs": [
    {
      "type": "Plain form",
      "text": "cook"
    },
    {
      "type": "Third-person singular",
      "text": "cooks"
    },
    ...
  ],
  "pronunciation": [
    {
      "pos": "verb",
      "lang": "uk",
      "url": "https://dictionary.cambridge.org/us/media/english-chinese-simplified/uk_pron/u/ukc/ukcon/ukconve028.mp3",
      "url": "data:audio/mpeg;base64,AAAAA......"
    },
    {
      "pos": "verb",
      "lang": "us",
      "url": "https://dictionary.cambridge.org/us/media/english-chinese-simplified/us_pron/c/coo/cook_/cook.mp3"
      "url": "data:audio/mpeg;base64,AAAAA......"
    },
    ...
  ],
  "definition": [
    {
      "id": 0,
      "pos": "verb",
      "text": "When you cook food, you prepare it to be eaten by heating it in a particular way, such as baking or boiling, and when food cooks, it is heated until it is ready to eat.",
      "translation": "做飯，烹調;燒，煮",
      "example": [
        {
          "id": 0,
          "text": "I don't cook meat very often.",
          "translation": "我不常煮肉吃。"
        },
        ...
      ]
    },
    ...
  ]
}
```

/api/suggest/`en-cn`/`cook`

```json
[
  "cook",
  "Cook Islander",
  "cook someone’s goose",
  "cook something up",
  "cook the books",
  "cook up, dance up, talk up, etc. a storm",
  "cookbook",
  "cooked",
  "cooked breakfast",
  "cooked/done to a turn"
]
```

Created by [Elias](https://github.com/chenelias) ❤️\
Forked by [tabaoman](https://buymeacoffee.com/tabaoman) ☕️