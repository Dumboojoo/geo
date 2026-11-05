# Lernzettel Reliefsphäre (Geo LK)

Interaktiver Lernzettel als Webseite:

- **21 Themen in 6 Kapiteln**: Operatoren, Schalenbau, Isostasie, Wegener, Plattentektonik, Wilson-Zyklus, Island, Vulkane, Erdbeben, Verwitterung
- **3 Erklärstufen** pro Thema: Einfach · Normal · Genauer
- **Abhaken & Punkte**: Haken bei verstandenen Themen, Schnelltests, Ränge von „Staubkorn“ bis „Pangäa“, Bohrkern-Fortschritt
- **Lernplan für den Tag vor der Klausur**: Block für Block mit Uhrzeiten (passen sich der Startzeit an), Voll- oder Kompakt-Modus, Abhak-Liste und „Prüf dich“-Fragen
- **2 Übungsklausuren** im Stil der Klausur 2024 (60 BE, 90 Minuten) mit Timer, Erwartungshorizont und Notenpunkte-Rechner

Der Fortschritt wird nur im eigenen Browser gespeichert (localStorage).

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Lernzettel |
| `lernplan.html` | Lernplan für den Tag vor der Klausur (Ziel: 11+ Punkte) mit Uhrzeiten, Abhak-Liste und Selbsttests |
| `uebungsklausur-1.html` | Übungsklausur 1: Ostafrika + Frostsprengung |
| `uebungsklausur-2.html` | Übungsklausur 2: Chile + Felsenmeer |
| `css/`, `js/` | Design und Logik |
| `assets/` | Fotos der Originalunterlagen – **wird nicht hochgeladen** (siehe `.gitignore`) |

## Auf GitHub Pages veröffentlichen

### Variante A: im Browser (ohne Git)

1. Auf [github.com](https://github.com) einloggen → oben rechts **+** → **New repository**.
2. Name z. B. `geo-lernzettel`, **Public** auswählen, **Create repository**.
3. Auf der Repo-Seite **uploading an existing file** anklicken.
4. Diese Dateien bzw. Ordner hineinziehen: `index.html`, `lernplan.html`, `uebungsklausur-1.html`, `uebungsklausur-2.html`, den Ordner `css` und den Ordner `js`.
   **Nicht** den Ordner `assets` hochladen – darin sind Fotos mit Namen von Mitschülerinnen und der Lehrerin.
5. Unten **Commit changes** klicken.
6. Im Repo: **Settings → Pages** → bei *Source* „Deploy from a branch“, Branch **main**, Ordner **/ (root)** → **Save**.
7. Nach 1–2 Minuten ist die Seite online unter
   `https://DEIN-NAME.github.io/geo-lernzettel/`

### Variante B: mit Git (Terminal)

```bash
git init
git add .
git commit -m "Lernzettel Reliefsphäre"
git branch -M main
git remote add origin https://github.com/DEIN-NAME/geo-lernzettel.git
git push -u origin main
```

Danach wie oben unter **Settings → Pages** den Branch `main` und `/ (root)` auswählen. Der Ordner `assets/` wird dank `.gitignore` automatisch ausgelassen.

## Lokal ansehen

Einfach `index.html` doppelklicken. Falls Schriften oder Design fehlen, einen kleinen Server starten:

```bash
python -m http.server 8000
```

und `http://localhost:8000` öffnen.

## Hinweis

Selbst erstellte Lernhilfe, zusammengestellt aus Unterrichtsmaterialien. Die Übungsklausuren sind keine offiziellen Klausuren. Ohne Gewähr – bei Widersprüchen gilt der Hefter.
