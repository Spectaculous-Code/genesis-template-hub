// Mock data for Finnish KR92 Bible translation

export interface BibleBook {
  name: string;
  testament: "old" | "new";
  chapters: number;
}

export interface Verse {
  number: number;
  text: string;
}

export interface Chapter {
  book: string;
  chapter: number;
  verses: Verse[];
}

export const bibleBooks: BibleBook[] = [
  // Old Testament (Vanha testamentti)
  { name: "1. Mooseksen kirja", testament: "old", chapters: 50 },
  { name: "2. Mooseksen kirja", testament: "old", chapters: 40 },
  { name: "3. Mooseksen kirja", testament: "old", chapters: 27 },
  { name: "4. Mooseksen kirja", testament: "old", chapters: 36 },
  { name: "5. Mooseksen kirja", testament: "old", chapters: 34 },
  { name: "Joosua", testament: "old", chapters: 24 },
  { name: "Tuomarit", testament: "old", chapters: 21 },
  { name: "Ruut", testament: "old", chapters: 4 },
  { name: "1. Samuelin kirja", testament: "old", chapters: 31 },
  { name: "2. Samuelin kirja", testament: "old", chapters: 24 },
  { name: "Psalmit", testament: "old", chapters: 150 },
  
  // New Testament (Uusi testamentti)
  { name: "Matteus", testament: "new", chapters: 28 },
  { name: "Markus", testament: "new", chapters: 16 },
  { name: "Luukas", testament: "new", chapters: 24 },
  { name: "Johannes", testament: "new", chapters: 21 },
  { name: "Apostolien teot", testament: "new", chapters: 28 },
  { name: "Roomalaiskirje", testament: "new", chapters: 16 },
  { name: "1. Korinttilaiskirje", testament: "new", chapters: 16 },
  { name: "2. Korinttilaiskirje", testament: "new", chapters: 13 },
  { name: "Galatalaiskirje", testament: "new", chapters: 6 },
  { name: "Efesolaiskirje", testament: "new", chapters: 6 },
  { name: "Ilmestyskirja", testament: "new", chapters: 22 },
];

// Mock chapter data - in real app this would come from API
const mockChapters: { [key: string]: Chapter } = {
  "Matteus_1": {
    book: "Matteus",
    chapter: 1,
    verses: [
      {
        number: 1,
        text: "Jeesuksen Kristuksen, Daavidin pojan, Abrahamin pojan, sukuhistoria."
      },
      {
        number: 2,
        text: "Abraham siitti Iisakin, Iisak siitti Jaakobin, Jaakob siitti Juudan ja hänen veljensä."
      },
      {
        number: 3,
        text: "Juuda siitti Pereksen ja Serahn Taamarista, Peres siitti Hesronin, Hesron siitti Raamin."
      },
      {
        number: 4,
        text: "Raam siitti Amminadabin, Amminadab siitti Nahsonin, Nahson siitti Salmanin."
      },
      {
        number: 5,
        text: "Salma siitti Boaan Rahabista, Booa siitti Obedin Ruutista, Obed siitti Iisain."
      },
      {
        number: 6,
        text: "Iisai siitti kuningas Daavidin. Daavid siitti Salomon Urian vaimosta."
      },
      {
        number: 7,
        text: "Salomo siitti Rehabeamin, Rehabeam siitti Abian, Abia siitti Aasafin."
      },
      {
        number: 8,
        text: "Aasaf siitti Joosafatin, Joosafat siitti Jooramin, Jooram siitti Ussian."
      },
      {
        number: 9,
        text: "Ussia siitti Jootamin, Jootam siitti Aahaan, Aahas siitti Hiskian."
      },
      {
        number: 10,
        text: "Hiskia siitti Manassen, Manasse siitti Aamonin, Aamon siitti Joosian."
      }
    ]
  },
  "Matteus_2": {
    book: "Matteus",
    chapter: 2,
    verses: [
      {
        number: 1,
        text: "Kun Jeesus oli syntynyt Betlehemissä Juudeassa kuningas Herodeksen aikana, katso, itämaan tietäjät tulivat Jerusalemiin"
      },
      {
        number: 2,
        text: "ja kysyivät: 'Missä on juutalaisten kuningas, joka on syntynyt? Sillä me olemme nähneet hänen tähtensä idässä ja olemme tulleet kumartamaan häntä.'"
      },
      {
        number: 3,
        text: "Kun kuningas Herodes sen kuuli, hän säikähti, ja koko Jerusalem hänen kanssaan."
      },
      {
        number: 4,
        text: "Ja hän kokosi kaikki ylipappit ja kansan kirjanoppineet ja tiedusteli heiltä, missä Kristus syntyisi."
      },
      {
        number: 5,
        text: "He sanoivat hänelle: 'Betlehemissä Juudeassa, sillä näin on profeetan kirjoittama:"
      }
    ]
  }
};

export const getMockChapter = (book: string, chapter: number): Chapter => {
  const key = `${book}_${chapter}`;
  
  // Return mock data if available, otherwise generate placeholder
  if (mockChapters[key]) {
    return mockChapters[key];
  }
  
  // Generate placeholder verses for demonstration
  const placeholderVerses: Verse[] = Array.from({ length: 10 }, (_, i) => ({
    number: i + 1,
    text: `Tämä on ${book} ${chapter}:${i + 1} jae. KR92-käännöksen sisältö tulisi tähän. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`
  }));
  
  return {
    book,
    chapter,
    verses: placeholderVerses
  };
};