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