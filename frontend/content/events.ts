// content/events.ts

export const EVENTS_DATA = [
  {
    id: 1,
    date: "12 JAN",
    time: "19:00",
    title: "D&D: Night of the Zealot",
    category: "Tabletop RPG",
    image: "/events/3.webp", // Убедись, что картинки есть в public/events/ или убери image пока
    description: "Join the campaign for beginner adventurers. Pre-generated characters provided.",
    price: "FREE",
  },
  {
    id: 2,
    date: "14 JAN",
    time: "20:00",
    title: "Movie Night: Cyberpunk 2077",
    category: "Screening",
    image: "/events/1.webp",
    description: "Screening of the legendary anime series followed by thematic cocktails.",
    price: "Entry by order",
  },
  {
    id: 3,
    date: "18 JAN",
    time: "18:00",
    title: "MTG: Commander Night",
    category: "TCG",
    image: "/events/2.webp",
    description: "Casual commander play. Bring your deck or borrow one of ours.",
    price: "FREE",
  },
];

export const HIRE_PACKAGES = [
  {
    title: "The Skirmish",
    subtitle: "Small Groups (5-10)",
    features: ["Reserved Table", "Welcome Shots", "Snack Platter", "Board Game Guru"],
  },
  {
    title: "The Campaign",
    subtitle: "Parties (10-30)",
    features: ["Private Zone", "Full Buffet Catering", "Open Bar (2 hours)", "Dedicated GM"],
  },
  {
    title: "World Domination",
    subtitle: "Full Venue Hire",
    features: ["Exclusive Access", "Custom Menu", "DJ / Playlist Control", "Staff Cosplay"],
  },
];