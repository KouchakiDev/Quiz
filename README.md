

# General Knowledge Quiz

A simple and customizable **general knowledge quiz** built with HTML, CSS, and JavaScript.
Questions can be loaded from `config.json` or use the default questions.

---


**Author**
- **Sobhan Kouchaki — SKD**

## Features

* Clean and responsive UI
* Multiple question types:

  * Multiple choice (`multiple`)
  * Exact answer (`exact`)
  * Contains keywords (`contains`)
  * Number (`number`)
  * True/False (`boolean`)
  * Regex (`regex`)
* Progress bar and score display
* Skip questions if needed
* Review answers after the quiz
* Download results in **JSON** or **CSV**
* Optional custom config file

---

## How to Use

1. Open `index.html` in a browser.
2. Click **Start Quiz** to begin.
3. Answer questions or skip them.
4. At the end, view your results and download them if needed.

---

## File Structure

```
index.html         – Main page
style.css          – Styles
script.js          – Quiz logic
config.json        – Optional custom questions
```

---

## Custom Config

* JSON format example:

```json
{
  "position": 1,
  "type": "multiple",
  "text": "What is the capital of Iran?",
  "options": ["Tehran", "Isfahan", "Shiraz", "Tabriz"],
  "answerIndex": 0
}
```

* Fields:

  * `position` – question number
  * `type` – question type (`multiple`, `exact`, `contains`, `number`, `boolean`, `regex`)
  * `text` – question text
  * `options` – choices (for multiple choice)
  * `answer` / `answerIndex` / `correctKeywords` / `pattern` – correct answer

* To load a custom config, click **Load Config** and select a JSON file.

* To reset to default, click **Reset Default**.

---

## Developer API

* `window.quiz.reload()` – reload default config
* `window.quiz.getResults()` – get current quiz results

---

## License

Free to use and modify for personal projects.

---

