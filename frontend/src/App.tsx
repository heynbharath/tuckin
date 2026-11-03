import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import './App.css';
import { formatPaise } from './utils.js';
import {
  FALLBACK_RESTAURANTS,
  FALLBACK_MENU_ITEMS,
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

const CUISINE_FILTERS = [
  { id: 'All', label: 'All Cuisines', emoji: '🌟' },
  { id: 'Biryani', label: 'Dum Biryani', emoji: '🍗' },
  { id: 'South Indian', label: 'South Tiffin', emoji: '🥞' },
  { id: 'Burgers', label: 'Craft Burgers', emoji: '🍔' },
  { id: 'Pizza', label: 'Artisan Pizza', emoji: '🍕' },
  { id: 'Pan-Asian', label: 'Pan-Asian', emoji: '🥢' }
];

export function App() {
  const [viewMode, setViewMode] = useState<'customer' | 'operator'>('customer');
  const [activeView, setActiveView] = useState<'home' | 'restaurant-detail'>('home');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, { item: MenuItem; quantity: number }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Overlays
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  // Cart customization
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [selectedTipPaise, setSelectedTipPaise] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');

  // Orders & Simulation
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryTracking | null>(null);
  const [operatorOrders, setOperatorOrders] = useState<Order[]>([]);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(24 * 60);

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

  // Keyboard shortcut: Cmd+K / Ctrl+K to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsCartOpen(false);
        setIsTrackingModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Confetti burst animation
  const launchConfetti = () => {
    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ff5722', '#ff8a50', '#f59e0b', '#10b981', '#38bdf8', '#ffffff'];
    const particles = Array.from({ length: 85 }, () => ({
      x: canvas.width / 2,
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.75) * 16,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      alpha: 1,
      decay: Math.random() * 0.015 + 0.012,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10
    }));

    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
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

  // Load menu for a restaurant
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

  // Switch to restaurant detail
  const openRestaurantMenu = (restaurant: Restaurant) => {
    selectRestaurant(restaurant);
    setActiveView('restaurant-detail');
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
    showToast(`Added ${item.name} to basket`);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }
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
    if (appliedCoupon === 'TUCKIN50') {
      // 50% discount up to ₹100 (= 10,000 paise)
      return Math.min(10000, Math.floor(cartSubtotalPaise * 0.5));
    }
    return 0;
  }, [appliedCoupon, cartSubtotalPaise]);

  const deliveryFeePaise = 0; // Free delivery promotion
  const platformFeePaise = cartSubtotalPaise > 0 ? 1500 : 0; // ₹15.00 packaging & platform fee
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
          deliveryZone: activeRest.deliveryZone,
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
        showToast('🎉 Order placed! Courier simulation active.');
        launchConfetti();
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
      deliveryZone: activeRest.deliveryZone,
      estimatedDeliveryMinutes: 24,
      createdAt: new Date().toISOString()
    };
    setCurrentOrder(mockOrder);
    setCart({});
    setIsCartOpen(false);
    setIsTrackingModalOpen(true);
    setCountdownSeconds(24 * 60);
    setDeliveryInfo({
      orderId: mockOrder.id,
      status: 'PLACED',
      estimatedDeliveryMinutes: 24,
      simulated: true,
      updatedAt: new Date().toISOString()
    });
    setOperatorOrders((prev) => [mockOrder, ...prev]);
    showToast('🎉 Order placed! Courier simulation active.');
    launchConfetti();
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
      return matchesCuisine && matchesSearch;
    });
  }, [restaurants, selectedCuisine, searchQuery]);

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
      {/* Pure JS Confetti Canvas */}
      <canvas id="confetti-canvas" className="confetti-canvas" />

      {/* Floating Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--color-ember-gradient)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.9rem',
            padding: '12px 22px',
            borderRadius: '9999px',
            boxShadow: '0 12px 30px rgba(255, 87, 34, 0.45)',
            zIndex: 4000,
            animation: 'fadeIn 0.2s ease',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          {notification}
        </div>
      )}

      {/* Top Navigation */}
      <header className="app-header">
        <div className="brand-section">
          <div
            className="brand-logo"
            onClick={() => {
              setViewMode('customer');
              setActiveView('home');
            }}
          >
            <span className="logo-icon">🍛</span>
            <h1>Tuckin</h1>
          </div>
          <div className="location-pill" title="Serving hyper-local cloud kitchens">
            <span className="radar-dot" />
            <span>Indiranagar Central • <strong>Live Hub</strong></span>
          </div>
        </div>

        <div className="header-center">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search dishes, biryani, burgers, artisan pizza..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="kbd-hint">⌘K</span>
          </div>
        </div>

        <div className="header-actions">
          <div className="mode-toggle">
            <button
              className={`mode-btn ${viewMode === 'customer' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('customer');
              }}
            >
              🍽️ Food Menu
            </button>
            <button
              className={`mode-btn ${viewMode === 'operator' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('operator');
                loadOperatorOrders();
              }}
            >
              👨‍🍳 Kitchen KDS
            </button>
          </div>

          {currentOrder && currentOrder.status !== 'DELIVERED' && (
            <button
              className="mode-btn"
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                fontWeight: 800
              }}
              onClick={() => setIsTrackingModalOpen(true)}
            >
              🛵 Track Order (#{currentOrder.id.slice(-6)})
            </button>
          )}

          {viewMode === 'customer' && (
            <button className="cart-toggle-btn" onClick={() => setIsCartOpen(true)}>
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
                  <span>⚡ NEXT-GEN HYPERLOCAL CLOUD KITCHEN • 18-MIN DISPATCH</span>
                </div>
                <div className="hero-main-title">
                  <div className="hero-text">
                    <h2>Instant Culinary Cloud.</h2>
                    <p>
                      Chef-crafted gourmet meals, fired on-demand and dispatched at hyper-speed across
                      Bengaluru. Zero compromises on taste.
                    </p>
                  </div>
                  <div className="telemetry-strip">
                    <div className="telemetry-item">
                      <span className="telemetry-val">18m</span>
                      <span className="telemetry-label">Avg Dispatch</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="telemetry-val">28,490+</span>
                      <span className="telemetry-label">Meals Cooked</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="telemetry-val">4.92 ★</span>
                      <span className="telemetry-label">App Rating</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="telemetry-val">100%</span>
                      <span className="telemetry-label">Fresh Fired</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cuisine Stories Strip */}
              <div className="cuisine-bubbles-strip" style={{ paddingLeft: 0, paddingRight: 0 }}>
                {CUISINE_FILTERS.map((cat) => (
                  <button
                    key={cat.id}
                    className={`cuisine-bubble-card ${selectedCuisine === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCuisine(cat.id)}
                  >
                    <div className="bubble-avatar">{cat.emoji}</div>
                    <span className="bubble-label">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Partner Cloud Kitchens Grid */}
              <section>
                <div className="section-headline">
                  <div>
                    <h3>Partner Cloud Kitchens</h3>
                    <span className="sub-tag">5 Michelin-inspired kitchens ready for instant dispatch</span>
                  </div>
                  <span className="sub-tag" style={{ fontFamily: 'var(--font-mono)' }}>
                    {filteredRestaurants.length} active kitchens
                  </span>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                    Loading gourmet kitchens...
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
                            <span style={{ color: '#10b981', fontWeight: 700 }}>Open Now →</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* Trending Chef Specials Grid */}
              <section style={{ marginTop: '1rem' }}>
                <div className="section-headline">
                  <div>
                    <h3>Trending Chef Specials</h3>
                    <span className="sub-tag">Top-rated signature dishes hand-crafted by master chefs</span>
                  </div>
                  <span className="sub-tag" style={{ color: '#ff8a50', fontWeight: 700 }}>
                    🔥 High Demand
                  </span>
                </div>

                <div className="trending-grid">
                  {trendingSpecials.map((dish) => {
                    const inCart = cart[dish.id]?.quantity || 0;
                    const rest = restaurants.find((r) => r.id === dish.restaurantId);
                    return (
                      <div key={dish.id} className="trending-card">
                        <div className="trending-card-top">
                          <img src={dish.imageUrl} alt={dish.name} className="trending-thumb" loading="lazy" />
                          <div className="trending-info">
                            <h4>{dish.name}</h4>
                            <div className="trending-origin">{rest?.name || 'Chef Special'}</div>
                            <div className="trending-price">{formatPaise(dish.pricePaise)}</div>
                          </div>
                        </div>

                        <div className="trending-card-bottom">
                          <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>
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
                      <span style={{ color: '#10b981', fontWeight: 700 }}>⚡ Free Delivery</span>
                    </div>
                  </div>
                </div>

                {/* Category Pills Strip */}
                <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`mode-btn ${selectedCategory === cat ? 'active' : ''}`}
                      style={{
                        background: selectedCategory === cat ? 'var(--color-ember-gradient)' : 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-pill)',
                        padding: '0.45rem 1rem'
                      }}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat === 'All' ? '🌟 All Dishes' : cat}
                    </button>
                  ))}
                </div>

                {/* Dishes Grid */}
                {menuLoading ? (
                  <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                    Loading menu dishes...
                  </div>
                ) : (
                  <div className="dishes-bento-grid">
                    {filteredDishes.map((item) => {
                      const inCart = cart[item.id]?.quantity || 0;
                      return (
                        <article key={item.id} className="bento-dish-card">
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

                          <div className="dish-card-actions">
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
         SLIDE-OVER CART DRAWER
         ========================================================================= */}
      {isCartOpen && (
        <div className="drawer-backdrop" onClick={() => setIsCartOpen(false)}>
          <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>
                🛒 Your Feast Basket <span style={{ color: '#ff8a50', fontSize: '0.9rem' }}>({totalCartCount})</span>
              </h3>
              <button className="drawer-close-btn" onClick={() => setIsCartOpen(false)}>
                ✕
              </button>
            </div>

            <div className="drawer-content">
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

                  {/* Coupon Box */}
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
                            fontSize: '0.75rem',
                            color: '#ff8a50',
                            marginTop: '0.4rem',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setAppliedCoupon('TUCKIN50');
                            showToast('🎉 TUCKIN50 applied! ₹100 saved.');
                          }}
                        >
                          ⚡ Tap here to auto-apply <strong>TUCKIN50</strong> for ₹100 OFF
                        </div>
                      </>
                    )}
                  </div>

                  {/* Delivery Partner Tip */}
                  <div>
                    <div className="cart-section-title">Delivery Partner Tip</div>
                    <div className="tip-pills-row">
                      {[
                        { label: 'None', paise: 0 },
                        { label: '₹20', paise: 2000 },
                        { label: '₹30', paise: 3000 },
                        { label: '₹50', paise: 5000 }
                      ].map((tip) => (
                        <button
                          key={tip.paise}
                          className={`tip-pill-btn ${selectedTipPaise === tip.paise ? 'active' : ''}`}
                          onClick={() => setSelectedTipPaise(tip.paise)}
                        >
                          {tip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <div className="cart-section-title">Payment Method (Mock)</div>
                    <div className="payment-options-grid">
                      {[
                        { id: 'upi', label: '⚡ Mock UPI / Google Pay (Instant)', desc: 'Zero gateway fees' },
                        { id: 'card', label: '💳 Mock Credit / Debit Card', desc: 'Encrypted test sandbox' },
                        { id: 'cod', label: '💵 Cash / Pay on Delivery', desc: 'Pay courier at doorstep' }
                      ].map((method) => (
                        <div
                          key={method.id}
                          className={`payment-option-card ${paymentMethod === method.id ? 'active' : ''}`}
                          onClick={() => setPaymentMethod(method.id as 'upi' | 'card' | 'cod')}
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
                      <span>Item Total</span>
                      <span>{formatPaise(cartSubtotalPaise)}</span>
                    </div>
                    {discountPaise > 0 && (
                      <div className="bill-row discount-row">
                        <span>Coupon Discount ({appliedCoupon})</span>
                        <span>-{formatPaise(discountPaise)}</span>
                      </div>
                    )}
                    <div className="bill-row">
                      <span>Delivery Fee</span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>
                        <span style={{ textDecoration: 'line-through', color: '#64748b', marginRight: '6px' }}>
                          ₹30.00
                        </span>
                        FREE
                      </span>
                    </div>
                    <div className="bill-row">
                      <span>Platform & Packaging</span>
                      <span>₹15.00</span>
                    </div>
                    {selectedTipPaise > 0 && (
                      <div className="bill-row">
                        <span>Driver Tip</span>
                        <span>{formatPaise(selectedTipPaise)}</span>
                      </div>
                    )}
                    <div className="bill-row total-row">
                      <span>Grand Total</span>
                      <span style={{ color: '#ff5722' }}>{formatPaise(grandTotalPaise)}</span>
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
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
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
                <h5>Vikram S. • Honda Activa (KA-03-EK-9482)</h5>
                <p>Express Fleet Partner • 4.9 ★ (1,840+ deliveries)</p>
                <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '0.2rem' }}>
                  📞 Direct Courier Line: +91 98765-43210 (Masked)
                </div>
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
                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>
                      ✓ Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
