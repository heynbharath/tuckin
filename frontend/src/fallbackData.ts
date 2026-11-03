export interface FallbackRestaurant {
  id: string;
  name: string;
  description: string;
  deliveryZone: string;
  isOpen: boolean;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  priceForTwo: string;
  imageUrl: string;
  featuredTag?: string;
  chefPedigree?: string;
  hygieneScore?: string;
  popularDishes?: string[];
}

export interface FallbackMenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  pricePaise: number;
  available: boolean;
  category: string;
  isVeg: boolean;
  rating: number;
  votes: number;
  imageUrl: string;
  isBestseller?: boolean;
  calories?: number;
  proteinGrams?: number;
  prepTime?: string;
  dietaryTags?: string[];
}

export interface CuratedCollection {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  imageUrl: string;
  kitchenId: string;
}

export interface ConnoisseurReview {
  id: string;
  quote: string;
  author: string;
  location: string;
  rating: number;
  dish: string;
}

export const CURATED_COLLECTIONS: CuratedCollection[] = [
  {
    id: 'col-biryani',
    title: 'Midnight Dum & Charcoal Kebabs',
    subtitle: 'Slow-cooked over 6 hours in sealed brass handis. Saffron, pure cow ghee & whole spices.',
    tag: '👑 ROYAL HERITAGE',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    kitchenId: 'rest-spice-box'
  },
  {
    id: 'col-pizza',
    title: 'Wood-Fired Neapolitan Crusts',
    subtitle: '48-hour fermented Italian sourdough blistered at 450°C. San Marzano DOP sugo & fresh burrata.',
    tag: '🍕 ARTISANAL CRUST',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    kitchenId: 'rest-artisan-pizza'
  },
  {
    id: 'col-tiffin',
    title: 'Ghee Podi Tiffin & Filter Kaapi',
    subtitle: 'Paper-thin golden fermented crepes roasted in organic cow ghee, with three stone-ground chutneys.',
    tag: '🥞 SOUTHERN SOUL',
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
    kitchenId: 'rest-dosa-corner'
  },
  {
    id: 'col-burger',
    title: 'Truffle Smash & Loaded Fries',
    subtitle: 'Double seared crust patties, black truffle glazed butter & golden crisp skin-on fries.',
    tag: '🍔 CRAFT GOURMET',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80',
    kitchenId: 'rest-burger-brew'
  }
];

export const CONNOISSEUR_REVIEWS: ConnoisseurReview[] = [
  {
    id: 'rev-1',
    quote: 'The thermal retention is mind-blowing. The Royal Dum Biryani was genuinely piping hot at my doorstep in 16 minutes.',
    author: 'Ananya Raghavan',
    location: 'Indiranagar 100ft Rd',
    rating: 5,
    dish: 'Royal Veg Dum Biryani'
  },
  {
    id: 'rev-2',
    quote: 'The wood-fired sourdough crust has that authentic Naples blister. Best artisan pizza delivery experience in Bengaluru.',
    author: 'Rohan Mehta',
    location: 'Koramangala 4th Block',
    rating: 5,
    dish: 'Margherita Burrata Pizza'
  },
  {
    id: 'rev-3',
    quote: 'Crispy ghee roast dosa that actually stays crisp during dispatch. Plus the filter coffee arrived frothed to perfection.',
    author: 'Deepika Sundaram',
    location: 'HSR Layout Sector 1',
    rating: 5,
    dish: 'Ghee Roast Masala Dosa'
  }
];

export const FALLBACK_RESTAURANTS: FallbackRestaurant[] = [
  {
    id: 'rest-spice-box',
    name: 'The Spice Box Kitchen',
    description: 'Authentic Hyderabadi dum biryanis, slow-cooked gravies & char-grilled kebabs.',
    deliveryZone: 'zone-central-demo',
    isOpen: true,
    cuisine: 'Biryani • North Indian • Mughlai',
    rating: 4.9,
    deliveryTime: '22–26 mins',
    priceForTwo: '₹450 for two',
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
    featuredTag: '🔥 50% OFF UP TO ₹100',
    chefPedigree: 'Ex-Bukhara & Dum Pukht Culinary Team',
    hygieneScore: '5-Star Certified Clean Room Prep',
    popularDishes: ['Royal Dum Biryani', 'Paneer Malai Tikka', 'Butter Garlic Naan']
  },
  {
    id: 'rest-dosa-corner',
    name: 'Madras Tiffin Room',
    description: 'Ghee-roasted golden dosas, steaming soft idlis & freshly brewed filter kaapi.',
    deliveryZone: 'zone-central-demo',
    isOpen: true,
    cuisine: 'South Indian • Tiffin • Coffee',
    rating: 4.8,
    deliveryTime: '18–22 mins',
    priceForTwo: '₹300 for two',
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
    featuredTag: '⚡ FREE DELIVERY',
    chefPedigree: 'Master Tiffin Craftsmen from Mylapore',
    hygieneScore: 'Stone-Ground Daily • 100% Organic Ghee',
    popularDishes: ['Ghee Roast Masala Dosa', 'Steamed Idli Sambar', 'Filter Kaapi']
  },
  {
    id: 'rest-wok-express',
    name: 'Dragon Wok Express',
    description: 'Sizzling wok-tossed noodles, spicy schezwan momos & crispy Asian appetizers.',
    deliveryZone: 'zone-north-demo',
    isOpen: true,
    cuisine: 'Pan-Asian • Noodles • Dimsums',
    rating: 4.7,
    deliveryTime: '25–30 mins',
    priceForTwo: '₹400 for two',
    imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80',
    featuredTag: '🥢 CHEF SPECIALS',
    chefPedigree: 'High-Heat Cantonese Wok Mastery',
    hygieneScore: 'Handmade Crystal Dimsum Standard',
    popularDishes: ['Hakka Chilli Noodles', 'Crispy Dimsums']
  },
  {
    id: 'rest-burger-brew',
    name: 'Smash & Brew Craft Burgers',
    description: 'Truffle mushroom smash burgers, loaded peri-peri fries & thick gourmet shakes.',
    deliveryZone: 'zone-central-demo',
    isOpen: true,
    cuisine: 'American • Burgers • Shakes',
    rating: 4.9,
    deliveryTime: '20–25 mins',
    priceForTwo: '₹500 for two',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80',
    featuredTag: '🍔 TOP RATED 2026',
    chefPedigree: 'Artisanal Brioche & Truffle Craft',
    hygieneScore: '100% Plant-Glazed Precision Grill',
    popularDishes: ['Truffle Smash Burger', 'Peri-Peri Fries', 'Belgian Chocolate Shake']
  },
  {
    id: 'rest-artisan-pizza',
    name: 'Via Napoli Artisan Pizza',
    description: '48-hour fermented sourdough wood-fired pizzas, burrata salads & tiramisu.',
    deliveryZone: 'zone-central-demo',
    isOpen: true,
    cuisine: 'Italian • Neapolitan Pizza • Pasta',
    rating: 4.8,
    deliveryTime: '24–28 mins',
    priceForTwo: '₹600 for two',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    featuredTag: '🍕 WOOD-FIRED',
    chefPedigree: 'AVPN Certified Neapolitan Pizzaiolo',
    hygieneScore: 'Imported Italian Sourdough Fermentation',
    popularDishes: ['Margherita Burrata Pizza', 'Truffle Fettuccine', 'Classic Tiramisu']
  }
];

export const FALLBACK_MENU_ITEMS: FallbackMenuItem[] = [
  // The Spice Box Kitchen
  {
    id: 'item-biryani-001',
    restaurantId: 'rest-spice-box',
    name: 'Royal Veg Dum Biryani',
    description: 'Aromatic long-grain basmati rice layered with garden veggies, saffron & whole spices. Served with creamy mirchi ka salan & burani raita.',
    pricePaise: 24000,
    available: true,
    category: 'Biryani',
    isVeg: true,
    rating: 4.9,
    votes: 342,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80',
    isBestseller: true,
    calories: 520,
    proteinGrams: 18,
    prepTime: '14 mins',
    dietaryTags: ['Saffron Infused', '100% Pure Ghee', 'Slow Dum Fired']
  },
  {
    id: 'item-biryani-002',
    restaurantId: 'rest-spice-box',
    name: 'Paneer Tikka Biryani',
    description: 'Tandoori spiced paneer cubes slow-dum cooked with fragrant basmati rice and caramelized golden onions.',
    pricePaise: 28000,
    available: true,
    category: 'Biryani',
    isVeg: true,
    rating: 4.8,
    votes: 189,
    imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80',
    isBestseller: true,
    calories: 580,
    proteinGrams: 26,
    prepTime: '15 mins',
    dietaryTags: ['High Protein', 'Charcoal Smoked']
  },
  {
    id: 'item-starter-001',
    restaurantId: 'rest-spice-box',
    name: 'Paneer Malai Tikka',
    description: 'Melt-in-mouth cottage cheese marinated in cardamom, cashew cream & mild spices, charred in clay tandoor.',
    pricePaise: 22000,
    available: true,
    category: 'Starters',
    isVeg: true,
    rating: 4.7,
    votes: 215,
    imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=80',
    calories: 420,
    proteinGrams: 22,
    prepTime: '10 mins',
    dietaryTags: ['Clay Tandoor', 'Cashew Glaze']
  },
  {
    id: 'item-bread-001',
    restaurantId: 'rest-spice-box',
    name: 'Butter Garlic Naan',
    description: 'Fluffy handmade tandoor bread brushed with melted farm butter and roasted minced garlic.',
    pricePaise: 6000,
    available: true,
    category: 'Breads',
    isVeg: true,
    rating: 4.8,
    votes: 420,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
    isBestseller: true,
    calories: 210,
    proteinGrams: 6,
    prepTime: '6 mins',
    dietaryTags: ['Fresh Tandoor Fired']
  },

  // Madras Tiffin Room
  {
    id: 'item-dosa-001',
    restaurantId: 'rest-dosa-corner',
    name: 'Ghee Roast Masala Dosa',
    description: 'Ultra-crispy golden fermented crepe roasted with pure cow ghee, stuffed with spiced potato masala. Served with 3 chutneys & sambar.',
    pricePaise: 14000,
    available: true,
    category: 'Tiffin',
    isVeg: true,
    rating: 4.9,
    votes: 560,
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=80',
    isBestseller: true,
    calories: 380,
    proteinGrams: 10,
    prepTime: '8 mins',
    dietaryTags: ['Pure Cow Ghee', 'Traditional Ferment']
  },
  {
    id: 'item-dosa-002',
    restaurantId: 'rest-dosa-corner',
    name: 'Steamed Idli Sambar (2 pcs)',
    description: 'Steaming cloud-soft fermented rice cakes soaked in aromatic drumstick lentil sambar with coconut chutney.',
    pricePaise: 9000,
    available: true,
    category: 'Tiffin',
    isVeg: true,
    rating: 4.7,
    votes: 310,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
    calories: 180,
    proteinGrams: 8,
    prepTime: '5 mins',
    dietaryTags: ['Oil-Free Steam', 'Gluten-Free']
  },
  {
    id: 'item-beverage-001',
    restaurantId: 'rest-dosa-corner',
    name: 'Authentic Filter Kaapi',
    description: 'Traditional decoction filter coffee frothed to perfection with rich whole milk in brass davara-tumbler.',
    pricePaise: 5000,
    available: true,
    category: 'Beverages',
    isVeg: true,
    rating: 4.9,
    votes: 680,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
    isBestseller: true,
    calories: 110,
    proteinGrams: 4,
    prepTime: '4 mins',
    dietaryTags: ['Fresh Chicory Roast', 'Brass Frothed']
  },

  // Dragon Wok Express
  {
    id: 'item-wok-001',
    restaurantId: 'rest-wok-express',
    name: 'Hakka Chilli Garlic Noodles',
    description: 'High-heat wok tossed noodles with crunchy bell peppers, shredded cabbage, scallions & spicy chili-garlic oil.',
    pricePaise: 21000,
    available: true,
    category: 'Noodles',
    isVeg: true,
    rating: 4.8,
    votes: 275,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80',
    isBestseller: true,
    calories: 460,
    proteinGrams: 14,
    prepTime: '10 mins',
    dietaryTags: ['Wok Hei Fire', 'Fresh Scallions']
  },
  {
    id: 'item-wok-002',
    restaurantId: 'rest-wok-express',
    name: 'Crispy Veg Dimsums (6 pcs)',
    description: 'Delicate steamed and pan-crisped dumplings stuffed with water chestnuts, carrots & scallions, served with spicy dip.',
    pricePaise: 18000,
    available: true,
    category: 'Dimsums',
    isVeg: true,
    rating: 4.7,
    votes: 190,
    imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&auto=format&fit=crop&q=80',
    calories: 280,
    proteinGrams: 10,
    prepTime: '12 mins',
    dietaryTags: ['Hand-Folded', 'Pan-Crisped']
  },

  // Smash & Brew Craft Burgers
  {
    id: 'item-burger-001',
    restaurantId: 'rest-burger-brew',
    name: 'Truffle Mushroom Smash Burger',
    description: 'Double grilled plant-patty glazed with truffle butter, sauteed portobello mushrooms, aged cheddar & caramelized onions on brioche.',
    pricePaise: 26000,
    available: true,
    category: 'Burgers',
    isVeg: true,
    rating: 4.9,
    votes: 412,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
    isBestseller: true,
    calories: 610,
    proteinGrams: 28,
    prepTime: '12 mins',
    dietaryTags: ['Black Truffle Glaze', 'Brioche Bun', 'Chef Signature']
  },
  {
    id: 'item-burger-002',
    restaurantId: 'rest-burger-brew',
    name: 'Loaded Peri-Peri Truffle Fries',
    description: 'Skin-on golden potato fries tossed in African bird eye chili peri-peri spice with creamy garlic truffle aioli dip.',
    pricePaise: 16000,
    available: true,
    category: 'Sides',
    isVeg: true,
    rating: 4.8,
    votes: 290,
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
    isBestseller: true,
    calories: 360,
    proteinGrams: 6,
    prepTime: '8 mins',
    dietaryTags: ['Skin-On Crispy', 'Truffle Aioli']
  },
  {
    id: 'item-burger-003',
    restaurantId: 'rest-burger-brew',
    name: 'Belgian Dark Chocolate Shake',
    description: 'Slow-churned thick shake crafted with 70% Belgian Callebaut dark chocolate and Madagascar vanilla bean.',
    pricePaise: 18000,
    available: true,
    category: 'Beverages',
    isVeg: true,
    rating: 4.9,
    votes: 380,
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
    calories: 440,
    proteinGrams: 12,
    prepTime: '5 mins',
    dietaryTags: ['70% Callebaut Dark', 'Whole Cream']
  },

  // Via Napoli Artisan Pizza
  {
    id: 'item-pizza-001',
    restaurantId: 'rest-artisan-pizza',
    name: 'Margherita Burrata Woodfired Pizza',
    description: 'San Marzano tomato sugo, creamy artisanal burrata ball, fresh genovese basil & extra virgin olive oil on blistered sourdough crust.',
    pricePaise: 32000,
    available: true,
    category: 'Pizza',
    isVeg: true,
    rating: 4.9,
    votes: 510,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=80',
    isBestseller: true,
    calories: 680,
    proteinGrams: 32,
    prepTime: '14 mins',
    dietaryTags: ['48-Hr Fermented', 'Burrata Core', 'Wood-Fired 450°C']
  },
  {
    id: 'item-pizza-002',
    restaurantId: 'rest-artisan-pizza',
    name: 'Wild Mushroom Truffle Fettuccine',
    description: 'Fresh handmade pasta ribbons tossed in creamy porcini mushroom broth, parmigiano reggiano & white truffle oil.',
    pricePaise: 29000,
    available: true,
    category: 'Pasta',
    isVeg: true,
    rating: 4.8,
    votes: 260,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281229?w=500&auto=format&fit=crop&q=80',
    calories: 540,
    proteinGrams: 20,
    prepTime: '12 mins',
    dietaryTags: ['Handmade Pasta', 'Porcini Broth']
  },
  {
    id: 'item-pizza-003',
    restaurantId: 'rest-artisan-pizza',
    name: 'Classic Espresso Tiramisu',
    description: 'Coffee-soaked savoiardi ladyfinger biscuits layered with velvety mascarpone sabayon and dusted with Valrhona cocoa.',
    pricePaise: 19000,
    available: true,
    category: 'Desserts',
    isVeg: true,
    rating: 4.9,
    votes: 450,
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=80',
    isBestseller: true,
    calories: 340,
    proteinGrams: 7,
    prepTime: '4 mins',
    dietaryTags: ['Italian Mascarpone', 'Single Origin Espresso']
  }
];
