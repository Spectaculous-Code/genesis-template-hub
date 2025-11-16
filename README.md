# 🕊️ Raamattu Widget

Kevyt ja helppokäyttöinen JavaScript-widget, joka mahdollistaa Raamatun jakeiden upottamisen mihin tahansa verkkosivulle. Widget käyttää Shadow DOM:ia, joten se on täysin eristetty sivun tyyleistä.

## ✨ Ominaisuudet

- ✅ **Helppokäyttöinen**: Lisää vain yksi script-tagi ja data-attribuutit
- ✅ **Shadow DOM**: Tyylit eivät vuoda ulos/sisään
- ✅ **Audio-tuki**: Sisäänrakennettu HTML5-audiosoitin
- ✅ **Responsiivinen**: Toimii kaikilla laitteilla
- ✅ **Kevyt**: Ei riippuvuuksia, puhdas Vanilla JS
- ✅ **Automaattinen lataus**: Tukee sekä staattisia että dynaamisesti lisättyjä elementtejä
- ✅ **Monipuolinen viittausformaatti**: Tukee sekä suomalaisia että englantilaisia lyhenteitä

## 🚀 Pika-aloitus

### 1. Lisää widget-skripti sivullesi

```html
<script src="https://yourdomain.com/widget.js"></script>
```

### 2. Lisää widget-elementti

```html
<div class="rn-bible" data-ref="Joh.3:16"></div>
```

Valmis! Widget latautuu automaattisesti ja näyttää jakeen sisällön.

## 📖 Käyttö

### Peruskäyttö

```html
<!-- Yksittäinen jae -->
<div class="rn-bible" data-ref="Joh.3:16"></div>

<!-- Jakeiden vaihteluväli -->
<div class="rn-bible" data-ref="Joh.3:16-17"></div>

<!-- Tietty käännös -->
<div class="rn-bible" data-ref="Joh.3:16" data-version="finpr_finn"></div>
```

### Tuetut attribuutit

| Attribuutti | Kuvaus | Pakollinen | Esimerkki |
|-------------|--------|-----------|-----------|
| `data-ref` | Raamatunviittaus | Kyllä | `"Joh.3:16"` |
| `data-version` | Käännöksen koodi | Ei | `"finpr_finn"` |

### Tuetut käännökset

| Koodi | Nimi |
|-------|------|
| `finstlk201` | FinSTLK2017: Pyhä Raamattu (STLK 2017) - **Oletuskäännös** |
| `finpr_finn` | FinPR: Finnish Pyhä Raamattu (1933/1938) |
| `KJV` | King James Version (1769) with Strongs Numbers |

## 🔤 Viittausformaatit

Widget tukee useita eri viittausformaatteja:

### Suomalaiset lyhenteet

```html
<!-- Peruskäyttö -->
<div class="rn-bible" data-ref="Joh.3:16"></div>
<div class="rn-bible" data-ref="Matt.5:3"></div>
<div class="rn-bible" data-ref="Ps.23:1"></div>

<!-- Numeroilla alkavat kirjat -->
<div class="rn-bible" data-ref="1. Joh.4:8"></div>
<div class="rn-bible" data-ref="1 Joh.4:8"></div>
<div class="rn-bible" data-ref="1.Joh.4:8"></div>

<div class="rn-bible" data-ref="2. Kor.13:4"></div>
<div class="rn-bible" data-ref="3 Joh.1:1"></div>

<!-- Mooseksen kirjat -->
<div class="rn-bible" data-ref="1. Moos.1:1"></div>
<div class="rn-bible" data-ref="2 Moos.20:3"></div>
```

### Englantilaiset lyhenteet

```html
<div class="rn-bible" data-ref="John 3:16"></div>
<div class="rn-bible" data-ref="Gen.1:1"></div>
<div class="rn-bible" data-ref="Rom.8:28"></div>
<div class="rn-bible" data-ref="1 John 4:8"></div>
```

### Eri erottimet

Widget tukee sekä kaksoispistettä (`:`) että pistettä (`.`) luvun ja jakeen välissä:

```html
<!-- Kaksoispiste -->
<div class="rn-bible" data-ref="Joh.3:16"></div>
<div class="rn-bible" data-ref="Joh.3:16-17"></div>

<!-- Piste -->
<div class="rn-bible" data-ref="Joh.3.16"></div>
<div class="rn-bible" data-ref="Joh.3.16-17"></div>
```

### Jakeiden vaihteluvälit

```html
<!-- Yksittäinen jae -->
<div class="rn-bible" data-ref="Joh.3:16"></div>

<!-- Vaihteluväli -->
<div class="rn-bible" data-ref="Joh.3:16-17"></div>
<div class="rn-bible" data-ref="Matt.5:3-10"></div>
<div class="rn-bible" data-ref="1 Moos.1:1-5"></div>
```

## 🎵 Audio-toiminnallisuus

Widget sisältää automaattisen audio-tuen käännöksille, joille on saatavilla äänitiedostoja.

### Audio-ominaisuudet:

- ✅ Automaattinen audio-tuki, jos saatavilla
- ✅ Tarkka aika-alueen toisto (startTime - endTime)
- ✅ Play/Pause-painike
- ✅ Ajastin näyttää nykyisen ja kokonaisajan
- ✅ Automaattinen pysäytys vaihteluvälin lopussa
- ✅ Reset alkukohtaan pysäytyksen jälkeen

### Jos audio ei ole saatavilla:

- Painike on disabloitu
- Näkyy teksti: "Ääni ei saatavilla"
- Tooltip kertoo syyn

## 🛠️ Manuaalinen kontrolli

Widget tarjoaa globaalin API:n manuaaliseen kontrolliin:

```javascript
// Alusta kaikki widgetit uudelleen
window.RNBibleWidget.init();

// Alusta tietty elementti
const element = document.querySelector('.rn-bible');
window.RNBibleWidget.initElement(element);
```

### Dynaaminen sisältö

Widget tukee automaattisesti dynaamisesti lisättyjä elementtejä:

```javascript
// Lisää uusi widget dynaamisesti
const newWidget = document.createElement('div');
newWidget.className = 'rn-bible';
newWidget.setAttribute('data-ref', 'Joh.3:16');
document.body.appendChild(newWidget);
// Widget latautuu automaattisesti!
```

## 🎨 Tyylittely

Widget käyttää Shadow DOM:ia, joten sen tyylit ovat täysin eristettyjä sivun tyyleistä. Tämä tarkoittaa:

- ✅ Sivun CSS ei vaikuta widgetiin
- ✅ Widget CSS ei vaikuta sivuun
- ✅ Yhtenäinen ulkoasu kaikilla sivuilla

### Oletustyylit:

Widget tulee valmiilla, responsiivisilla tyyleillä:
- Moderni, puhdas design
- Sopii eri sivutyyleihin
- Optimoitu luettavuudelle
- Responsiivinen kaikille laitteille

## 📊 API-dokumentaatio

### Embed API

Widget käyttää seuraavaa API:ta jakeiden hakemiseen:

```
GET https://iryqgmjauybluwnqhxbg.supabase.co/functions/v1/embed
```

#### Query-parametrit:

| Parametri | Kuvaus | Pakollinen | Esimerkki |
|-----------|--------|-----------|-----------|
| `ref` | Raamatunviittaus | Kyllä | `Joh.3:16` |
| `version` | Käännöksen koodi | Ei | `finpr_finn` |

#### Vastausformaatti:

```json
{
  "reference": "Johannes 3:16",
  "version": "Pyhä Raamattu (STLK 2017)",
  "versionCode": "finstlk201",
  "verses": [
    {
      "number": 16,
      "text": "Sillä niin on Jumala maailmaa rakastanut..."
    }
  ],
  "audio": {
    "available": true,
    "url": "https://example.com/audio.mp3",
    "startTime": 12.5,
    "endTime": 18.3
  },
  "link": "https://iryqgmjauybluwnqhxbg.supabase.co/?book=Johannes&chapter=3&verse=16"
}
```

## 🧪 Testaus

Projekti sisältää kaksi testisivua:

### 1. embed-test.html
Testaa suoraan Embed API:a ilman widgetiä.

```
https://yourdomain.lovableproject.com/embed-test.html
```

### 2. widget-test.html
Kattavat testit widget-toiminnallisuudelle.

```
https://yourdomain.lovableproject.com/widget-test.html
```

Testisivu sisältää esimerkit:
- Yksittäisistä jakeista
- Jakeiden vaihteluväleistä
- Eri käännöksistä
- Numeroilla alkavista kirjoista
- Englantilaisista lyhenteistä
- Eri erottimista
- Virhetilanteista

## 🔧 Tekninen toteutus

### Shadow DOM

Widget käyttää Shadow DOM:ia eristääkseen tyylit:

```javascript
const shadow = element.attachShadow({ mode: 'open' });
```

Edut:
- CSS-eristys molempiin suuntiin
- Yhtenäinen renderöinti kaikissa ympäristöissä
- Ei konflikteja sivun tyylien kanssa

### Audio-logiikka

Audio-soitin käyttää HTML5 Audio API:a:

```javascript
const audio = new Audio(audioUrl);
audio.currentTime = startTime;
audio.play();

audio.addEventListener('timeupdate', () => {
  if (audio.currentTime >= endTime) {
    audio.pause();
    audio.currentTime = startTime; // Reset
  }
});
```

### MutationObserver

Widget käyttää MutationObserveria seuratakseen dynaamisesti lisättyjä elementtejä:

```javascript
const observer = new MutationObserver((mutations) => {
  // Alusta uudet widgetit automaattisesti
});
observer.observe(document.body, {
  childList: true,
  subtree: true
});
```

## 🐛 Virheenkäsittely

Widget käsittelee virheet graafisesti:

- **Puuttuva data-ref**: Näyttää virheilmoituksen
- **Virheellinen viittaus**: Näyttää API:n virheilmoituksen
- **Verkkoyhteysongelmat**: Näyttää yhteysongelmasta kertovan viestin
- **Puuttuva audio**: Disabloi soittopainikkeen

## 📱 Yhteensopivuus

Widget toimii kaikilla moderneilla selaimilla:

- ✅ Chrome/Edge (88+)
- ✅ Firefox (85+)
- ✅ Safari (14+)
- ✅ Opera (74+)

Vaatimukset:
- Shadow DOM -tuki
- ES6+ JavaScript
- Fetch API

## 🚀 Tuotantokäyttöönotto

### 1. Kopioi widget.js palvelimellesi

```bash
# Kopioi widget.js public-kansiosta
cp public/widget.js /var/www/yourdomain/
```

### 2. Varmista CORS-asetukset

Varmista että Embed API sallii CORS-pyynnöt domain-iltasi:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### 3. Lisää widget sivullesi

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <!-- Sisältösi tässä -->
  
  <!-- Lisää widgetit -->
  <div class="rn-bible" data-ref="Joh.3:16"></div>
  
  <!-- Lataa widget-skripti -->
  <script src="https://yourdomain.com/widget.js"></script>
</body>
</html>
```

## 🎯 Projektin tekniikat

Tämä projekti on rakennettu seuraavilla teknologioilla:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend)

## 📝 Projektin hallinta

**Lovable-projekti**: https://lovable.dev/projects/73accc9c-d7cc-4695-8846-f286113b606e

### Muokkaaminen

Voit muokata projektia useilla tavoilla:

1. **Lovable-editori**: Käytä [Lovable-projektia](https://lovable.dev/projects/73accc9c-d7cc-4695-8846-f286113b606e)
2. **Paikallinen kehitys**: Kloonaa repo ja käytä omaa IDE:täsi
3. **GitHub**: Muokkaa tiedostoja suoraan GitHubissa
4. **GitHub Codespaces**: Käynnistä kehitysympäristö suoraan selaimessa

### Paikallinen kehitys

```sh
# Kloonaa repository
git clone <YOUR_GIT_URL>

# Siirry projektikansioon
cd <YOUR_PROJECT_NAME>

# Asenna riippuvuudet
npm i

# Käynnistä kehityspalvelin
npm run dev
```

## 🌐 Julkaisu

Julkaise sovellus:
1. Avaa [Lovable](https://lovable.dev/projects/73accc9c-d7cc-4695-8846-f286113b606e)
2. Klikkaa Share → Publish

### Custom domain

Voit yhdistää oman domainin projektiin:
- Siirry Project > Settings > Domains
- Klikkaa Connect Domain
- Lue lisää: [Custom domain setup](https://docs.lovable.dev/tips-tricks/custom-domain)

## 📄 Lisenssi

MIT License

## 🤝 Tuki

Kysymyksiä tai ongelmia? 
- Katso [testisivut](https://yourdomain.lovableproject.com/widget-test.html) esimerkkeihin
- Tarkista [API-dokumentaatio](https://yourdomain.lovableproject.com/embed-test.html)

## 🔄 Versiohistoria

### v1.0.0 (2025-01-16)
- Ensimmäinen julkinen versio
- Shadow DOM -tuki
- Audio-toiminnallisuus
- Automaattinen lataus
- Dynaamiset elementit
- Kattavat viittausformaatit

## 🎯 Tulevat ominaisuudet

- [ ] Teema-asetukset (vaalea/tumma)
- [ ] Kustomoitavat värit
- [ ] Kieliversioiden vaihto
- [ ] Offline-tuki
- [ ] Latausanimaatiot
- [ ] Keyboard-navigaatio audiolle

---

**Widget powered by [Lovable](https://lovable.dev)**
