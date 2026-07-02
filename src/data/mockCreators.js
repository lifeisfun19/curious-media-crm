// Mock creator data — ported from the approved HTML's mock() generator,
// extended with phone + email fields required by Phase 2.

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

// Build the platforms[] array for a creator — every creator has at least
// one platform (the "seed" platform for this row), plus a chance of being
// on 1-2 additional platforms too, since real creators are rarely on just
// one channel.
function makePlatforms(seedPlat, seed) {
  const list = [{ platform: seedPlat, link: platformLink(seedPlat) + "/" + seed }];
  const others = PLATFORMS.filter((p) => p !== seedPlat);
  // Deterministic-ish extra platforms based on the seed so results are
  // stable across renders in dev (no reliance on Math.random for this part).
  others.forEach((p, i) => {
    if ((seed + i) % 5 === 0) {
      list.push({ platform: p, link: platformLink(p) + "/" + seed });
    }
  });
  return list;
}

export function generateMockCreators() {
  const rows = [];
  let id = 0;

  LANGS.forEach((lang) => {
    CATS.forEach((cat) => {
      PLATFORMS.forEach((plat) => {
        if (Math.random() < 0.3 && id > 15) return;
        const ns = NAMES[lang] || NAMES.Telugu;
        const tierRoll = Math.random();
        let followers;
        if (tierRoll < 0.2)
          followers = Math.round((1000 + Math.random() * 8999) / 100) * 100;
        else if (tierRoll < 0.5)
          followers =
            Math.round((10000 + Math.random() * 89999) / 1000) * 1000;
        else if (tierRoll < 0.78)
          followers =
            Math.round((100000 + Math.random() * 399999) / 1000) * 1000;
        else
          followers =
            Math.round((1000000 + Math.random() * 9000000) / 10000) * 10000;

        const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
        const name =
          ns[id % ns.length] + (Math.random() < 0.4 ? " " + cat : "");

        rows.push({
          id: "cr_" + id,
          name,
          category: cat, // Niche (Phase 2 rename)
          language: lang,
          platforms: makePlatforms(plat, id),
          gender,
          followers,
          avgViews:
            Math.round((8000 + Math.random() * 3500000) / 1000) * 1000,
          phone: makePhone(id),
          email: slugify(name) + "@creatormail.com",
          commercial: "",
          remark: "",
        });
        id++;
      });
    });
  });

  return rows;
}
