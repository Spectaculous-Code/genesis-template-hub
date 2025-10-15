// Mapping from English Bible book names to Finnish
export const englishToFinnishBookNames: Record<string, string> = {
  // Old Testament / Vanha testamentti
  "Genesis": "1. Mooseksen kirja",
  "Exodus": "2. Mooseksen kirja", 
  "Leviticus": "3. Mooseksen kirja",
  "Numbers": "4. Mooseksen kirja",
  "Deuteronomy": "5. Mooseksen kirja",
  "Joshua": "Joosuan kirja",
  "Judges": "Tuomarien kirja",
  "Ruth": "Ruutin kirja",
  "I Samuel": "1. Samuelin kirja",
  "II Samuel": "2. Samuelin kirja",
  "I Kings": "1. Kuningasten kirja",
  "II Kings": "2. Kuningasten kirja",
  "I Chronicles": "1. Aikakirja",
  "II Chronicles": "2. Aikakirja",
  "Ezra": "Esran kirja",
  "Nehemiah": "Nehemian kirja",
  "Esther": "Esterin kirja",
  "Job": "Jobin kirja",
  "Psalms": "Psalmien kirja",
  "Proverbs": "Sananlaskujen kirja",
  "Ecclesiastes": "Saarnaajan kirja",
  "Song of Solomon": "Laulujen laulu",
  "Isaiah": "Jesajan kirja",
  "Jeremiah": "Jeremian kirja",
  "Lamentations": "Valitusvirret",
  "Ezekiel": "Hesekielin kirja",
  "Daniel": "Danielin kirja",
  "Hosea": "Hoosean kirja",
  "Joel": "Joelin kirja",
  "Amos": "Aamoksen kirja",
  "Obadiah": "Obadjan kirja",
  "Jonah": "Jonan kirja",
  "Micah": "Miikan kirja",
  "Nahum": "Nahumin kirja",
  "Habakkuk": "Habakukin kirja",
  "Zephaniah": "Sefanjan kirja",
  "Haggai": "Haggain kirja",
  "Zechariah": "Sakarian kirja",
  "Malachi": "Malakian kirja",

  // New Testament / Uusi testamentti
  "Matthew": "Matteus",
  "Mark": "Markus",
  "Luke": "Luukas",
  "John": "Johannes",
  "Acts": "Apostolien teot",
  "Romans": "Kirje roomalaisille",
  "I Corinthians": "1. Kor",
  "II Corinthians": "2. Kor",
  "Galatians": "Kirje galatalaisille",
  "Ephesians": "Kirje efesolaisille",
  "Philippians": "Kirje filippiläisille",
  "Colossians": "Kirje kolossalaisille",
  "I Thessalonians": "1. Tess",
  "II Thessalonians": "2. Tess",
  "I Timothy": "1. Tim",
  "II Timothy": "2. Tim",
  "Titus": "Kirje Titukselle",
  "Philemon": "Kirje Filemonille",
  "Hebrews": "Kirje heprealaisille",
  "James": "Jaakobin kirje",
  "I Peter": "1. Pietarin kirje",
  "II Peter": "2. Pietarin kirje",
  "I John": "1. Johanneksen kirje",
  "II John": "2. Johanneksen kirje",
  "III John": "3. Johanneksen kirje",
  "Jude": "Juudaan kirje",
  "Revelation of John": "Johanneksen ilmestys"
};

// Helper function to get Finnish name for a book
export const getFinnishBookName = (englishName: string): string => {
  return englishToFinnishBookNames[englishName] || englishName;
};

// Helper function to get English name from Finnish name
export const getEnglishBookName = (finnishName: string): string => {
  const entry = Object.entries(englishToFinnishBookNames).find(([_, finnish]) => finnish === finnishName);
  return entry ? entry[0] : finnishName;
};

// Canonical Bible book order (1-66)
const bookOrder: Record<string, number> = {
  // Old Testament (1-39)
  "Genesis": 1, "Exodus": 2, "Leviticus": 3, "Numbers": 4, "Deuteronomy": 5,
  "Joshua": 6, "Judges": 7, "Ruth": 8, "I Samuel": 9, "II Samuel": 10,
  "I Kings": 11, "II Kings": 12, "I Chronicles": 13, "II Chronicles": 14,
  "Ezra": 15, "Nehemiah": 16, "Esther": 17, "Job": 18, "Psalms": 19,
  "Proverbs": 20, "Ecclesiastes": 21, "Song of Solomon": 22, "Isaiah": 23,
  "Jeremiah": 24, "Lamentations": 25, "Ezekiel": 26, "Daniel": 27,
  "Hosea": 28, "Joel": 29, "Amos": 30, "Obadiah": 31, "Jonah": 32,
  "Micah": 33, "Nahum": 34, "Habakkuk": 35, "Zephaniah": 36, "Haggai": 37,
  "Zechariah": 38, "Malachi": 39,
  // New Testament (40-66)
  "Matthew": 40, "Mark": 41, "Luke": 42, "John": 43, "Acts": 44,
  "Romans": 45, "I Corinthians": 46, "II Corinthians": 47, "Galatians": 48,
  "Ephesians": 49, "Philippians": 50, "Colossians": 51, "I Thessalonians": 52,
  "II Thessalonians": 53, "I Timothy": 54, "II Timothy": 55, "Titus": 56,
  "Philemon": 57, "Hebrews": 58, "James": 59, "I Peter": 60, "II Peter": 61,
  "I John": 62, "II John": 63, "III John": 64, "Jude": 65, "Revelation of John": 66
};

// Helper function to get book order (1-66)
export const getBookOrder = (bookName: string): number => {
  return bookOrder[bookName] || 999; // Unknown books go to the end
};