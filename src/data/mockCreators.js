// Mock creator data — one row per (person, platform) combination. A real
// creator who is on both Instagram and YouTube is represented as TWO
// separate creator records here (same name/phone/email, different id +
// platform + profileLink + followers), matching how the rest of the app
// treats platforms as distinct CRM entries rather than a list on one row.

import { CATS, LANGS, PLATFORMS, GENDERS } from "../utils/constants";

const NAMES = {
  Telugu: [
    "Hyderabad Hustle",
    "Telugu Tales",
    "Tollywood Tea",
    "Andhra Adda",
    "Charminar Chai",
  ],
  Tamil: [
    "Chennai Vibes",
    "Kollywood Konnect",
    "Marina Moods",
    "Tamil Tadka",
    "Madras Masti",
  ],
  Hindi: [
    "Dilli Diaries",
    "Mumbai Masala",
    "Hindi Hustle",
    "Bollywood Bytes",
    "Desi Drama",
  ],
  Malayalam: [
    "Kochi Kadhakal",
    "Kerala Kicks",
    "Backwater Buzz",
    "Mollywood Moments",
    "Malabar Mood",
  ],
  Kannada: [
    "Bengaluru Buzz",
    "Mysuru Moments",
    "Kannada Kaleidoscope",
    "Namma Ooru",
    "Cauvery Chats",
  ],
  Bengali: [
    "Kolkata Kahani",
    "Bong Vibes",
    "Durga Tales",
    "Sundarbans Stories",
    "Howrah Hustle",
  ],
  English: [
    "The Creator Hub",
    "Global Vibes",
    "English Reels",
    "World Content",
    "Trend Studio",
  ],
};

function platformLink(plat) {
  if (plat === "Instagram") return "https://instagram.com";
  if (plat === "YouTube") return "https://youtube.com";
  if (plat === "LinkedIn") return "https://linkedin.com";
  return "https://x.com";
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function makePhone(seed) {
  // Deterministic-ish 10 digit Indian mobile style number
  const base = 7000000000 + (seed * 9973) % 999999999;
  return "+91 " + String(base).slice(0, 5) + " " + String(base).slice(5, 10);
}

function randomFollowers() {
  const tierRoll = Math.random();
  if (tierRoll < 0.2)
    return Math.round((1000 + Math.random() * 8999) / 100) * 100;
  if (tierRoll < 0.5)
    return Math.round((10000 + Math.random() * 89999) / 1000) * 1000;
  if (tierRoll < 0.78)
    return Math.round((100000 + Math.random() * 399999) / 1000) * 1000;
  return Math.round((1000000 + Math.random() * 9000000) / 10000) * 10000;
}

// Which platforms a given "person" is on — most creators are on just one
// platform, some are on two, so the app has real examples of the same
// person showing up as multiple entries.
function pickPlatforms(seedPlat, personSeed) {
  const list = [seedPlat];
  const others = PLATFORMS.filter((p) => p !== seedPlat);
  others.forEach((p, i) => {
    if ((personSeed + i) % 5 === 0) list.push(p);
  });
  return list;
}

export function generateMockCreators() {
  const rows = [];
  let id = 0;
  let personSeed = 0;

  LANGS.forEach((lang) => {
    CATS.forEach((cat) => {
      PLATFORMS.forEach((plat) => {
        if (Math.random() < 0.3 && id > 15) return;

        const ns = NAMES[lang] || NAMES.Telugu;
        const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
        const name =
          ns[personSeed % ns.length] + (Math.random() < 0.4 ? " " + cat : "");
        const phone = makePhone(personSeed);
        const email = slugify(name) + "@creatormail.com";

        // This "person" may be on more than one platform — each platform
        // becomes its own standalone creator record (own id, own
        // followers/commercial/remark), sharing name/phone/email/gender.
        const personPlatforms = pickPlatforms(plat, personSeed);

        personPlatforms.forEach((platName) => {
          rows.push({
            id: "cr_" + id,
            name,
            category: cat, // Niche (Phase 2 rename)
            language: lang,
            platform: platName,
            profileLink: platformLink(platName) + "/" + personSeed,
            gender,
            followers: randomFollowers(),
            avgViews: Math.round((8000 + Math.random() * 3500000) / 1000) * 1000,
            phone,
            email,
            commercial: "",
            remark: "",
          });
          id++;
        });

        personSeed++;
      });
    });
  });

  return rows;
}
