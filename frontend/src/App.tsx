import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import './App.css';
import {
  formatPaise,
  playAddSound,
  playSuccessSound,
  playToggleSound,
  playDeleteSound,
  setSoundEnabled
} from './utils.js';
import {
  FALLBACK_RESTAURANTS,
  FALLBACK_MENU_ITEMS,
  CURATED_COLLECTIONS,
  CONNOISSEUR_REVIEWS,
  type FallbackRestaurant,
  type FallbackMenuItem
} from './fallbackData.js';

interface Restaurant extends FallbackRestaurant {}
interface MenuItem extends FallbackMenuItem {}

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
  customizationNotes?: string;
}

interface Order {
  id: string;
  restaurantId: string;
  status: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
  totalPaise: number;
  deliveryZone: string;
  estimatedDeliveryMinutes: number;
  createdAt: string;
}

interface DeliveryTracking {
  orderId: string;
  status: Order['status'];
  estimatedDeliveryMinutes: number;
  simulated: boolean;
  updatedAt: string;
}

interface HubLocation {
  id: string;
  name: string;
  zone: string;
  avgTime: string;
  tag: string;
}

const HUBS: HubLocation[] = [
  { id: 'indiranagar', name: 'Indiranagar Central', zone: 'zone-central-demo', avgTime: '18 mins', tag: 'Fastest' },
  { id: 'koramangala', name: 'Koramangala 4th Block', zone: 'zone-south-demo', avgTime: '20 mins', tag: 'High Demand' },
  { id: 'hsr', name: 'HSR Layout Sector 1', zone: 'zone-east-demo', avgTime: '22 mins', tag: 'Active Hub' },
  { id: 'cbd', name: 'CBD / Lavelle Road', zone: 'zone-central-demo', avgTime: '16 mins', tag: 'Executive' }
];

const CUISINE_FILTERS = [
  { id: 'All', label: 'All Cuisines', emoji: '🌟' },
  { id: 'Biryani', label: 'Dum Biryani', emoji: '🍗' },
  { id: 'South Indian', label: 'South Tiffin', emoji: '🥞' },
  { id: 'Burgers', label: 'Craft Burgers', emoji: '🍔' },
  { id: 'Pizza', label: 'Artisan Pizza', emoji: '🍕' },
  { id: 'Pan-Asian', label: 'Pan-Asian', emoji: '🥢' }
];

const AI_VIBES = [
  {
    id: 'hacker',
    icon: '⚡',
    title: 'Late Night Hacker Fuel',
    desc: 'Double smash craft burger, peri-peri loaded fries, and rich dark chocolate shake.',
    itemIds: ['item-burger-001', 'item-burger-002', 'item-burger-003'],
    discountPaise: 10000
  },
  {
    id: 'date',
    icon: '🥂',
    title: 'Gourmet Date Night',
    desc: 'Artisanal Neapolitan burrata pizza, wild mushroom truffle pasta, and classic tiramisu.',
    itemIds: ['item-pizza-001', 'item-pizza-002', 'item-pizza-003'],
    discountPaise: 12000
  },
  {
    id: 'royal',
    icon: '👑',
    title: 'Hyderabadi Royal Feast',
    desc: 'Royal veg dum biryani, charred malai tikka, and warm butter garlic naan.',
    itemIds: ['item-biryani-001', 'item-starter-001', 'item-bread-001'],
    discountPaise: 8000
  },
  {
    id: 'zen',
    icon: '🥞',
    title: 'Zen South Tiffin Comfort',
    desc: 'Golden ghee roast masala dosa, cloud idlis, and freshly brewed filter kaapi.',
    itemIds: ['item-dosa-001', 'item-dosa-002', 'item-beverage-001'],
    discountPaise: 5000
  }
];

export function App() {
  const [viewMode, setViewMode] = useState<'customer' | 'operator'>('customer');
  const [activeView, setActiveView] = useState<'home' | 'restaurant-detail'>('home');
  const [isVipBlack, setIsVipBlack] = useState(false);
  const [soundActive, setSoundActive] = useState(true);
  const [currentHub, setCurrentHub] = useState<HubLocation>(HUBS[0]);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, { item: MenuItem; quantity: number }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [quickFilter, setQuickFilter] = useState<'all' | 'topRated' | 'fast'>('all');

  // Modals & Overlays
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isHubModalOpen, setIsHubModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  // Customization state
  const [selectedSpice, setSelectedSpice] = useState<'Mild' | 'Classic' | 'Fiery'>('Classic');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Cart configuration
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [selectedTipPaise, setSelectedTipPaise] = useState<number>(0);
  const [deliveryInstruction, setDeliveryInstruction] = useState<string>('Leave at door');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');

  // Orders & Simulation
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryTracking | null>(null);
  const [operatorOrders, setOperatorOrders] = useState<Order[]>([]);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(20 * 60);

  // Status & notifications
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Toast notification
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Sync VIP Black class on body
  useEffect(() => {
    if (isVipBlack) {
      document.body.classList.add('tuckin-black-mode');
    } else {
      document.body.classList.remove('tuckin-black-mode');
    }
  }, [isVipBlack]);

  // Keyboard shortcut: Cmd+K / Ctrl+K to search; Esc to close overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsCartOpen(false);
        setIsTrackingModalOpen(false);
        setIsHubModalOpen(false);
        setIsAiModalOpen(false);
        setIsRadarModalOpen(false);
        setCustomizingItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Canvas fireworks celebration burst
  const launchConfetti = () => {
    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ff5722', '#ff8a50', '#f59e0b', '#10b981', '#38bdf8', '#8b5cf6', '#ffd166'];
    const particles = Array.from({ length: 110 }, () => ({
      x: canvas.width / 2,
      y: canvas.height * 0.42,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.8) * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 9 + 4,
      alpha: 1,
      decay: Math.random() * 0.014 + 0.009,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12
    }));

    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38; // gravity
        p.alpha -= p.decay;
        p.rotation += p.rotSpeed;
        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });
      if (alive) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    requestAnimationFrame(frame);
  };

  // Load menu for a selected restaurant
  const selectRestaurant = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setSelectedCategory('All');
    setMenuLoading(true);
    fetch(`/api/restaurants/${restaurant.id}/menu`)
      .then((res) => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then((data) => {
        setMenuItems(data.items || []);
        setMenuLoading(false);
      })
      .catch(() => {
        const fallback = FALLBACK_MENU_ITEMS.filter((item) => item.restaurantId === restaurant.id);
        setMenuItems(fallback);
        setMenuLoading(false);
      });
  }, []);

  // Transition to restaurant detail
  const openRestaurantMenu = (restaurant: Restaurant) => {
    selectRestaurant(restaurant);
    setActiveView('restaurant-detail');
    playToggleSound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load operator orders
  const loadOperatorOrders = useCallback(() => {
    fetch('/api/orders')
      .then((res) => (res.ok ? res.json() : { orders: [] }))
      .then((data) => {
        if (data.orders && data.orders.length > 0) {
          setOperatorOrders(data.orders);
        }
      })
      .catch(() => {
        // Fallback state retained
      });
  }, []);

  // Initial load
  useEffect(() => {
    fetch('/api/restaurants')
      .then((res) => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then((data) => {
        const list: Restaurant[] = data.restaurants || [];
        if (list.length > 0) {
          setRestaurants(list);
          selectRestaurant(list[0]);
        } else {
          setRestaurants(FALLBACK_RESTAURANTS);
          selectRestaurant(FALLBACK_RESTAURANTS[0]);
        }
        setLoading(false);
      })
      .catch(() => {
        setRestaurants(FALLBACK_RESTAURANTS);
        selectRestaurant(FALLBACK_RESTAURANTS[0]);
        setLoading(false);
      });
  }, [selectRestaurant]);

  // Delivery status polling
  useEffect(() => {
    if (!currentOrder || currentOrder.status === 'DELIVERED' || currentOrder.status === 'CANCELLED') {
      return;
    }

    const interval = setInterval(() => {
      fetch(`/api/delivery/${currentOrder.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: DeliveryTracking | null) => {
          if (data) {
            setDeliveryInfo(data);
            if (data.status !== currentOrder.status) {
              setCurrentOrder((prev) => (prev ? { ...prev, status: data.status } : null));
              setOperatorOrders((prev) =>
                prev.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o))
              );
            }
          }
        })
        .catch(() => {
          // Ignore polling errors
        });
    }, 4000);

    return () => clearInterval(interval);
  }, [currentOrder]);

  // Live countdown timer
  useEffect(() => {
    if (!currentOrder || currentOrder.status === 'DELIVERED' || currentOrder.status === 'CANCELLED') {
      return;
    }
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentOrder]);

  const formattedCountdown = useMemo(() => {
    const mins = Math.floor(countdownSeconds / 60);
    const secs = countdownSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [countdownSeconds]);

  // Cart operations
  const addToCart = (item: MenuItem, restaurant?: Restaurant) => {
    if (restaurant && selectedRestaurant?.id !== restaurant.id) {
      setSelectedRestaurant(restaurant);
    }
    setCart((prev) => {
      const existing = prev[item.id];
      const count = existing ? existing.quantity + 1 : 1;
      return { ...prev, [item.id]: { item, quantity: count } };
    });
    playAddSound();
    showToast(`Added ${item.name} to basket`);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const updated = { ...prev };
        delete updated[itemId];
        playDeleteSound();
        return updated;
      }
      playAddSound();
      return { ...prev, [itemId]: { ...existing, quantity: existing.quantity - 1 } };
    });
  };

  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Money arithmetic in integer paise (strictly adhering to invariant: no floating-point arithmetic for totals)
  const cartSubtotalPaise = useMemo(() => {
    return Object.values(cart).reduce((sum, { item, quantity }) => sum + item.pricePaise * quantity, 0);
  }, [cart]);

  const discountPaise = useMemo(() => {
    let d = 0;
    if (appliedCoupon === 'TUCKIN50') {
      d = Math.min(10000, Math.floor(cartSubtotalPaise * 0.5));
    }
    if (isVipBlack) {
      d += 5000; // Extra ₹50 VIP perk discount
    }
    return Math.min(cartSubtotalPaise, d);
  }, [appliedCoupon, isVipBlack, cartSubtotalPaise]);

  const deliveryFeePaise = 0; // Free delivery promotion
  const platformFeePaise = cartSubtotalPaise > 0 ? (isVipBlack ? 0 : 1500) : 0; // Free for VIP Black
  const grandTotalPaise = Math.max(
    0,
    cartSubtotalPaise - discountPaise + deliveryFeePaise + platformFeePaise + selectedTipPaise
  );

  const applyCoupon = () => {
    if (couponInput.trim().toUpperCase() === 'TUCKIN50') {
      setAppliedCoupon('TUCKIN50');
      showToast('🎉 TUCKIN50 applied! ₹100 saved.');
      setCouponInput('');
    } else {
      showToast('Invalid coupon. Try TUCKIN50 for 50% off.');
    }
  };

  // Add entire AI Tasting Flight to cart
  const addAiBundleToCart = (itemIds: string[]) => {
    const itemsToAdd = FALLBACK_MENU_ITEMS.filter((i) => itemIds.includes(i.id));
    if (itemsToAdd.length > 0) {
      const newCart = { ...cart };
      itemsToAdd.forEach((item) => {
        newCart[item.id] = { item, quantity: 1 };
      });
      setCart(newCart);
      setIsAiModalOpen(false);
      setIsCartOpen(true);
      playSuccessSound();
      showToast('✨ Bespoke Tasting Flight added to feast basket!');
    }
  };

  // Checkout order
  const handleCheckout = async () => {
    const activeRest = selectedRestaurant || restaurants[0] || FALLBACK_RESTAURANTS[0];
    if (totalCartCount === 0 || !activeRest) return;
    setIsPlacingOrder(true);

    const items: OrderItem[] = Object.values(cart).map(({ item, quantity }) => ({
      menuItemId: item.id,
      name: item.name,
      quantity,
      unitPricePaise: item.pricePaise,
      lineTotalPaise: item.pricePaise * quantity
    }));

    try {
      const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          restaurantId: activeRest.id,
          deliveryZone: currentHub.zone,
          items: items.map(({ menuItemId, quantity }) => ({ menuItemId, quantity }))
        })
      });

      if (res.ok) {
        const orderData: Order = await res.json();
        setCurrentOrder(orderData);
        setCart({});
        setIsCartOpen(false);
        setIsTrackingModalOpen(true);
        setCountdownSeconds(orderData.estimatedDeliveryMinutes * 60);
        setOperatorOrders((prev) => [orderData, ...prev]);

        const delivRes = await fetch(`/api/delivery/${orderData.id}`);
        if (delivRes.ok) {
          const delivData = await delivRes.json();
          setDeliveryInfo(delivData);
        }
        playSuccessSound();
        launchConfetti();
        showToast('🎉 Order placed! Courier dispatch active.');
        setIsPlacingOrder(false);
        return;
      }
    } catch {
      // Fallback
    }

    // Standalone fallback
    const mockOrder: Order = {
      id: `ord-${Date.now().toString(36).toUpperCase()}`,
      restaurantId: activeRest.id,
      status: 'PLACED',
      items,
      totalPaise: grandTotalPaise,
      deliveryZone: currentHub.zone,
      estimatedDeliveryMinutes: isVipBlack ? 16 : 22,
      createdAt: new Date().toISOString()
    };
    setCurrentOrder(mockOrder);
    setCart({});
    setIsCartOpen(false);
    setIsTrackingModalOpen(true);
    setCountdownSeconds((isVipBlack ? 16 : 22) * 60);
    setDeliveryInfo({
      orderId: mockOrder.id,
      status: 'PLACED',
      estimatedDeliveryMinutes: isVipBlack ? 16 : 22,
      simulated: true,
      updatedAt: new Date().toISOString()
    });
    setOperatorOrders((prev) => [mockOrder, ...prev]);
    playSuccessSound();
    launchConfetti();
    showToast('🎉 Order placed! Live telemetry tracking activated.');
    setIsPlacingOrder(false);
  };

  // Advance simulation
  const advanceSimulation = async () => {
    if (!currentOrder) return;
    const progression: Record<Order['status'], Order['status']> = {
      PLACED: 'ACCEPTED',
      ACCEPTED: 'PREPARING',
      PREPARING: 'PICKED_UP',
      PICKED_UP: 'OUT_FOR_DELIVERY',
      OUT_FOR_DELIVERY: 'DELIVERED',
      DELIVERED: 'DELIVERED',
      CANCELLED: 'CANCELLED'
    };
    const nextStatus = progression[currentOrder.status];

    try {
      const res = await fetch(`/api/delivery/${currentOrder.id}/simulate-next`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setDeliveryInfo(updated);
        setCurrentOrder((prev) => (prev ? { ...prev, status: updated.status } : null));
        setOperatorOrders((prev) =>
          prev.map((o) => (o.id === currentOrder.id ? { ...o, status: updated.status } : o))
        );
        return;
      }
    } catch {
      // Fallback
    }

    // Local simulation update
    setCurrentOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
    setDeliveryInfo((prev) => (prev ? { ...prev, status: nextStatus, updatedAt: new Date().toISOString() } : null));
    setOperatorOrders((prev) =>
      prev.map((o) => (o.id === currentOrder.id ? { ...o, status: nextStatus } : o))
    );
    showToast(`Simulation: order is now ${nextStatus}`);
  };

  // Operator status update
  const updateOrderStatus = async (orderId: string, nextStatus: Order['status']) => {
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      await fetch(`/api/delivery/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch {
      // Fallback
    }

    setOperatorOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
    if (currentOrder && currentOrder.id === orderId) {
      setCurrentOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
      setDeliveryInfo((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
    showToast(`Order status updated to ${nextStatus}`);
  };

  // Filtered restaurants for Home
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((rest) => {
      const matchesCuisine =
        selectedCuisine === 'All' ||
        rest.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase());
      const matchesSearch =
        searchQuery.trim() === '' ||
        rest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rest.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rest.cuisine.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesQuick = true;
      if (quickFilter === 'topRated') matchesQuick = rest.rating >= 4.8;
      if (quickFilter === 'fast') matchesQuick = rest.deliveryTime?.includes('18') || rest.deliveryTime?.includes('20') || false;

      return matchesCuisine && matchesSearch && matchesQuick;
    });
  }, [restaurants, selectedCuisine, searchQuery, quickFilter]);

  // Filtered dishes for Restaurant Detail
  const filteredDishes = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((i) => set.add(i.category));
    return ['All', ...Array.from(set)];
  }, [menuItems]);

  // Signature chef specials across all kitchens for home view
  const trendingSpecials = useMemo(() => {
    return FALLBACK_MENU_ITEMS.filter((i) => i.isBestseller).slice(0, 4);
  }, []);

  const activeStepIndex = useMemo(() => {
    const steps: Order['status'][] = ['PLACED', 'ACCEPTED', 'PREPARING', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    return currentOrder ? steps.indexOf(currentOrder.status) : -1;
  }, [currentOrder]);

  return (
    <div className="app-container">
      {/* Ambient Glow Orbs */}
      <div className="ambient-glow-orb-1" aria-hidden="true" />
      <div className="ambient-glow-orb-2" aria-hidden="true" />

      {/* Pure JS Confetti Canvas */}
      <canvas id="confetti-canvas" className="confetti-canvas" />

      {/* Floating Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: isVipBlack ? 'linear-gradient(135deg, #ffd166 0%, #d97706 100%)' : 'var(--color-ember-gradient)',
            color: isVipBlack ? '#030712' : '#ffffff',
            fontWeight: 800,
            fontSize: '0.92rem',
            padding: '13px 26px',
            borderRadius: '9999px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
            zIndex: 4000,
            animation: 'fadeIn 0.2s ease',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}
        >
          {notification}
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="brand-section">
          <div
            className="brand-logo"
            onClick={() => {
              setViewMode('customer');
              setActiveView('home');
              playToggleSound();
            }}
          >
            <span className="logo-icon">🍛</span>
            <h1>Tuckin</h1>
          </div>
          <div
            className="location-pill"
            title="Click to switch delivery cloud hub"
            onClick={() => {
              setIsHubModalOpen(true);
              playToggleSound();
            }}
          >
            <span className="radar-dot" />
            <span>{currentHub.name} • <strong>{currentHub.avgTime}</strong> ▾</span>
          </div>
        </div>

        <div className="header-center">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search dishes, ingredients, kitchens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="kbd-hint">⌘K</span>
          </div>
        </div>

        <div className="header-actions">
          {/* VIP Black Toggle */}
          <button
            className={`vip-black-toggle ${isVipBlack ? 'active' : ''}`}
            onClick={() => {
              setIsVipBlack(!isVipBlack);
              playSuccessSound();
              showToast(isVipBlack ? 'Switched to Standard Mode' : '👑 Tuckin Black VIP Edition Activated!');
            }}
            title="Toggle Tuckin Black VIP membership perks"
          >
            <span>👑</span>
            <span>{isVipBlack ? 'VIP Black' : 'Go Black'}</span>
          </button>

          {/* AI Concierge Trigger */}
          <button
            className="ai-concierge-pill"
            onClick={() => {
              setIsAiModalOpen(true);
              playToggleSound();
            }}
            title="Open Tuckin AI Sommelier"
          >
            <span>✨</span>
            <span>AI Concierge</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            className="sound-toggle-btn"
            onClick={() => {
              const next = !soundActive;
              setSoundActive(next);
              setSoundEnabled(next);
              if (next) playAddSound();
              showToast(next ? 'Sound FX Enabled' : 'Sound Muted');
            }}
            title={soundActive ? 'Sound Effects Enabled' : 'Muted'}
          >
            {soundActive ? '🔊' : '🔇'}
          </button>

          {/* Customer vs Operator Toggle */}
          <div className="mode-toggle">
            <button
              className={`mode-btn ${viewMode === 'customer' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('customer');
                playToggleSound();
              }}
            >
              🍽️ Menu
            </button>
            <button
              className={`mode-btn ${viewMode === 'operator' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('operator');
                loadOperatorOrders();
                playToggleSound();
              }}
            >
              👨‍🍳 KDS
            </button>
          </div>

          {currentOrder && currentOrder.status !== 'DELIVERED' && (
            <button
              className="mode-btn"
              style={{
                background: 'rgba(56, 189, 248, 0.16)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                fontWeight: 800
              }}
              onClick={() => {
                setIsTrackingModalOpen(true);
                playToggleSound();
              }}
            >
              🛵 Track Order (#{currentOrder.id.slice(-6)})
            </button>
          )}

          {viewMode === 'customer' && (
            <button
              className="cart-toggle-btn"
              onClick={() => {
                setIsCartOpen(true);
                playToggleSound();
              }}
            >
              🛒 Basket
              <span className="cart-badge">{totalCartCount}</span>
              {cartSubtotalPaise > 0 && <span>{formatPaise(cartSubtotalPaise)}</span>}
            </button>
          )}
        </div>
      </header>

      {/* =========================================================================
         CUSTOMER VIEW
         ========================================================================= */}
      {viewMode === 'customer' && (
        <>
          {/* Active View: Home Feed */}
          {activeView === 'home' && (
            <div className="consumer-container">
              {/* YC Launch Hero Header */}
              <div className="hero-wrapper" style={{ paddingLeft: 0, paddingRight: 0 }}>
                <div className="hero-announcement">
                  <span>⚡ HYPERLOCAL CULINARY CLOUD • 18-MIN DISPATCH</span>
                </div>
                <div className="hero-main-title">
                  <div className="hero-text">
                    <h2>Haute Cuisine, Fired On Demand.</h2>
                    <p>
                      Curated master-chef cloud kitchens, algorithmic dispatch, and zero-compromise thermal precision.
                      Handcrafted food delivered in under 20 minutes across Bengaluru.
                    </p>
                  </div>
                  <div className="telemetry-strip">
                    <div className="telemetry-item">
                      <span className="telemetry-val">18.2m</span>
                      <span className="telemetry-label">Doorstep Dispatch</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="telemetry-val">28,490+</span>
                      <span className="telemetry-label">Orders Mastered</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="telemetry-val">4.94 ★</span>
                      <span className="telemetry-label">Customer Rating</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="telemetry-val">100%</span>
                      <span className="telemetry-label">Heat Insulated</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Fleet Radar Hub Banner */}
              <div
                className="radar-hub-banner"
                onClick={() => {
                  setIsRadarModalOpen(true);
                  playToggleSound();
                }}
                title="Open live telemetry map"
              >
                <div className="radar-hub-left">
                  <div className="radar-hub-icon">📡</div>
                  <div className="radar-hub-info">
                    <h4>Bengaluru Cloud Kitchen Telemetry Radar (Live)</h4>
                    <p>8 couriers in active flight • 5 commercial nodes synchronized • 68.4°C thermal lock</p>
                  </div>
                </div>
                <div className="radar-pulse-nodes">
                  <div className="pulse-node-badge">
                    <span className="radar-dot" />
                    <span>GPS Tracking Active</span>
                  </div>
                  <span style={{ color: 'var(--color-ember)', fontWeight: 800, fontSize: '0.88rem' }}>
                    View Live Radar →
                  </span>
                </div>
              </div>

              {/* Cuisine Stories Strip */}
              <div className="cuisine-bubbles-strip" style={{ paddingLeft: 0, paddingRight: 0 }}>
                {CUISINE_FILTERS.map((cat) => (
                  <button
                    key={cat.id}
                    className={`cuisine-bubble-card ${selectedCuisine === cat.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCuisine(cat.id);
                      playToggleSound();
                    }}
                  >
                    <div className="bubble-avatar">{cat.emoji}</div>
                    <span className="bubble-label">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Quick Filter Bar */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                  Filter By:
                </span>
                {[
                  { id: 'all', label: 'All Kitchens' },
                  { id: 'topRated', label: '★ 4.8+ Top Rated' },
                  { id: 'fast', label: '⚡ Under 25 Mins' }
                ].map((f) => (
                  <button
                    key={f.id}
                    className={`mode-btn ${quickFilter === f.id ? 'active' : ''}`}
                    style={{
                      background: quickFilter === f.id ? 'rgba(255, 87, 34, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${quickFilter === f.id ? 'var(--color-ember)' : 'var(--border-subtle)'}`,
                      color: quickFilter === f.id ? '#ff8a50' : 'var(--text-secondary)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '0.35rem 0.95rem',
                      fontSize: '0.82rem'
                    }}
                    onClick={() => {
                      setQuickFilter(f.id as typeof quickFilter);
                      playToggleSound();
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Curated Culinary Flights */}
              <section style={{ marginTop: '1.25rem' }}>
                <div className="section-headline">
                  <div>
                    <h3>Curated Culinary Flights</h3>
                    <span className="sub-tag">Thematic gastronomic journeys hand-selected by our head culinarians</span>
                  </div>
                  <span className="sub-tag" style={{ color: 'var(--color-ember)', fontWeight: 800 }}>
                    ✦ Tasting Menu
                  </span>
                </div>
                <div className="curated-collections-grid">
                  {CURATED_COLLECTIONS.map((c) => (
                    <article
                      key={c.id}
                      className="curated-collection-card"
                      onClick={() => {
                        const targetKitchen = restaurants.find((r) => r.id === c.kitchenId) || restaurants[0];
                        if (targetKitchen) {
                          openRestaurantMenu(targetKitchen);
                        }
                      }}
                    >
                      <img src={c.imageUrl} alt={c.title} className="curated-bg-img" loading="lazy" />
                      <div className="curated-gradient-overlay" />
                      <div className="curated-content">
                        <span className="curated-tag">{c.tag}</span>
                        <h4 className="curated-title">{c.title}</h4>
                        <p className="curated-sub">{c.subtitle}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Partner Cloud Kitchens Grid */}
              <section>
                <div className="section-headline">
                  <div>
                    <h3>Partner Cloud Kitchens</h3>
                    <span className="sub-tag">Michelin-grade dark kitchens operating on hyper-speed dispatch</span>
                  </div>
                  <span className="sub-tag" style={{ fontFamily: 'var(--font-mono)' }}>
                    {filteredRestaurants.length} active kitchens
                  </span>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                    Loading gourmet cloud kitchens...
                  </div>
                ) : (
                  <div className="kitchens-grid">
                    {filteredRestaurants.map((rest) => (
                      <article
                        key={rest.id}
                        className="kitchen-card"
                        onClick={() => openRestaurantMenu(rest)}
                      >
                        <div className="kitchen-media">
                          <img src={rest.imageUrl} alt={rest.name} loading="lazy" />
                          <div className="kitchen-gradient" />
                          {rest.featuredTag && <div className="offer-badge">{rest.featuredTag}</div>}
                          <div className="kitchen-rating">
                            <span style={{ color: '#fbbf24' }}>★</span>
                            <span>{rest.rating}</span>
                          </div>
                        </div>

                        <div className="kitchen-body">
                          <h4>{rest.name}</h4>
                          <div className="kitchen-cuisines">{rest.cuisine}</div>
                          <p className="kitchen-desc">{rest.description}</p>
                          <div className="kitchen-footer">
                            <span>⏱️ {rest.deliveryTime}</span>
                            <span>💰 {rest.priceForTwo}</span>
                            <span style={{ color: '#10b981', fontWeight: 800 }}>Explore Menu →</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* Trending Chef Specials Grid */}
              <section style={{ marginTop: '0.5rem' }}>
                <div className="section-headline">
                  <div>
                    <h3>Trending Chef Specials</h3>
                    <span className="sub-tag">Top-rated signature creations crafted by master culinarians</span>
                  </div>
                  <span className="sub-tag" style={{ color: '#ff8a50', fontWeight: 800 }}>
                    🔥 High Demand
                  </span>
                </div>

                <div className="trending-grid">
                  {trendingSpecials.map((dish) => {
                    const inCart = cart[dish.id]?.quantity || 0;
                    const rest = restaurants.find((r) => r.id === dish.restaurantId);
                    return (
                      <div
                        key={dish.id}
                        className="trending-card"
                        onClick={() => {
                          setCustomizingItem(dish);
                          playToggleSound();
                        }}
                      >
                        <div className="trending-card-top">
                          <img src={dish.imageUrl} alt={dish.name} className="trending-thumb" loading="lazy" />
                          <div className="trending-info">
                            <h4>{dish.name}</h4>
                            <div className="trending-origin">{rest?.name || 'Chef Special'}</div>
                            <div className="trending-price">{formatPaise(dish.pricePaise)}</div>
                          </div>
                        </div>

                        <div className="trending-card-bottom" onClick={(e) => e.stopPropagation()}>
                          <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 800 }}>
                            ★ {dish.rating} ({dish.votes})
                          </span>

                          {inCart === 0 ? (
                            <button
                              className="add-btn"
                              onClick={() => addToCart(dish, rest)}
                              disabled={!dish.available}
                            >
                              {dish.available ? '+ ADD' : 'SOLD OUT'}
                            </button>
                          ) : (
                            <div className="qty-stepper">
                              <button className="qty-btn" onClick={() => removeFromCart(dish.id)}>
                                −
                              </button>
                              <span className="qty-count">{inCart}</span>
                              <button className="qty-btn" onClick={() => addToCart(dish, rest)}>
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* How Tuckin Cloud Works - Engineering Bento Grid */}
              <section style={{ marginTop: '2.5rem' }}>
                <div className="section-headline">
                  <div>
                    <h3>Engineered for Supreme Precision</h3>
                    <span className="sub-tag">The next-generation distributed food delivery telemetry stack</span>
                  </div>
                  <span className="sub-tag" style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                    ⚡ Cloud SLA: 99.99%
                  </span>
                </div>
                <div className="tech-bento-grid">
                  <div className="tech-bento-card">
                    <span className="tech-bento-icon">⚡</span>
                    <h4>Sub-Millisecond Dispatch</h4>
                    <p>Automated cloud kitchen order orchestration and route optimization calculates courier-to-pan handoff times in real-time.</p>
                  </div>
                  <div className="tech-bento-card">
                    <span className="tech-bento-icon">🌡️</span>
                    <h4>68.4°C Thermal Lock</h4>
                    <p>Hermetically sealed custom aerogel delivery capsules ensure food hits your plate at the exact searing restaurant temperature.</p>
                  </div>
                  <div className="tech-bento-card">
                    <span className="tech-bento-icon">🔋</span>
                    <h4>100% Electric EV Fleet</h4>
                    <p>Zero carbon emissions urban delivery pods navigating Bengaluru tech corridors with sub-20 minute doorstep SLAs.</p>
                  </div>
                </div>
              </section>

              {/* Connoisseur Reviews & Verified Feedback */}
              <section style={{ marginTop: '2.5rem', marginBottom: '2rem' }}>
                <div className="section-headline">
                  <div>
                    <h3>Connoisseur Chronicles</h3>
                    <span className="sub-tag">What Bengaluru’s most discerning food enthusiasts say about Tuckin</span>
                  </div>
                  <span className="sub-tag" style={{ color: '#fbbf24', fontWeight: 800 }}>
                    ★ 4.94 / 5.0 Rating
                  </span>
                </div>
                <div className="reviews-grid">
                  {CONNOISSEUR_REVIEWS.map((r) => (
                    <div key={r.id} className="review-card">
                      <div className="review-stars">{'★'.repeat(r.rating)}</div>
                      <p className="review-quote">"{r.quote}"</p>
                      <div className="review-footer">
                        <div>
                          <div className="review-author">{r.author}</div>
                          <div className="review-location">📍 {r.location}</div>
                        </div>
                        <span className="review-dish">{r.dish}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Active View: Restaurant Detail Page */}
          {activeView === 'restaurant-detail' && selectedRestaurant && (
            <div className="consumer-container">
              <div className="restaurant-detail-view">
                <button
                  className="back-to-kitchens-btn"
                  onClick={() => {
                    setActiveView('home');
                    playToggleSound();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  ← Back to all kitchens
                </button>

                {/* Restaurant Hero Banner */}
                <div className="restaurant-hero-banner">
                  <img
                    src={selectedRestaurant.imageUrl}
                    alt={selectedRestaurant.name}
                    className="rest-hero-avatar"
                  />
                  <div className="rest-hero-info">
                    <h2>{selectedRestaurant.name}</h2>
                    <p>{selectedRestaurant.description}</p>
                    <div className="rest-hero-badges">
                      <span style={{ color: '#fbbf24', fontWeight: 800 }}>
                        ★ {selectedRestaurant.rating} (850+ reviews)
                      </span>
                      <span>•</span>
                      <span>⏱️ {selectedRestaurant.deliveryTime}</span>
                      <span>•</span>
                      <span>💰 {selectedRestaurant.priceForTwo}</span>
                      <span>•</span>
                      <span style={{ color: '#10b981', fontWeight: 800 }}>🏆 Certified 5-Star Commercial Kitchen</span>
                    </div>
                  </div>
                </div>

                {/* Category Pills Strip */}
                <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`mode-btn ${selectedCategory === cat ? 'active' : ''}`}
                      style={{
                        background: selectedCategory === cat ? 'var(--color-ember-gradient)' : 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-pill)',
                        padding: '0.45rem 1.15rem'
                      }}
                      onClick={() => {
                        setSelectedCategory(cat);
                        playToggleSound();
                      }}
                    >
                      {cat === 'All' ? '🌟 All Dishes' : cat}
                    </button>
                  ))}
                </div>

                {/* Dishes Grid */}
                {menuLoading ? (
                  <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                    Firing up chef menu...
                  </div>
                ) : (
                  <div className="dishes-bento-grid">
                    {filteredDishes.map((item) => {
                      const inCart = cart[item.id]?.quantity || 0;
                      return (
                        <article
                          key={item.id}
                          className="bento-dish-card"
                          onClick={() => {
                            setCustomizingItem(item);
                            playToggleSound();
                          }}
                        >
                          <div className="dish-main-row">
                            <div className="dish-info-left">
                              <div>
                                <span className="veg-icon" style={{ borderColor: item.isVeg ? '#22c55e' : '#ef4444' }}>
                                  <span
                                    className="veg-dot"
                                    style={{ background: item.isVeg ? '#22c55e' : '#ef4444' }}
                                  />
                                </span>
                                {item.isBestseller && (
                                  <span className="bestseller-badge">★ BESTSELLER</span>
                                )}
                              </div>
                              <h4 className="dish-title">{item.name}</h4>
                              <div className="dish-price">{formatPaise(item.pricePaise)}</div>
                              <p className="dish-desc">{item.description}</p>
                            </div>

                            <div className="dish-img-box">
                              <img src={item.imageUrl} alt={item.name} loading="lazy" />
                            </div>
                          </div>

                          <div className="dish-card-actions" onClick={(e) => e.stopPropagation()}>
                            <span className="dish-rating-text">
                              ★ {item.rating} ({item.votes})
                            </span>

                            {inCart === 0 ? (
                              <button
                                className="add-btn"
                                onClick={() => addToCart(item, selectedRestaurant)}
                                disabled={!item.available}
                              >
                                {item.available ? '+ ADD' : 'SOLD OUT'}
                              </button>
                            ) : (
                              <div className="qty-stepper">
                                <button className="qty-btn" onClick={() => removeFromCart(item.id)}>
                                  −
                                </button>
                                <span className="qty-count">{inCart}</span>
                                <button className="qty-btn" onClick={() => addToCart(item, selectedRestaurant)}>
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
         DISH DETAIL & CUSTOMIZER MODAL
         ========================================================================= */}
      {customizingItem && (
        <div className="modal-overlay" onClick={() => setCustomizingItem(null)}>
          <div className="telemetry-modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <img src={customizingItem.imageUrl} alt={customizingItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, #0d121f 100%)' }} />
              <button
                className="drawer-close-btn"
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)' }}
                onClick={() => setCustomizingItem(null)}
              >
                ✕
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>{customizingItem.name}</h3>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ff8a50', fontFamily: 'var(--font-mono)' }}>
                  {formatPaise(customizingItem.pricePaise)}
                </span>
              </div>
              <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                {customizingItem.description}
              </p>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', color: '#94a3b8' }}>
                  🔥 540 kcal
                </span>
                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', color: '#94a3b8' }}>
                  💪 24g Protein
                </span>
                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', color: '#10b981' }}>
                  🌱 100% Farm Fresh
                </span>
              </div>
            </div>

            {/* Spice Level Selector */}
            <div>
              <div className="cart-section-title">Chef Spice Calibration</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['Mild', 'Classic', 'Fiery'] as const).map((spice) => (
                  <button
                    key={spice}
                    className={`tip-pill-btn ${selectedSpice === spice ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSpice(spice);
                      playToggleSound();
                    }}
                  >
                    {spice === 'Mild' && '🌱 Mild'}
                    {spice === 'Classic' && '🌶️ Classic Spice'}
                    {spice === 'Fiery' && '🔥 Fiery Heat'}
                  </button>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            <div>
              <div className="cart-section-title">Artisan Accents & Add-ons</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { id: 'truffle', name: 'White Truffle Oil Drizzle', price: '+₹60' },
                  { id: 'burrata', name: 'Artisanal Burrata Melt', price: '+₹80' },
                  { id: 'garlic', name: 'Crispy Garlic Podi Crunch', price: '+₹30' }
                ].map((addon) => {
                  const active = selectedAddons.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      className={`payment-option-card ${active ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedAddons((prev) =>
                          active ? prev.filter((x) => x !== addon.id) : [...prev, addon.id]
                        );
                        playAddSound();
                      }}
                    >
                      <input type="checkbox" checked={active} onChange={() => {}} style={{ accentColor: 'var(--color-ember)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{addon.name}</span>
                        <span style={{ color: '#ff8a50', fontFamily: 'var(--font-mono)' }}>{addon.price}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              className="checkout-btn"
              onClick={() => {
                addToCart(customizingItem, selectedRestaurant || undefined);
                setCustomizingItem(null);
                setSelectedAddons([]);
              }}
            >
              Add To Basket • {formatPaise(customizingItem.pricePaise)}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
         AI CONCIERGE & SOMMELIER MODAL
         ========================================================================= */}
      {isAiModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAiModalOpen(false)}>
          <div className="ai-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>✨ Tuckin AI Culinary Concierge</h3>
                <span style={{ fontSize: '0.85rem', color: '#c084fc' }}>
                  Taste-calibrated tasting flights optimized for your current vibe
                </span>
              </div>
              <button className="drawer-close-btn" onClick={() => setIsAiModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="ai-vibe-grid">
              {AI_VIBES.map((vibe) => (
                <div
                  key={vibe.id}
                  className="ai-vibe-card"
                  onClick={() => addAiBundleToCart(vibe.itemIds)}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>{vibe.icon}</div>
                  <div className="ai-vibe-title">{vibe.title}</div>
                  <div className="ai-vibe-desc">{vibe.desc}</div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 800 }}>
                      ⚡ Save ₹{vibe.discountPaise / 100}
                    </span>
                    <span style={{ color: 'var(--color-violet)', fontSize: '0.78rem', fontWeight: 800 }}>
                      Add Flight →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         RADAR LIVE MAP MODAL
         ========================================================================= */}
      {isRadarModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRadarModalOpen(false)}>
          <div className="telemetry-modal" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>📡 Bengaluru Live Dispatch Radar</h3>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Real-time GPS telemetry from active couriers and cloud kitchen nodes
                </span>
              </div>
              <button className="drawer-close-btn" onClick={() => setIsRadarModalOpen(false)}>
                ✕
              </button>
            </div>

            {/* Simulated Live Radar Grid */}
            <div style={{ position: 'relative', width: '100%', height: '260px', background: '#070b14', borderRadius: 'var(--radius-md)', border: '1px solid rgba(56, 189, 248, 0.3)', overflow: 'hidden' }}>
              {/* Radar Grid Circles */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: '120px', height: '120px', transform: 'translate(-50%, -50%)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: '220px', height: '220px', transform: 'translate(-50%, -50%)', border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '50%' }} />
              
              {/* Kitchen Hub Markers */}
              <div style={{ position: 'absolute', top: '45%', left: '48%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <span className="radar-dot" />
                <div style={{ fontSize: '0.72rem', color: '#ff8a50', fontWeight: 800 }}>Indiranagar Hub</div>
              </div>

              <div style={{ position: 'absolute', top: '75%', left: '35%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <span className="radar-dot" style={{ background: '#38bdf8' }} />
                <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800 }}>Koramangala Hub</div>
              </div>

              {/* Moving Courier Markers */}
              <div style={{ position: 'absolute', top: '35%', left: '60%', transform: 'translate(-50%, -50%)', animation: 'radarPulse 3s infinite' }}>
                <span style={{ fontSize: '1.2rem' }}>🛵</span>
                <span style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.8)', padding: '0.1rem 0.3rem', borderRadius: '3px', color: '#34d399' }}>
                  KA-9482 (38km/h)
                </span>
              </div>

              <div style={{ position: 'absolute', top: '60%', left: '70%', transform: 'translate(-50%, -50%)' }}>
                <span style={{ fontSize: '1.2rem' }}>🛵</span>
                <span style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.8)', padding: '0.1rem 0.3rem', borderRadius: '3px', color: '#fbbf24' }}>
                  KA-5120 (42km/h)
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-white)' }}>8 Couriers</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>In Transit</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>68.4°C</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Bag Temp</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38bdf8' }}>100% EV</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ather Fleet</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         SLIDE-OVER FEAST BASKET DRAWER
         ========================================================================= */}
      {isCartOpen && (
        <div className="drawer-backdrop" onClick={() => setIsCartOpen(false)}>
          <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>
                🛒 Your Feast Basket <span style={{ color: '#ff8a50', fontSize: '0.92rem' }}>({totalCartCount})</span>
              </h3>
              <button className="drawer-close-btn" onClick={() => setIsCartOpen(false)}>
                ✕
              </button>
            </div>

            <div className="drawer-content">
              {/* Free delivery meter */}
              <div className="free-delivery-meter">
                <span>⚡</span>
                <span>You unlocked <strong>FREE Express Dispatch</strong> for this order!</span>
              </div>

              {totalCartCount === 0 ? (
                <div className="cart-empty-state">
                  <div className="empty-icon">🍱</div>
                  <h4>Your basket is empty</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    Browse our chef-crafted menus and add delicious items to get started.
                  </p>
                </div>
              ) : (
                <>
                  {/* Cart Items List */}
                  <div className="cart-items-list">
                    {Object.values(cart).map(({ item, quantity }) => (
                      <div key={item.id} className="cart-item-row">
                        <div className="cart-item-info">
                          <p className="cart-item-name">{item.name}</p>
                          <span className="cart-item-price">
                            {formatPaise(item.pricePaise * quantity)}
                          </span>
                        </div>
                        <div className="qty-stepper">
                          <button className="qty-btn" onClick={() => removeFromCart(item.id)}>
                            −
                          </button>
                          <span className="qty-count">{quantity}</span>
                          <button className="qty-btn" onClick={() => addToCart(item)}>
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo Coupon Section */}
                  <div>
                    <div className="cart-section-title">Promo Coupon</div>
                    {appliedCoupon ? (
                      <div className="coupon-success-pill">
                        <span>🎉 {appliedCoupon} Applied! (₹100 Saved)</span>
                        <button className="remove-coupon-btn" onClick={() => setAppliedCoupon(null)}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="coupon-box">
                          <input
                            type="text"
                            placeholder="Enter coupon code (e.g. TUCKIN50)"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                          />
                          <button className="apply-coupon-btn" onClick={applyCoupon}>
                            Apply
                          </button>
                        </div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: '#ff8a50',
                            marginTop: '0.45rem',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setAppliedCoupon('TUCKIN50');
                            playSuccessSound();
                            showToast('🎉 TUCKIN50 applied! ₹100 saved.');
                          }}
                        >
                          ⚡ Tap to auto-apply <strong>TUCKIN50</strong> for ₹100 OFF
                        </div>
                      </>
                    )}
                  </div>

                  {/* Delivery Instructions */}
                  <div>
                    <div className="cart-section-title">Delivery Instructions</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {['Leave at door', 'Avoid calling', 'Ring doorbell', 'Contactless drop'].map((inst) => (
                        <button
                          key={inst}
                          className={`tip-pill-btn ${deliveryInstruction === inst ? 'active' : ''}`}
                          style={{ flex: 'none', padding: '0.4rem 0.85rem' }}
                          onClick={() => {
                            setDeliveryInstruction(inst);
                            playToggleSound();
                          }}
                        >
                          {inst}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Partner Tip */}
                  <div>
                    <div className="cart-section-title">Delivery Partner Tip</div>
                    <div className="tip-pills-row">
                      {[
                        { label: 'None', paise: 0 },
                        { label: '₹20', paise: 2000 },
                        { label: '₹30', paise: 3000 },
                        { label: '₹50', paise: 5000 },
                        { label: '₹100', paise: 10000 }
                      ].map((tip) => (
                        <button
                          key={tip.paise}
                          className={`tip-pill-btn ${selectedTipPaise === tip.paise ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedTipPaise(tip.paise);
                            playToggleSound();
                          }}
                        >
                          {tip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <div className="cart-section-title">Payment Method (Mock Sandbox)</div>
                    <div className="payment-options-grid">
                      {[
                        { id: 'upi', label: '⚡ Mock UPI / Google Pay (Instant 0s)', desc: 'Zero gateway latency' },
                        { id: 'card', label: '💳 Mock Obsidian Black Card', desc: 'AES-256 test sandbox' },
                        { id: 'cod', label: '💵 Cash / Pay on Delivery', desc: 'Pay courier on doorstep' }
                      ].map((method) => (
                        <div
                          key={method.id}
                          className={`payment-option-card ${paymentMethod === method.id ? 'active' : ''}`}
                          onClick={() => {
                            setPaymentMethod(method.id as 'upi' | 'card' | 'cod');
                            playToggleSound();
                          }}
                        >
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === method.id}
                            onChange={() => {}}
                            style={{ accentColor: 'var(--color-ember)' }}
                          />
                          <div>
                            <div style={{ color: 'var(--text-white)' }}>{method.label}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{method.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Itemized Bill Details */}
                  <div className="bill-details">
                    <div className="bill-row">
                      <span>Item Subtotal</span>
                      <span>{formatPaise(cartSubtotalPaise)}</span>
                    </div>
                    {discountPaise > 0 && (
                      <div className="bill-row discount-row">
                        <span>Coupon & VIP Discount</span>
                        <span>-{formatPaise(discountPaise)}</span>
                      </div>
                    )}
                    <div className="bill-row">
                      <span>Express Delivery Fee</span>
                      <span style={{ color: '#10b981', fontWeight: 800 }}>
                        <span style={{ textDecoration: 'line-through', color: '#64748b', marginRight: '6px' }}>
                          ₹30.00
                        </span>
                        FREE
                      </span>
                    </div>
                    <div className="bill-row">
                      <span>Platform & Hygienic Packaging</span>
                      <span>{isVipBlack ? '₹0.00 (VIP Free)' : '₹15.00'}</span>
                    </div>
                    {selectedTipPaise > 0 && (
                      <div className="bill-row">
                        <span>Delivery Partner Tip</span>
                        <span>{formatPaise(selectedTipPaise)}</span>
                      </div>
                    )}
                    <div className="bill-row total-row">
                      <span>Grand Total</span>
                      <span style={{ color: isVipBlack ? '#ffd166' : '#ff5722' }}>{formatPaise(grandTotalPaise)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {totalCartCount > 0 && (
              <div className="drawer-footer">
                <button
                  className="checkout-btn"
                  onClick={handleCheckout}
                  disabled={isPlacingOrder}
                >
                  {isPlacingOrder ? 'Confirming Dispatch...' : `⚡ Place Order • ${formatPaise(grandTotalPaise)}`}
                </button>
                <div className="mock-footnote">
                  <span>🔒 100% Mock Transaction</span>
                  <span>•</span>
                  <span>Sub-20 Min Cloud Delivery</span>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* =========================================================================
         LOCATION HUB MODAL
         ========================================================================= */}
      {isHubModalOpen && (
        <div className="modal-overlay" onClick={() => setIsHubModalOpen(false)}>
          <div className="telemetry-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>📍 Select Culinary Cloud Hub</h3>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Ultra-fast delivery within your Bengaluru micro-corridor
                </span>
              </div>
              <button className="drawer-close-btn" onClick={() => setIsHubModalOpen(false)}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {HUBS.map((hub) => (
                <div
                  key={hub.id}
                  className={`payment-option-card ${currentHub.id === hub.id ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentHub(hub);
                    setIsHubModalOpen(false);
                    playToggleSound();
                    showToast(`Switched hub to ${hub.name}`);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div>
                      <h5 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem', fontWeight: 800 }}>{hub.name}</h5>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Avg Dispatch: {hub.avgTime} • {hub.zone}
                      </span>
                    </div>
                    <span
                      style={{
                        background: currentHub.id === hub.id ? 'var(--color-ember)' : 'rgba(255, 255, 255, 0.06)',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-pill)'
                      }}
                    >
                      {hub.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         LIVE TRACKING TELEMETRY HUD MODAL
         ========================================================================= */}
      {isTrackingModalOpen && currentOrder && (
        <div className="modal-overlay" onClick={() => setIsTrackingModalOpen(false)}>
          <div className="telemetry-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>🛵 Live Order Telemetry</h3>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  Order #{currentOrder.id}
                </span>
              </div>
              <button className="drawer-close-btn" onClick={() => setIsTrackingModalOpen(false)}>
                ✕
              </button>
            </div>

            {/* Countdown Clock Box */}
            <div className="eta-countdown-box">
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                  {currentOrder.status === 'DELIVERED'
                    ? 'Delivery Completed'
                    : `Estimated Arrival (~${deliveryInfo?.estimatedDeliveryMinutes || currentOrder.estimatedDeliveryMinutes}m)`}
                </div>
                <div className="eta-timer">
                  {currentOrder.status === 'DELIVERED' ? '00:00' : formattedCountdown}
                </div>
              </div>
              <div
                style={{
                  background: currentOrder.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                  border: `1px solid ${currentOrder.status === 'DELIVERED' ? '#10b981' : '#38bdf8'}`,
                  color: currentOrder.status === 'DELIVERED' ? '#34d399' : '#38bdf8',
                  padding: '0.4rem 0.95rem',
                  borderRadius: '9999px',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {currentOrder.status}
              </div>
            </div>

            {/* Stepper Progress */}
            <div className="hud-stepper">
              {[
                { key: 'PLACED', label: 'Placed' },
                { key: 'ACCEPTED', label: 'Accepted' },
                { key: 'PREPARING', label: 'Cooking' },
                { key: 'PICKED_UP', label: 'Picked Up' },
                { key: 'OUT_FOR_DELIVERY', label: 'On Way' },
                { key: 'DELIVERED', label: 'Delivered' }
              ].map((step, idx) => {
                const isDone = activeStepIndex > idx;
                const isCurrent = activeStepIndex === idx;
                return (
                  <div
                    key={step.key}
                    className={`hud-step-item ${isCurrent ? 'active' : ''} ${isDone ? 'completed' : ''}`}
                  >
                    <div className="hud-step-node">{isDone ? '✓' : idx + 1}</div>
                    <span className="hud-step-label">{step.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Courier Card */}
            <div className="rider-card">
              <div className="rider-avatar">🛵</div>
              <div className="rider-info" style={{ flex: 1 }}>
                <h5>Vikram S. • Ather 450X EV (KA-03-EK-9482)</h5>
                <p>Express Fleet Partner • 4.96 ★ (2,410 on-time deliveries)</p>
                <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '0.25rem' }}>
                  📞 Direct Masked Line: +91 98765-43210
                </div>
              </div>
            </div>

            {/* Order item recap in modal */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem 1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
              <div style={{ fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-white)' }}>
                Order Items ({currentOrder.items.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', color: 'var(--text-secondary)' }}>
                {currentOrder.items.map((i) => (
                  <div key={i.menuItemId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{i.quantity}x {i.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{formatPaise(i.lineTotalPaise)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulation Actions */}
            <div className="modal-actions">
              {currentOrder.status !== 'DELIVERED' && (
                <button className="advance-sim-btn" onClick={advanceSimulation}>
                  ⏩ Advance Telemetry Stage
                </button>
              )}
              <button className="close-modal-btn" onClick={() => setIsTrackingModalOpen(false)}>
                Keep Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         KITCHEN OPERATOR KDS VIEW
         ========================================================================= */}
      {viewMode === 'operator' && (
        <div className="operator-container">
          <div className="kds-header">
            <div>
              <h2>👨‍🍳 Kitchen Display & Order Management</h2>
              <p>Real-time order state machine for restaurant chefs and dispatchers</p>
            </div>
            <div className="kds-metrics">
              <div className="kds-metric-card">
                <div className="kds-metric-val">{operatorOrders.length}</div>
                <div className="kds-metric-label">Total Orders</div>
              </div>
              <div className="kds-metric-card">
                <div className="kds-metric-val">
                  {operatorOrders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length}
                </div>
                <div className="kds-metric-label">Active Kitchen</div>
              </div>
              <div className="kds-metric-card">
                <div className="kds-metric-val">
                  {operatorOrders.filter((o) => o.status === 'DELIVERED').length}
                </div>
                <div className="kds-metric-label">Delivered</div>
              </div>
              <div className="kds-metric-card">
                <div className="kds-metric-val" style={{ color: '#10b981' }}>
                  98.4%
                </div>
                <div className="kds-metric-label">Efficiency</div>
              </div>
            </div>
          </div>

          <div className="kds-board">
            {/* Column 1: Placed */}
            <div className="kds-column">
              <div className="kds-col-header">
                <h4>🟡 Incoming Orders</h4>
                <span className="status-badge PLACED">
                  {operatorOrders.filter((o) => o.status === 'PLACED').length}
                </span>
              </div>
              {operatorOrders.filter((o) => o.status === 'PLACED').map((ord) => (
                <div key={ord.id} className="kds-order-card">
                  <div className="kds-order-top">
                    <span className="kds-order-id">#{ord.id}</span>
                    <span className="status-badge PLACED">PLACED</span>
                  </div>
                  <div className="kds-items-list">
                    {ord.items.map((i) => (
                      <div key={i.menuItemId}>
                        {i.quantity}x {i.name}
                      </div>
                    ))}
                  </div>
                  <div className="kds-order-footer">
                    <span>{formatPaise(ord.totalPaise)}</span>
                    <button
                      className="kds-action-btn"
                      onClick={() => updateOrderStatus(ord.id, 'ACCEPTED')}
                    >
                      Accept Order →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 2: In Kitchen */}
            <div className="kds-column">
              <div className="kds-col-header">
                <h4>🟠 Kitchen In-Progress</h4>
                <span className="status-badge PREPARING">
                  {operatorOrders.filter((o) => o.status === 'ACCEPTED' || o.status === 'PREPARING').length}
                </span>
              </div>
              {operatorOrders.filter((o) => o.status === 'ACCEPTED' || o.status === 'PREPARING').map((ord) => (
                <div key={ord.id} className="kds-order-card">
                  <div className="kds-order-top">
                    <span className="kds-order-id">#{ord.id}</span>
                    <span className={`status-badge ${ord.status}`}>{ord.status}</span>
                  </div>
                  <div className="kds-items-list">
                    {ord.items.map((i) => (
                      <div key={i.menuItemId}>
                        {i.quantity}x {i.name}
                      </div>
                    ))}
                  </div>
                  <div className="kds-order-footer">
                    <span>{formatPaise(ord.totalPaise)}</span>
                    <button
                      className="kds-action-btn"
                      onClick={() =>
                        updateOrderStatus(ord.id, ord.status === 'ACCEPTED' ? 'PREPARING' : 'PICKED_UP')
                      }
                    >
                      {ord.status === 'ACCEPTED' ? 'Start Cooking →' : 'Food Ready →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 3: Out for delivery */}
            <div className="kds-column">
              <div className="kds-col-header">
                <h4>🔵 Out for Delivery</h4>
                <span className="status-badge OUT_FOR_DELIVERY">
                  {operatorOrders.filter((o) => o.status === 'PICKED_UP' || o.status === 'OUT_FOR_DELIVERY').length}
                </span>
              </div>
              {operatorOrders.filter((o) => o.status === 'PICKED_UP' || o.status === 'OUT_FOR_DELIVERY').map((ord) => (
                <div key={ord.id} className="kds-order-card">
                  <div className="kds-order-top">
                    <span className="kds-order-id">#{ord.id}</span>
                    <span className={`status-badge ${ord.status}`}>{ord.status}</span>
                  </div>
                  <div className="kds-items-list">
                    {ord.items.map((i) => (
                      <div key={i.menuItemId}>
                        {i.quantity}x {i.name}
                      </div>
                    ))}
                  </div>
                  <div className="kds-order-footer">
                    <span>{formatPaise(ord.totalPaise)}</span>
                    <button
                      className="kds-action-btn"
                      onClick={() =>
                        updateOrderStatus(ord.id, ord.status === 'PICKED_UP' ? 'OUT_FOR_DELIVERY' : 'DELIVERED')
                      }
                    >
                      {ord.status === 'PICKED_UP' ? 'Rider Dispatched →' : 'Mark Delivered ✓'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 4: Delivered */}
            <div className="kds-column">
              <div className="kds-col-header">
                <h4>🟢 Delivered Orders</h4>
                <span className="status-badge DELIVERED">
                  {operatorOrders.filter((o) => o.status === 'DELIVERED').length}
                </span>
              </div>
              {operatorOrders.filter((o) => o.status === 'DELIVERED').map((ord) => (
                <div key={ord.id} className="kds-order-card" style={{ opacity: 0.85 }}>
                  <div className="kds-order-top">
                    <span className="kds-order-id">#{ord.id}</span>
                    <span className="status-badge DELIVERED">DELIVERED</span>
                  </div>
                  <div className="kds-items-list">
                    {ord.items.map((i) => (
                      <div key={i.menuItemId}>
                        {i.quantity}x {i.name}
                      </div>
                    ))}
                  </div>
                  <div className="kds-order-footer">
                    <span>{formatPaise(ord.totalPaise)}</span>
                    <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 800 }}>
                      ✓ Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Dynamic Island Capsule */}
      <aside className="dynamic-island" aria-label="Quick order telemetry">
        <div className="island-left">
          <span className="island-dot" />
          <div className="island-text">
            {totalCartCount > 0 ? (
              <>
                <strong>{totalCartCount} {totalCartCount === 1 ? 'Delicacy' : 'Delicacies'} in Feast Basket</strong>
                <span> • {formatPaise(cartSubtotalPaise)}</span>
              </>
            ) : currentOrder && currentOrder.status !== 'DELIVERED' ? (
              <>
                <strong>Courier Vikram S. in Flight</strong>
                <span> • Order #{currentOrder.id.slice(-6)} • {formattedCountdown}</span>
              </>
            ) : (
              <>
                <strong>{currentHub.name} Node Live</strong>
                <span> • 18 min dispatch • Zero Delivery Surcharge</span>
              </>
            )}
          </div>
        </div>
        <div>
          {totalCartCount > 0 ? (
            <button
              className="island-action-btn"
              onClick={() => {
                setIsCartOpen(true);
                playToggleSound();
              }}
            >
              Checkout Feast →
            </button>
          ) : currentOrder && currentOrder.status !== 'DELIVERED' ? (
            <button
              className="island-action-btn"
              onClick={() => {
                setIsTrackingModalOpen(true);
                playToggleSound();
              }}
            >
              Live HUD →
            </button>
          ) : (
            <button
              className="island-action-btn"
              onClick={() => {
                const el = document.querySelector('.kitchens-grid');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                playToggleSound();
              }}
            >
              Explore Menus →
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

export default App;
