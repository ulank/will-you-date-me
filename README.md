# Танысасың ба? 💌

Танысуға шақыратын бір беттік сайт. Фреймворксіз: таза HTML + CSS + JS.
Палитра: жұмсақ қызғылт фон + коралл екпін.

## Не бар

- **«Жоқ» батырмасы қашады** — десктопта тінтуір жақындағанда, мобильде саусақ
  жақындағанда/тигенде (тек кликке емес: `touchstart`/`touchmove` арқылы).
- **Шекара бар**: батырма бүкіл экранға емес, тек көрінетін ойын алаңының
  (`.arena`) ішінде қозғалады — сыртқа шыға алмайды.
- **«Иә» батырмасы** — canvas фейерверк + экран жұмсақ ауысады, гифка да ауысады.
- Гифкалар Giphy-ден жүктеледі. Ауыстыру үшін `index.html` ішіндегі екі
  `<img class="gif" ... src="...">` сілтемесін өзгертіңіз. Сілтеме істемей қалса,
  сурет орны бос қалмай, автоматты жасырылады.
- iPhone/iPad/десктопқа адаптивті, iOS `safe-area` ескерілген.
- Сыртқы кітапхана, шрифт, сурет жоқ — 3 файл, жүктемесі минимал.
- `prefers-reduced-motion` қолдайды.

## Контактіңді қою

`script.js` файлының басындағы `CONFIG`:

```js
const CONFIG = {
  contact: 'ulankozhabekov',   // Telegram/Instagram username немесе телефон нөмірі
  contactType: 'instagram',    // 'telegram' | 'instagram' | 'phone' | 'none'
};
```

Сұрақ мәтінін `index.html` ішінен өзгертуге болады.

## GitHub Pages-ке деплой

```bash
git add .
git commit -m "Кездесуге шақыру"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

Содан кейін: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `root` → Save**.
1–2 минуттан кейін сайт `https://<username>.github.io/<repo>/` мекенжайында ашылады.

## Жергілікті қарау

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Файлдар

```
index.html   — құрылым мен мәтін
styles.css   — стиль, адаптив, safe-area, анимациялар
script.js    — қашатын батырма, экран ауысуы, фейерверк
```
