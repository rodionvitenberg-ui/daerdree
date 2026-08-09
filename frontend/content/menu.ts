// content/menu.ts
// Digital menu data — single source of truth for the drinks.
// Drink names, ingredients, ABV and sizes are universal (English) as in the PDF.

export type MenuItem = {
  name: string;
  category?: string;    // subgroup label (coffee: black / cold / milk / signature, tea: black / green / karkade)
  size?: string;        // volume, e.g. "250 ml"
  ingredients?: string; // cocktail composition
  abv?: string;         // alcohol by volume for beer
  price?: string;       // simple price (coffee, tea, shots)
  priceGlass?: string;  // wine: 0.2 l
  priceBottle?: string; // wine: 0.75 l
};

export type MenuSection = {
  id: string;
  eyebrow?: string;     // top small label, e.g. "Coffee Menu"
  note?: string;        // shared note, e.g. "Any tea pot (300 ml) — €4.00"
  items: MenuItem[];
};

// Tea has fixed pot price for every item
const TEA_POT_PRICE = "€4.00";

export const MENU_SECTIONS: MenuSection[] = [
  // ============ COFFEE ============
  {
    id: "coffee",
    eyebrow: "Coffee Menu",
    items: [
      // Black coffee
      { name: "Espresso", category: "black", size: "40 ml", price: "€2.50" },
      { name: "Americano", category: "black", size: "250 ml", price: "€3.00" },
      // Cold coffee
      { name: "Iced Latte", category: "cold", size: "400 ml", price: "€4.00" },
      { name: "Iced Raf", category: "cold", size: "300 ml", price: "€4.50" },
      // Milk coffee
      { name: "Cappuccino", category: "milk", size: "250 ml", price: "€3.50" },
      { name: "Latte", category: "milk", size: "350 ml", price: "€4.00" },
      { name: "Raf", category: "milk", size: "250 ml", price: "€4.50" },
      { name: "Matcha Latte", category: "milk", size: "250 ml", price: "€4.50" },
      // Signature
      { name: "Bumble", category: "signature", size: "400 ml", price: "€4.50" },
      { name: "Espresso Tonic", category: "signature", size: "400 ml", price: "€4.00" },
      { name: "Basil Espresso Tonic", category: "signature", size: "400 ml", price: "€4.50" },
    ],
  },

  // ============ TEA ============
  {
    id: "tea",
    eyebrow: "Tea Menu",
    note: `Any tea pot (300 ml) — ${TEA_POT_PRICE}`,
    items: [
      // Black
      { name: "Black with cherry", category: "black", price: TEA_POT_PRICE },
      { name: "Black with rosehip and apple", category: "black", price: TEA_POT_PRICE },
      { name: "Black with strawberry", category: "black", price: TEA_POT_PRICE },
      { name: "Indian black with thyme", category: "black", price: TEA_POT_PRICE },
      { name: "Earl Grey with bergamot", category: "black", price: TEA_POT_PRICE },
      // Green
      { name: "Oolong", category: "green", price: TEA_POT_PRICE },
      { name: "Mango Oolong", category: "green", price: TEA_POT_PRICE },
      { name: "Strawberry Oolong", category: "green", price: TEA_POT_PRICE },
      // Karkade
      { name: "Karkade", category: "karkade", price: TEA_POT_PRICE },
    ],
  },

  // ============ COCKTAILS ============
  {
    id: "cocktails",
    eyebrow: "Cocktails",
    items: [
      { name: "Aperol Spritz", ingredients: "Aperol, Prosecco, soda water", price: "€7" },
      { name: "Pina Colada", ingredients: "White rum, cream, coconut syrup, pineapple juice", price: "€7" },
      { name: "Dragonborn", ingredients: "Gin, Aperol, lemon juice, pineapple juice, tonic", price: "€6.5" },
      { name: "Irish Coffee", ingredients: "Whisky, espresso, simple syrup, water", price: "€6.5" },
      { name: "Hugo", ingredients: "Prosecco, soda water, elderflower syrup", price: "€6" },
      { name: "Afterlife", ingredients: "Whisky, apple liqueur, lemon juice, simple syrup, soda water", price: "€6" },
      { name: "Mojito", ingredients: "White rum, soda water, mint syrup, lemon juice", price: "€6" },
      { name: "Afterlife", ingredients: "Whisky, apple liqueur, lemon juice, simple syrup, soda water", price: "€5.5" },
      { name: "Zombee", ingredients: "Dark rum, cinnamon syrup, grapefruit juice, lemon juice", price: "€5.5" },
      { name: "Arrakeen", ingredients: "Amaretto, lemon juice, simple syrup", price: "€5.5" },
      { name: "Phantom", ingredients: "Tequila, Triple sec, lemon juice, 7up", price: "€5" },
      { name: "White Russian", ingredients: "Vodka, cream, coffee liqueur", price: "€5" },
      { name: "Grynch", ingredients: "Gin, tonic, basil syrup, lemon", price: "€5" },
    ],
  },

  // ============ BEER ============
  {
    id: "beer",
    eyebrow: "Beer",
    items: [
      { name: "Paulaner", size: "0.5 l", abv: "5.5%", price: "€6.0" },
      { name: "Corona", size: "0.33 l", abv: "4.5%", price: "€4.0" },
      { name: "Keo", size: "0.50 l", abv: "4.5%", price: "€4.0" },
      { name: "Guinness", size: "0.44 l", abv: "4.2%", price: "€4.5" },
      { name: "Septem Porter", size: "0.33 l", abv: "5.5%", price: "€5.5" },
      { name: "Milo Klefits cherry cider", size: "0.33 l", abv: "4.5%", price: "€4.0" },
    ],
  },

  // ============ WINE ============
  {
    id: "wine",
    eyebrow: "Wine",
    items: [
      { name: "Petrides", priceGlass: "€7.0", priceBottle: "€22.0" },
      { name: "Sauvignon blanc", priceGlass: "€6.0", priceBottle: "€18.0" },
      { name: "Merlot", priceGlass: "€6.0", priceBottle: "€18.0" },
      { name: "Prosecco", priceGlass: "€6.0", priceBottle: "€18.0" },
    ],
  },

  // ============ STRONG SPIRITS (SHOTS) ============
  {
    id: "shots",
    eyebrow: "Strong Spirits",
    items: [
      { name: "Absolut vodka", price: "€3.0" },
      { name: "Zubrobka vodka", price: "€4.0" },
      { name: "Befeater gin", price: "€3.0" },
      { name: "Monkey shoulder whisky", price: "€5.0" },
    ],
  },
];

// Stable ordering for categories inside a section (coffee & tea)
export const COFFEE_CATEGORIES: { key: string; label: string }[] = [
  { key: "black", label: "Black Coffee" },
  { key: "cold", label: "Cold Coffee" },
  { key: "milk", label: "Milk Coffee" },
  { key: "signature", label: "Signature" },
];

export const TEA_CATEGORIES: { key: string; label: string }[] = [
  { key: "black", label: "Black" },
  { key: "green", label: "Green" },
  { key: "karkade", label: "Karkade" },
];