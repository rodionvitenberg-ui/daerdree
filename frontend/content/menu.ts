// content/menu.ts
// Digital menu data — single source of truth for the drinks.
// Drink names, ingredients, ABV and sizes are universal (English) as in the PDF.

export type MenuItem = {
  name: string;
  size?: string;        // volume, e.g. "40 ml"
  ingredients?: string; // cocktail composition
  abv?: string;         // alcohol by volume for beer
  price?: string;       // simple price (coffee, tea, shots, zero-beer)
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
      { name: "Espresso", size: "40 ml", price: "€2.50" },
      { name: "Americano", size: "250 ml", price: "€3.00" },
      // Milk coffee
      { name: "Cappuccino", size: "250 ml", price: "€3.50" },
      { name: "Latte", size: "350 ml", price: "€4.00" },
      // Signature
      { name: "Bumble", size: "400 ml", price: "€4.50" },
      { name: "Espresso Tonic", size: "400 ml", price: "€4.00" },
      { name: "Basil Espresso Tonic", size: "400 ml", price: "€4.50" },
    ],
  },

  // ============ TEA ============
  {
    id: "tea",
    eyebrow: "Tea Menu",
    note: `Any tea pot (300 ml) — ${TEA_POT_PRICE}`,
    items: [
      // Black
      { name: "Black", price: TEA_POT_PRICE },
      { name: "Black with cherry", price: TEA_POT_PRICE },
      { name: "Black with rosehip and apple", price: TEA_POT_PRICE },
      { name: "Black with strawberry", price: TEA_POT_PRICE },
      { name: "Indian black with thyme", price: TEA_POT_PRICE },
      { name: "Earl Grey with bergamot", price: TEA_POT_PRICE },
      // Green
      { name: "Green", price: TEA_POT_PRICE },
      { name: "Oolong", price: TEA_POT_PRICE },
      { name: "Mango Oolong", price: TEA_POT_PRICE },
      { name: "Strawberry Oolong", price: TEA_POT_PRICE },
      // Karkade
      { name: "Karkade", price: TEA_POT_PRICE },
      // Extras
      { name: "Additional syrup", price: "€0.50" },
    ],
  },

  // ============ COCKTAILS ============
  {
    id: "cocktails",
    eyebrow: "Cocktails",
    items: [
      { name: "Aperol Spritz", ingredients: "Aperol, Prosecco, soda water", price: "€7" },
      { name: "Dragonborn", ingredients: "Gin, Aperol, lemon juice, pineapple juice, tonic", price: "€6.5" },
      { name: "Irish Coffee", ingredients: "Whisky, espresso, simple syrup, water", price: "€6.5" },
      { name: "Hugo", ingredients: "Prosecco, soda water, elderflower syrup", price: "€6" },
      { name: "Mojito", ingredients: "White rum, soda/tonic, mint syrup, lemon juice", price: "€6" },
      { name: "Afterlife", ingredients: "Whisky, apple liqueur, lemon juice, simple syrup, soda water", price: "€5" },
      { name: "Zombee", ingredients: "Dark rum, cinnamon syrup, grapefruit juice, lemon juice", price: "€5.5" },
      { name: "Arrakeen", ingredients: "Amaretto, lemon juice, simple syrup", price: "€6" },
      { name: "Phantom", ingredients: "Tequila, Triple sec, lemon juice, 7up", price: "€5" },
      { name: "Grynch", ingredients: "Gin, tonic, basil syrup, lemon", price: "€5" },
    ],
  },

  // ============ BEER ============
  {
    id: "beer",
    eyebrow: "Beer",
    items: [
      { name: "Paulaner", size: "0.51 l", abv: "5.5%", price: "€6.0" },
      { name: "Corona", size: "0.33 l", abv: "4.5%", price: "€4.0" },
      { name: "Keo", size: "0.50 l", abv: "4.5%", price: "€4.0" },
      { name: "Guinness", size: "0.44 l", abv: "4.2%", price: "€5.0" },
      { name: "Milo Kleftis cherry cider", size: "0.33 l", abv: "4.5%", price: "€4.0" },
      { name: "Grimbergen red ale", size: "0.33 l", abv: "4.5%", price: "€5.0" },
    ],
  },

  // ============ 0% BEER ============
  {
    id: "zero-beer",
    eyebrow: "0% Beer",
    items: [
      { name: "Corona", size: "0.33 l", price: "€4.00" },
      { name: "Guinness", size: "0.45 l", price: "€5.50" },
      { name: "Kopparberg cider", size: "0.33 l", price: "€4.50" },
    ],
  },

  // ============ WINE ============
  {
    id: "wine",
    eyebrow: "Wine",
    items: [
      { name: "Xynisteri", priceGlass: "€6.0", priceBottle: "€18.0" },
      { name: "Merlot", priceGlass: "€6.0", priceBottle: "€18.0" },
      { name: "Prosecco", priceGlass: "€6.0", priceBottle: "€18.0" },
    ],
  },

  // ============ STRONG SPIRITS (SHOTS) ============
  {
    id: "shots",
    eyebrow: "Strong Spirits",
    items: [
      { name: "Zubrobka vodka", price: "€4.0" },
      { name: "Befeater gin", price: "€3.0" },
      { name: "Monkey shoulder whisky", price: "€5.0" },
      { name: "Plantation rum (dark/white)", price: "€3.0" },
      { name: "Sierra tequila white", price: "€3.0" },
    ],
  },
];