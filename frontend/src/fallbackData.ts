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
}

export const FALLBACK_RESTAURANTS: FallbackRestaurant[] = [
  {
    id: 'rest-spice-box',
    name: 'The Spice Box Kitchen',
    description: 'Authentic Hyderabadi dum biryanis, slow-cooked gravies & char-grilled kebabs.',
    deliveryZone: 'zone-central-demo',
    isOpen: true,
    cuisine: 'Biryani • North Indian • Mughlai',
    rating: 4.8,
    deliveryTime: '25–30 mins',
    priceForTwo: '₹450 for two',
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'rest-dosa-corner',
    name: 'Madras Tiffin Room',
    description: 'Ghee-roasted golden dosas, steaming soft idlis & freshly brewed filter kaapi.',
    deliveryZone: 'zone-central-demo',
    isOpen: true,
    cuisine: 'South Indian • Tiffin • Coffee',
    rating: 4.7,
    deliveryTime: '20–25 mins',
    priceForTwo: '₹300 for two',
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'rest-wok-express',
    name: 'Dragon Wok Express',
    description: 'Sizzling wok-tossed noodles, spicy schezwan momos & crispy Asian appetizers.',
    deliveryZone: 'zone-north-demo',
    isOpen: true,
    cuisine: 'Pan-Asian • Noodles • Dimsums',
    rating: 4.6,
    deliveryTime: '30–35 mins',
    priceForTwo: '₹400 for two',
    imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&auto=format&fit=crop&q=80'
  }
];
