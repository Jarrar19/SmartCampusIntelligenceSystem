import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function cleanStr(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Compute similarity score between two strings
function similarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return minLen / maxLen;
  }
  // Levenshtein distance
  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null)
  );
  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  const dist = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return (maxLen - dist) / maxLen;
}

// Normalize spelling duplicates like "ss" -> "s", "aa" -> "a", etc.
function normalizePhonetic(str: string): string {
  return cleanStr(str)
    .replace(/hussain/g, 'husain')
    .replace(/ss+/g, 's')
    .replace(/ee+/g, 'e')
    .replace(/oo+/g, 'o')
    .replace(/aa+/g, 'a')
    .replace(/ii+/g, 'i')
    .replace(/dd+/g, 'd')
    .replace(/tt+/g, 't')
    .replace(/mm+/g, 'm')
    .replace(/nn+/g, 'n')
    .replace(/pp+/g, 'p')
    .replace(/rr+/g, 'r');
}

async function findMatch(input: string) {
  const cleanInput = cleanStr(input);
  const phoneticInput = normalizePhonetic(input);
  const inputUpper = input.trim().toUpperCase();

  // 1. Direct check in User table
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.trim().toLowerCase() },
        { prn: inputUpper },
      ],
    },
  });
  if (user) return { user, source: 'Direct User' };

  // Fetch all users and roster to do high-speed in-memory fuzzy matching
  const allUsers = await prisma.user.findMany();
  const allRoster = await prisma.studentRoster.findMany();

  // Candidate scoring
  type Candidate = { score: number; user?: any; roster?: any; reason: string };
  const candidates: Candidate[] = [];

  const evaluateCandidate = (item: any, isRoster: boolean) => {
    const fullName = item.fullName || '';
    const email = item.email || '';
    const prn = item.prn || '';

    const nameParts = fullName.toLowerCase().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || '';
    const middleName = nameParts.length > 2 ? nameParts[1] : '';
    const lastName = nameParts[nameParts.length - 1] || '';

    const emailUsername = email.split('@')[0].toLowerCase();
    const cleanEmailUser = cleanStr(emailUsername);
    const cleanFullName = cleanStr(fullName);
    const cleanFirstLast = cleanStr(`${firstName}${lastName}`);
    const cleanLastFirst = cleanStr(`${lastName}${firstName}`);
    const cleanPRN = cleanStr(prn);

    // Exact matches
    if (cleanInput === cleanPRN || cleanInput === cleanEmailUser) {
      candidates.push({ score: 100, [isRoster ? 'roster' : 'user']: item, reason: 'Exact PRN or Email user' });
      return;
    }
    if (cleanInput === cleanFirstLast || cleanInput === cleanFullName || cleanInput === cleanLastFirst) {
      candidates.push({ score: 95, [isRoster ? 'roster' : 'user']: item, reason: 'Exact Name Combination' });
      return;
    }
    if (cleanInput === cleanStr(firstName) && firstName.length >= 3) {
      candidates.push({ score: 90, [isRoster ? 'roster' : 'user']: item, reason: 'Exact First Name' });
      return;
    }

    // Phonetic / spelling matches
    const phonFirstLast = normalizePhonetic(`${firstName}${lastName}`);
    const phonFullName = normalizePhonetic(fullName);
    const phonEmailUser = normalizePhonetic(emailUsername);

    if (phoneticInput === phonFirstLast || phoneticInput === phonFullName || phoneticInput === phonEmailUser) {
      candidates.push({ score: 88, [isRoster ? 'roster' : 'user']: item, reason: 'Phonetic Exact' });
      return;
    }

    // Substring / token matches
    if (cleanInput.length >= 4) {
      if (cleanFullName.includes(cleanInput) || cleanFirstLast.includes(cleanInput)) {
        candidates.push({ score: 85, [isRoster ? 'roster' : 'user']: item, reason: 'Substring match in name' });
        return;
      }
      if (cleanInput.includes(cleanStr(firstName)) && firstName.length >= 4) {
        candidates.push({ score: 80, [isRoster ? 'roster' : 'user']: item, reason: 'Input contains first name' });
        return;
      }
      if (cleanInput.includes(cleanStr(lastName)) && lastName.length >= 4) {
        candidates.push({ score: 75, [isRoster ? 'roster' : 'user']: item, reason: 'Input contains last name' });
        return;
      }
    }

    // Fuzzy similarity
    const sim1 = similarity(phoneticInput, phonFirstLast);
    const sim2 = similarity(phoneticInput, phonEmailUser);
    const sim3 = similarity(cleanInput, cleanFirstLast);
    const maxSim = Math.max(sim1, sim2, sim3);

    if (maxSim >= 0.75) {
      candidates.push({ score: maxSim * 70, [isRoster ? 'roster' : 'user']: item, reason: `Fuzzy Similarity ${(maxSim * 100).toFixed(0)}%` });
    }
  };

  for (const u of allUsers) evaluateCandidate(u, false);
  for (const r of allRoster) evaluateCandidate(r, true);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

async function testInputs() {
  const testCases = [
    'burhanuddinhussain',
    'burhanuddinhusain',
    'burhanuddin',
    'burhan',
    'burhanuddinhusain.aiml23@sbjit.edu.in',
    'CM23061',
    'cm23061',
    'shivamjadhav',
    'shivam jadhav',
    'shivam',
    'jadhav',
    'shivamaj',
    'shivamaj.aiml23@sbjit.edu.in',
    'CM23030',
    'cm23030',
    'rajurkude',
    'chaitanyabagde',
    'sanskrutimishra',
    'himanshukakde',
    'saraganvir',
    'jarrarkhan',
  ];

  console.log('Testing Test Cases:');
  for (const tc of testCases) {
    const res = await findMatch(tc);
    const person = res?.user || res?.roster;
    console.log(`Input: "${tc.padEnd(35)}" => Found: ${person ? `${person.fullName} (${person.prn || person.email}) [Score: ${res?.score}, Reason: ${res?.reason}]` : 'NOT FOUND'}`);
  }
}

testInputs()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
