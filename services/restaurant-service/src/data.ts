export interface Restaurant {
  id: string;
  name: string;
  description: string;
  deliveryZone: string;
  isOpen: boolean;
  cuisine: string;
  rating: number;
  deliveryTime?: string;
  priceForTwo?: string;
  imageUrl?: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  pricePaise: number;
  available: boolean;
  category: string;
  isVeg?: boolean;
  imageUrl?: string;
}

export const SEED_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-spice-box',
    name: 'The Spice Box Kitchen',
    description: 'Authentic Hyderabadi dum biryanis, kebabs, and rich slow-cooked curries.',
    deliveryZone: 'zone-central-demo',
    isOpen: true,
    cuisine: 'Biryani & North Indian',
    rating: 4.8,
    deliveryTime: '25–30 mins',
    priceForTwo: '₹450 for two',
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'rest-dosa-corner',
    name: 'Madras Tiffin Room',
    description: 'Crispy ghee dosas, steaming soft idlis, and filter kaapi brewed fresh.',
    deliveryZone: 'zone-central-demo',
    isOpen: true,
    cuisine: 'South Indian Breakfast',
    rating: 4.6,
    deliveryTime: '20–25 mins',
    priceForTwo: '₹300 for two',
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'rest-wok-express',
    name: 'Dragon Wok Express',
    description: 'Sizzling wok-tossed noodles, spicy schezwan momos, and crispy appetizers.',
    deliveryZone: 'zone-north-demo',
    isOpen: true,
    cuisine: 'Pan-Asian & Indo-Chinese',
    rating: 4.5,
    deliveryTime: '30–35 mins',
    priceForTwo: '₹400 for two',
    imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80'
  }
];

export const SEED_MENU_ITEMS: MenuItem[] = [
  // The Spice Box Kitchen
  {
    id: 'item-biryani-001',
    restaurantId: 'rest-spice-box',
    name: 'Royal Veg Dum Biryani',
    description: 'Fragrant basmati rice layered with fresh vegetables and saffron spices. Served with salan and raita.',
    pricePaise: 24000,
    available: true,
    category: 'Biryani',
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'item-biryani-002',
    restaurantId: 'rest-spice-box',
    name: 'Paneer Tikka Biryani',
    description: 'Smoky tandoori paneer cubes nestled in aromatic dum spiced basmati rice.',
    pricePaise: 28000,
    available: true,
    category: 'Biryani',
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'item-starter-001',
    restaurantId: 'rest-spice-box',
    name: 'Paneer Malai Tikka',
    description: 'Tender cottage cheese marinated in fresh cream, mild spices, and char-grilled.',
    pricePaise: 22000,
    available: true,
    category: 'Starters',
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'item-bread-001',
    restaurantId: 'rest-spice-box',
    name: 'Butter Garlic Naan',
    description: 'Fluffy clay-oven baked bread brushed with butter and minced roasted garlic.',
    pricePaise: 6000,
    available: true,
    category: 'Breads',
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80'
  },

  // Madras Tiffin Room
  {
    id: 'item-dosa-001',
    restaurantId: 'rest-dosa-corner',
    name: 'Ghee Roast Masala Dosa',
    description: 'Golden crisp fermented crepe roasted with pure desi ghee, filled with spiced potato mash.',
    pricePaise: 14000,
    available: true,
    category: 'Tiffin',
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'item-dosa-002',
    restaurantId: 'rest-dosa-corner',
    name: 'Steamed Idli Sambar (2 pcs)',
    description: 'Pillow-soft steamed rice cakes drenched in piping hot lentil vegetable stew.',
    pricePaise: 9000,
    available: true,
    category: 'Tiffin',
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'item-beverage-001',
    restaurantId: 'rest-dosa-corner',
    name: 'Filter Kaapi',
    description: 'Traditional South Indian chicory blend filter coffee served foaming hot.',
    pricePaise: 5000,
    available: true,
    category: 'Beverages',
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80'
  },

  // Dragon Wok Express
  {
    id: 'item-wok-001',
    restaurantId: 'rest-wok-express',
    name: 'Hakka Chilli Garlic Noodles',
    description: 'Wok-tossed noodles tossed with bell peppers, cabbage, and homemade chili-garlic paste.',
    pricePaise: 21000,
    available: true,
    category: 'Noodles',
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'item-wok-002',
    restaurantId: 'rest-wok-express',
    name: 'Crispy Veg Dimsums (6 pcs)',
    description: 'Steamed then pan-crisped dumplings served with fiery chili dip.',
    pricePaise: 18000,
    available: true,
    category: 'Dimsums',
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'item-unavailable-demo',
    restaurantId: 'rest-spice-box',
    name: 'Seasonal Mango Kulfi',
    description: 'Traditional slow-churned Alphonso mango ice cream. (Out of season demo item).',
    pricePaise: 12000,
    available: false,
    category: 'Desserts',
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=500&auto=format&fit=crop&q=80'
  }
];
