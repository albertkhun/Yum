// CATEGORY MAP
const CATEGORY_MAP = {
  rent: 'Rent',
  rental: 'Rent',
  renting: 'Rent',
  house: 'Rent',
  home: 'Rent',

  apartment: 'Apartment',
  flat: 'Apartment',
  '1bhk': 'Apartment',
  '2bhk': 'Apartment',
  '3bhk': 'Apartment',
  bhk: 'Apartment',

  pg: 'PG',
  'paying guest': 'PG',
  'paying-guest': 'PG',

  hostel: 'Hostel',
  dorm: 'Hostel',
  dormitory: 'Hostel',

  lodge: 'Lodge',
  lodging: 'Lodge',
  guesthouse: 'Lodge',
  'guest house': 'Lodge',

  room: 'Tolet',
  rooms: 'Tolet',
  tolet: 'Tolet',
  'to let': 'Tolet',
  'to-let': 'Tolet',
};

// DISTRICT / AREA MAP

const DISTRICT_MAP = {
  // Imphal West
  'imphal west': 'Imphal West',
  'imphal-west': 'Imphal West',
  imphal: 'Imphal West',

  langol: 'Imphal West',
  lamphel: 'Imphal West',
  singjamei: 'Imphal West',
  sagolband: 'Imphal West',
  uripok: 'Imphal West',
  kwakeithel: 'Imphal West',
  mantripukhri: 'Imphal West',
  'thangal bazar': 'Imphal West',
  paona: 'Imphal West',

  'nit manipur': 'Imphal West',
  nit: 'Imphal West',

  // Imphal East
  'imphal east': 'Imphal East',
  'imphal-east': 'Imphal East',

  porompat: 'Imphal East',
  heingang: 'Imphal East',
  khurai: 'Imphal East',
  keishamthong: 'Imphal East',

  // Other districts
  thoubal: 'Thoubal',
  bishnupur: 'Bishnupur',
  churachandpur: 'Churachandpur',
  ccp: 'Churachandpur',
  chandel: 'Chandel',
  ukhrul: 'Ukhrul',
  senapati: 'Senapati',
  tamenglong: 'Tamenglong',
  jiribam: 'Jiribam',
  kakching: 'Kakching',
  kangpokpi: 'Kangpokpi',
  noney: 'Noney',
  pherzawl: 'Pherzawl',
  tengnoupal: 'Tengnoupal',
  kamjong: 'Kamjong',
};


// STATUS MAP
const STATUS_MAP = {
  available: 'available',
  vacant: 'available',
  free: 'available',
  empty: 'available',

  rented: 'rented',
  occupied: 'rented',
  taken: 'rented',
};

// STOPWORDS
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'in',
  'at',
  'on',
  'near',
  'around',
  'for',
  'with',
  'and',
  'or',
  'of',
  'to',
  'by',
  'from',
  'is',
  'are',
  'i',
  'me',
  'my',
  'find',
  'show',
  'get',
  'search',
  'looking',
  'want',
  'need',
  'any',
  'some',
  'good',
  'best',
  'top',
  'nice',
  'cheap',
  'affordable',
  'budget',
  'manipur',
  'local',
]);


// PRICE REGEX

// under 5k
const PRICE_BELOW_RE =
  /(?:under|below|max|maximum|less\s+than|upto|up\s+to|within|<)\s*₹?\s*(\d+(?:\.\d+)?)\s*k?/i;

// above 2k
const PRICE_ABOVE_RE =
  /(?:above|over|min|minimum|more\s+than|atleast|at\s+least|>)\s*₹?\s*(\d+(?:\.\d+)?)\s*k?/i;

// standalone 5k or 5000
const PRICE_BARE_RE =
  /(?:^|\s)₹?\s*(\d+(?:\.\d+)?)\s*k?(?:\s|$)/i;

// HELPERS


function normalizePrice(raw, originalMatch = '') {
  let value = parseFloat(raw.replace(/,/g, ''));

  if (
    originalMatch.toLowerCase().includes('k') &&
    value < 1000
  ) {
    value *= 1000;
  }

  return Math.round(value);
}


// MAIN NLP PARSER

export function parseNLQuery(raw = '') {
  const result = {
    search: '',
    category: '',
    district: '',
    minPrice: '',
    maxPrice: '',
    status: '',
  };

  if (!raw.trim()) return result;

  let text = raw.toLowerCase().trim();

  
  // MAX PRICE

  const belowMatch = text.match(PRICE_BELOW_RE);

  if (belowMatch) {
    result.maxPrice = String(
      normalizePrice(belowMatch[1], belowMatch[0])
    );

    text = text.replace(belowMatch[0], ' ');
  }
  // MIN PRICE
  const aboveMatch = text.match(PRICE_ABOVE_RE);

  if (aboveMatch) {
    result.minPrice = String(
      normalizePrice(aboveMatch[1], aboveMatch[0])
    );

    text = text.replace(aboveMatch[0], ' ');
  }

  // STANDALONE PRICE
  if (!result.maxPrice) {
    const bareMatch = text.match(PRICE_BARE_RE);

    if (bareMatch) {
      result.maxPrice = String(
        normalizePrice(bareMatch[1], bareMatch[0])
      );

      text = text.replace(bareMatch[0], ' ');
    }
  }


  // DISTRICT
  // longest match first
  const districtKeys = Object.keys(DISTRICT_MAP).sort(
    (a, b) => b.length - a.length
  );

  for (const key of districtKeys) {
    if (text.includes(key)) {
      result.district = DISTRICT_MAP[key];

      text = text.replace(key, ' ');

      break;
    }
  }

  // CATEGORY
  const categoryKeys = Object.keys(CATEGORY_MAP).sort(
    (a, b) => b.length - a.length
  );

  for (const key of categoryKeys) {
    const regex = new RegExp(`(?:^|\\s)${key}(?:\\s|$)`, 'i');

    if (regex.test(text)) {
      result.category = CATEGORY_MAP[key];

      text = text.replace(regex, ' ');

      break;
    }
  }

  // STATUS
  for (const [key, value] of Object.entries(STATUS_MAP)) {
    if (text.includes(key)) {
      result.status = value;

      text = text.replace(key, ' ');

      break;
    }
  }
  // CLEAN REMAINING WORDS

  const remaining = text
    .split(/\s+/)
    .map((word) =>
      word
        .replace(/[^\w]/g, '')
        .trim()
    )
    .filter(
      (word) =>
        word.length > 1 &&
        !STOPWORDS.has(word)
    );

  result.search = remaining.join(' ').trim();

  return result;
}


// QUERY DESCRIPTION

export function describeQuery(parsed = {}) {
  const parts = [];

  if (parsed.category) {
    parts.push(parsed.category);
  }

  if (parsed.district) {
    parts.push(parsed.district);
  }

  if (parsed.minPrice && parsed.maxPrice) {
    parts.push(
      `₹${Number(parsed.minPrice).toLocaleString(
        'en-IN'
      )} - ₹${Number(parsed.maxPrice).toLocaleString(
        'en-IN'
      )}`
    );
  } else if (parsed.maxPrice) {
    parts.push(
      `under ₹${Number(parsed.maxPrice).toLocaleString(
        'en-IN'
      )}`
    );
  } else if (parsed.minPrice) {
    parts.push(
      `above ₹${Number(parsed.minPrice).toLocaleString(
        'en-IN'
      )}`
    );
  }

  if (parsed.status) {
    parts.push(parsed.status);
  }

  if (parsed.search) {
    parts.push(`"${parsed.search}"`);
  }

  return parts.join(' · ');
}
