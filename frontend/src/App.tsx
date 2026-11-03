import { useEffect, useState, useCallback, useMemo } from 'react';
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

export function App() {
  const [viewMode, setViewMode] = useState<'customer' | 'operator'>('customer');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, { item: MenuItem; quantity: number }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryTracking | null>(null);
  const [operatorOrders, setOperatorOrders] = useState<Order[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Show temporary toast notification
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Load menu for a selected restaurant
  const selectRestaurant = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
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
        // Fallback demo data
        const fallback = FALLBACK_MENU_ITEMS.filter((item) => item.restaurantId === restaurant.id);
        setMenuItems(fallback);
        setMenuLoading(false);
      });
  }, []);

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
        // Handled via local state
      });
  }, []);

  // Initialize restaurants
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

  // Polling delivery tracking
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
          // Ignore polling errors in standalone mode
        });
    }, 4000);

    return () => clearInterval(interval);
  }, [currentOrder]);

  // Cart Management
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev[item.id];
      const count = existing ? existing.quantity + 1 : 1;
      return { ...prev, [item.id]: { item, quantity: count } };
    });
    showToast(`Added ${item.name} to cart`);
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

  const cartSubtotalPaise = useMemo(() => {
    return Object.values(cart).reduce((sum, { item, quantity }) => sum + item.pricePaise * quantity, 0);
  }, [cart]);

  const deliveryFeePaise = cartSubtotalPaise > 0 ? 0 : 0; // Free delivery promo
  const taxesAndFeesPaise = cartSubtotalPaise > 0 ? 1500 : 0; // ₹15.00 packaging & platform fee
  const grandTotalPaise = cartSubtotalPaise + deliveryFeePaise + taxesAndFeesPaise;

  // Checkout order
  const handleCheckout = async () => {
    if (!selectedRestaurant || totalCartCount === 0) return;
    setIsPlacingOrder(true);

    const items = Object.values(cart).map(({ item, quantity }) => ({
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
          restaurantId: selectedRestaurant.id,
          deliveryZone: selectedRestaurant.deliveryZone,
          items: items.map(({ menuItemId, quantity }) => ({ menuItemId, quantity }))
        })
      });

      if (res.ok) {
        const orderData: Order = await res.json();
        setCurrentOrder(orderData);
        setCart({});
        setOperatorOrders((prev) => [orderData, ...prev]);

        const delivRes = await fetch(`/api/delivery/${orderData.id}`);
        if (delivRes.ok) {
          const delivData = await delivRes.json();
          setDeliveryInfo(delivData);
        }
        showToast('🎉 Order placed successfully!');
        return;
      }
    } catch {
      // Proceed to fallback
    }

    // Standalone fallback
    const mockOrder: Order = {
      id: `ord-${Date.now().toString(36).toUpperCase()}`,
      restaurantId: selectedRestaurant.id,
      status: 'PLACED',
      items,
      totalPaise: grandTotalPaise,
      deliveryZone: selectedRestaurant.deliveryZone,
      estimatedDeliveryMinutes: 28,
      createdAt: new Date().toISOString()
    };
    setCurrentOrder(mockOrder);
    setCart({});
    setDeliveryInfo({
      orderId: mockOrder.id,
      status: 'PLACED',
      estimatedDeliveryMinutes: 28,
      simulated: true,
      updatedAt: new Date().toISOString()
    });
    setOperatorOrders((prev) => [mockOrder, ...prev]);
    showToast('🎉 Order placed! Courier simulation active.');
    setIsPlacingOrder(false);
  };

  // Advance delivery simulation
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
      // Handled via local update
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

  // Filtered menu items based on category and search query
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

  const activeStepIndex = useMemo(() => {
    const steps: Order['status'][] = ['PLACED', 'ACCEPTED', 'PREPARING', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    return currentOrder ? steps.indexOf(currentOrder.status) : -1;
  }, [currentOrder]);

  return (
    <div className="app-container">
      {/* Toast Alert */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#22c55e',
          color: '#0a0e17',
          fontWeight: 700,
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 1000,
          animation: 'slideDown 0.25s ease'
        }}>
          {notification}
        </div>
      )}

      {/* Main App Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo" onClick={() => setViewMode('customer')}>
            <span className="logo-icon">🍛</span>
            <div>
              <h1>Tuckin</h1>
            </div>
          </div>
          <div className="location-pill">
            <span className="radar-dot" />
            <span>Indiranagar Central • <strong>Live Hub</strong></span>
          </div>
        </div>

        <div className="header-center">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search dishes, ingredients, cloud kitchens..."
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
              onClick={() => setViewMode('customer')}
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

          {viewMode === 'customer' && (
            <button
              className="cart-toggle-btn"
              onClick={() => {
                const el = document.getElementById('cart-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              🛒 <span className="cart-badge">{totalCartCount}</span>
              {cartSubtotalPaise > 0 && <span>{formatPaise(cartSubtotalPaise)}</span>}
            </button>
          )}
        </div>
      </header>

      {/* CUSTOMER VIEW */}
      {viewMode === 'customer' && (
        <>
          {/* YC Launch Hero Header */}
          <div className="hero-wrapper">
            <div className="hero-announcement">
              <span>⚡ NEXT-GEN CLOUD KITCHEN • SUB-20 MIN DISPATCH</span>
            </div>
            <div className="hero-main-title">
              <div className="hero-text">
                <h2>Instant Culinary Cloud.</h2>
                <p>Chef-crafted gourmet meals, fired on-demand and dispatched at hyper-speed across Bengaluru.</p>
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
              </div>
            </div>
          </div>

          {/* Active Order Live Tracking Tracker */}
          {currentOrder && (
            <div className="active-order-banner">
              <div className="tracker-header">
                <h3>
                  <span>🛵 Live Order Tracking</span>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>#{currentOrder.id}</span>
                </h3>
                <span className="eta-pill">
                  {currentOrder.status === 'DELIVERED'
                    ? '🎉 Order Delivered!'
                    : `⚡ Estimated Arrival: ~${deliveryInfo?.estimatedDeliveryMinutes || currentOrder.estimatedDeliveryMinutes} mins`}
                </span>
              </div>

              {/* Progress Steps */}
              <div className="tracker-stepper">
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
                      className={`step-item ${isCurrent ? 'active' : ''} ${isDone ? 'completed' : ''}`}
                    >
                      <div className="step-node">{isDone ? '✓' : idx + 1}</div>
                      <span>{step.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="tracker-actions">
                {currentOrder.status !== 'DELIVERED' && (
                  <button className="simulate-step-btn" onClick={advanceSimulation}>
                    ⏩ Advance Simulation to Next Step
                  </button>
                )}
                {currentOrder.status === 'DELIVERED' && (
                  <button className="simulate-step-btn" onClick={() => setCurrentOrder(null)}>
                    Dismiss Tracker
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="category-filter-strip">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'All' ? '🌟 All Dishes' : cat}
              </button>
            ))}
          </div>

          {/* 3-Column Content Layout */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>
              <p>Loading kitchens and dishes...</p>
            </div>
          ) : (
            <main className="main-content">
            {/* Left: Partner Kitchens */}
            <section className="kitchens-column">
              <div className="column-header">
                <h3>Partner Kitchens</h3>
                <span className="badge-counter">{restaurants.length} Open</span>
              </div>

              <div className="restaurants-list">
                {restaurants.map((rest) => (
                  <article
                    key={rest.id}
                    className={`restaurant-card ${selectedRestaurant?.id === rest.id ? 'active' : ''}`}
                    onClick={() => selectRestaurant(rest)}
                  >
                    <div className="rest-image-wrap">
                      <img src={rest.imageUrl} alt={rest.name} loading="lazy" />
                      <div className="rest-image-gradient" />
                      <div className="rating-badge">
                        <span className="star">★</span>
                        <span>{rest.rating}</span>
                      </div>
                    </div>
                    <div className="rest-info">
                      <h4>{rest.name}</h4>
                      <div className="rest-cuisine">{rest.cuisine}</div>
                      <p className="rest-desc">{rest.description}</p>
                      <div className="rest-meta">
                        <span>⏱️ {rest.deliveryTime}</span>
                        <span>💰 {rest.priceForTwo}</span>
                        <span className="status-open">Open Now</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Middle: Selected Kitchen Menu */}
            <section className="menu-section">
              {selectedRestaurant && (
                <div className="selected-restaurant-hero">
                  <img src={selectedRestaurant.imageUrl} alt={selectedRestaurant.name} className="hero-thumb" />
                  <div className="hero-details">
                    <h2>{selectedRestaurant.name}</h2>
                    <p>{selectedRestaurant.description}</p>
                    <div className="hero-badges">
                      <span className="hero-badge-item">★ {selectedRestaurant.rating} (500+ reviews)</span>
                      <span>•</span>
                      <span className="hero-badge-item">⏱️ {selectedRestaurant.deliveryTime}</span>
                      <span>•</span>
                      <span className="hero-badge-item">🛵 Zone Central Delivery</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="column-header">
                <h3>
                  {selectedCategory === 'All' ? 'Signature Menu Items' : `${selectedCategory} Specials`}
                </h3>
                <span className="badge-counter">{filteredDishes.length} items</span>
              </div>

              {menuLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  Loading delicious menu items...
                </div>
              ) : (
                <div className="dishes-grid">
                  {filteredDishes.map((item) => {
                    const inCart = cart[item.id]?.quantity || 0;
                    return (
                      <article key={item.id} className="dish-card">
                        <div className="dish-top">
                          <div className="dish-meta-left">
                            <span className="veg-icon">
                              <span className="veg-dot" />
                            </span>
                            <h4 className="dish-title">{item.name}</h4>
                            <div className="dish-price">{formatPaise(item.pricePaise)}</div>
                            <p className="dish-desc">{item.description}</p>
                          </div>
                          <div className="dish-image-wrap">
                            <img src={item.imageUrl} alt={item.name} loading="lazy" />
                          </div>
                        </div>

                        <div className="dish-bottom">
                          <span className="dish-rating-text">
                            ★ {item.rating || 4.8} ({item.votes || 150})
                          </span>

                          {inCart === 0 ? (
                            <button
                              className="add-to-cart-btn"
                              onClick={() => addToCart(item)}
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
                              <button className="qty-btn" onClick={() => addToCart(item)}>
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
            </section>

            {/* Right: Cart & Order Breakdown */}
            <aside id="cart-section" className="cart-sidebar-container">
              <div className="cart-sidebar">
                <div className="column-header">
                  <h3>Your Cart</h3>
                  <span className="badge-counter">{totalCartCount} items</span>
                </div>

                {totalCartCount === 0 ? (
                  <div className="cart-empty-state">
                    <div className="empty-icon">🍱</div>
                    <h4>Your basket is empty</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>
                      Add your favorite items from the menu to build your feast.
                    </p>
                  </div>
                ) : (
                  <>
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

                    <div className="bill-details">
                      <div className="bill-row">
                        <span>Item Total</span>
                        <span>{formatPaise(cartSubtotalPaise)}</span>
                      </div>
                      <div className="bill-row">
                        <span>Delivery Fee</span>
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>
                          <span style={{ textDecoration: 'line-through', color: '#64748b', marginRight: '6px' }}>
                            ₹30
                          </span>
                          FREE
                        </span>
                      </div>
                      <div className="bill-row">
                        <span>Platform & Packaging</span>
                        <span>₹15.00</span>
                      </div>
                      <div className="bill-row total-row">
                        <span>Grand Total</span>
                        <span style={{ color: '#ff5722' }}>{formatPaise(grandTotalPaise)}</span>
                      </div>
                    </div>

                    <button
                      className="checkout-btn"
                      onClick={handleCheckout}
                      disabled={isPlacingOrder}
                    >
                      {isPlacingOrder ? 'Placing Order...' : `⚡ Place Order • ${formatPaise(grandTotalPaise)}`}
                    </button>
                  </>
                )}
              </div>
            </aside>
          </main>
          )}
        </>
      )}

      {/* KITCHEN OPERATOR KDS VIEW */}
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
                <span className="badge-counter">
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
                <span className="badge-counter">
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
                <span className="badge-counter">
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
                <span className="badge-counter">
                  {operatorOrders.filter((o) => o.status === 'DELIVERED').length}
                </span>
              </div>
              {operatorOrders.filter((o) => o.status === 'DELIVERED').map((ord) => (
                <div key={ord.id} className="kds-order-card" style={{ opacity: 0.8 }}>
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
                    <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 600 }}>Completed</span>
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
