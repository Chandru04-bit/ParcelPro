/* ========== ParcelPro - Data Store (localStorage) ========== */
window.ParcelProStore = (() => {
  const KEY = 'parcelpro-parcels';

  /* ---------- Core helpers ---------- */
  const readAll = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  };
  const writeAll = (parcels) => localStorage.setItem(KEY, JSON.stringify(parcels));

  /* ---------- Status definitions ---------- */
  const STATUSES = [
    'Order Placed',
    'Picked Up',
    'In Transit',
    'Out for Delivery',
    'Delivered'
  ];

  /* ---------- Distance simulator (city-pair pseudo-distance in km) ---------- */
  const DISTANCE_MAP = {
    'new york-los angeles': 3940, 'los angeles-new york': 3940,
    'new york-chicago': 1145, 'chicago-new york': 1145,
    'new york-houston': 2280, 'houston-new york': 2280,
    'new york-phoenix': 3440, 'phoenix-new york': 3440,
    'new york-london': 5585, 'london-new york': 5585,
    'new york-berlin': 6385, 'berlin-new york': 6385,
    'los angeles-chicago': 2800, 'chicago-los angeles': 2800,
    'los angeles-houston': 2220, 'houston-los angeles': 2220,
    'los angeles-phoenix': 600,  'phoenix-los angeles': 600,
    'los angeles-paris': 9085,   'paris-los angeles': 9085,
    'los angeles-tokyo': 8775,   'tokyo-los angeles': 8775,
    'chicago-houston': 1510,     'houston-chicago': 1510,
    'chicago-phoenix': 2330,     'phoenix-chicago': 2330,
    'houston-phoenix': 1630,     'phoenix-houston': 1630,
    'london-paris': 344,         'paris-london': 344,
    'london-berlin': 930,        'berlin-london': 930,
    'london-tokyo': 9560,        'tokyo-london': 9560,
    'paris-berlin': 878,         'berlin-paris': 878,
    'paris-tokyo': 9710,         'tokyo-paris': 9710,
    'berlin-tokyo': 8920,        'tokyo-berlin': 8920
  };

  function estimateDistance(fromCity, toCity) {
    if (!fromCity || !toCity) return 500;
    const a = String(fromCity).trim().toLowerCase();
    const b = String(toCity).trim().toLowerCase();
    if (a === b) return 25;
    const key = `${a}-${b}`;
    if (DISTANCE_MAP[key]) return DISTANCE_MAP[key];
    /* Deterministic pseudo-distance between 120-5000 km */
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return 120 + (hash % 4880);
  }

  /* ---------- Price calculator ---------- */
  function calculateQuote({ pickupCity, deliveryCity, weight, deliveryType = 'Domestic' }) {
    const base_price = 50;
    const per_km = 5;
    const per_kg = 20;
    const distance = estimateDistance(pickupCity, deliveryCity);
    const w = Math.max(0.1, parseFloat(weight) || 0.1);
    let subtotal = base_price + (distance * per_km / 10) + (w * per_kg);
    let multiplier = 1;
    let etad = 3;
    const t = String(deliveryType).toLowerCase();
    if (t.includes('international')) { multiplier = 2.2; etad = 7; }
    else if (t.includes('same')) { multiplier = 1.8; etad = 0; }
    else { multiplier = 1; etad = 3; }
    const total = Math.round(subtotal * multiplier * 100) / 100;
    const today = new Date();
    const etaDate = new Date(today);
    if (etad === 0) etaDate.setHours(today.getHours() + 6);
    else etaDate.setDate(today.getDate() + etad + Math.round(distance / 1500));
    return {
      base_price,
      distance,
      weight: w,
      deliveryType,
      distanceCharge: +(distance * per_km / 10).toFixed(2),
      weightCharge: +(w * per_kg).toFixed(2),
      multiplier,
      total,
      etaDate: etaDate.toISOString(),
      etaText: etad === 0
        ? 'Same Day (within 6 hours)'
        : `${etad + Math.round(distance / 1500)} Business Days`
    };
  }

  /* ---------- Generate Tracking ID (PK + random number) ---------- */
  function generateTrackingId() {
    const rand = Math.floor(10000000 + Math.random() * 90000000);
    return `PK${rand}`;
  }

  /* ---------- Build timeline steps based on status index ---------- */
  function buildTimeline(parcel) {
    const created = parcel.createdAt || new Date().toISOString();
    const baseDate = new Date(created);
    const activeIndex = STATUSES.indexOf(parcel.status || 'Order Placed');
    const locations = parcel.locations || {};
    return STATUSES.map((s, i) => {
      const d = new Date(baseDate.getTime() + i * 1000 * 60 * 60 * (i === 0 ? 0.1 : 8 + i * 3));
      let location = 'ParcelPro Processing Center';
      if (i === 0) location = locations.pickupCity || parcel.pickupAddress || 'Online';
      else if (i === 1) location = `Picked up from ${locations.pickupCity || 'sender address'}`;
      else if (i === 2) location = `${locations.hubCity || 'Regional Hub'} Sorting Center`;
      else if (i === 3) location = `Out for delivery in ${locations.deliveryCity || 'destination city'}`;
      else location = `Delivered to ${locations.deliveryCity || 'recipient address'}`;
      return {
        status: s,
        done: i < activeIndex,
        active: i === activeIndex,
        date: d.toISOString(),
        location
      };
    });
  }

  /* ---------- CRUD ---------- */
  function getAll() { return readAll(); }

  function getById(id) {
    if (!id) return null;
    const key = String(id).toUpperCase();
    return readAll().find(p =>
      String(p.id || '').toUpperCase() === key ||
      String(p.trackingId || '').toUpperCase() === key
    ) || null;
  }

  function create(parcel) {
    const trackingId = parcel.id || parcel.trackingId || generateTrackingId();
    const quote = parcel.quote || calculateQuote({
      pickupCity: parcel.pickupCity,
      deliveryCity: parcel.deliveryCity,
      weight: parcel.weight,
      deliveryType: parcel.deliveryType || parcel.serviceLevel
    });
    const pickupVal = parcel.pickup || parcel.pickupCity || parcel.pickupAddress || '';
    const deliveryVal = parcel.delivery || parcel.deliveryCity || parcel.receiverAddress || '';
    const etaVal = parcel.eta || quote.etaText || '2-3 days';
    const record = {
      ...parcel,
      id: trackingId,
      trackingId,
      pickup: pickupVal,
      delivery: deliveryVal,
      weight: parcel.weight || quote.weight || '',
      status: parcel.status || 'Order Placed',
      eta: etaVal,
      quote,
      totalAmount: parcel.totalAmount || quote.total,
      createdAt: parcel.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentStatus: parcel.paymentStatus || 'Unpaid',
      timeline: []
    };
    record.timeline = buildTimeline(record);
    const all = readAll();
    all.unshift(record);
    writeAll(all);
    return record;
  }

  function update(id, changes) {
    const all = readAll();
    const idx = all.findIndex(p => String(p.id).toUpperCase() === String(id).toUpperCase());
    if (idx < 0) return null;
    all[idx] = { ...all[idx], ...changes, updatedAt: new Date().toISOString() };
    if (changes.status) all[idx].timeline = buildTimeline(all[idx]);
    writeAll(all);
    return all[idx];
  }

  function remove(id) {
    const before = readAll();
    const after = before.filter(p => String(p.id).toUpperCase() !== String(id).toUpperCase());
    writeAll(after);
    return before.length !== after.length;
  }

  function updateStatus(id, status) {
    if (!STATUSES.includes(status)) return null;
    return update(id, { status });
  }

  function advanceStatus(id) {
    const p = getById(id);
    if (!p) return null;
    const idx = STATUSES.indexOf(p.status);
    if (idx < 0 || idx >= STATUSES.length - 1) return p;
    return updateStatus(id, STATUSES[idx + 1]);
  }

  function byUser(email) {
    const key = String(email || '').toLowerCase();
    return readAll().filter(p => String(p.userEmail || '').toLowerCase() === key);
  }

  /* ---------- Demo shipment data ---------- */
  function ensureDemoShipments() {
    const firstId = 'PK20258432A';
    const secondId = 'PX9876EXPRESS';
    const shipments = [];
    if (!getById(firstId)) {
      shipments.push(create({
        id: firstId,
        trackingId: firstId,
        userEmail: 'demo@parcelpro.com',
        senderName: 'Michael Chen',
        senderPhone: '+1 (555) 123-4567',
        pickupAddress: '123 Shipping Ave, Newark, NJ 07102',
        pickupCity: 'New York',
        pickupDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        receiverName: 'Jennifer Adams',
        receiverPhone: '+1 (555) 201-9932',
        receiverAddress: '789 Sunrise Blvd, Los Angeles, CA 90001',
        deliveryCity: 'Los Angeles',
        type: 'Box',
        parcelType: 'Box',
        weight: 4.5,
        serviceLevel: 'Express (1–2 days)',
        deliveryType: 'Express',
        paymentMethod: 'Credit or Debit Card',
        paymentReference: 'Visa •• 4242',
        paymentStatus: 'Paid',
        status: 'Out for Delivery',
        totalAmount: 76.20,
        locations: { pickupCity: 'Newark, USA', hubCity: 'Newark Central Hub', deliveryCity: 'Los Angeles, USA' },
        quote: {
          base_price: 50, distance: 3940, weight: 4.5, deliveryType: 'Express',
          distanceCharge: 197, weightCharge: 90, multiplier: 1.3, total: 76.20,
          etaDate: new Date(Date.now() + 86400000).toISOString(),
          etaText: '1-2 Business Days'
        }
      }));
    } else {
      shipments.push(getById(firstId));
    }
    if (!getById(secondId)) {
      shipments.push(create({
        id: secondId,
        trackingId: secondId,
        userEmail: 'demo@parcelpro.com',
        senderName: 'Emma Thompson',
        senderPhone: '+44 20 7946 0958',
        pickupAddress: '45 Paddington Street, London W1U 5HG, United Kingdom',
        pickupCity: 'London',
        pickupDate: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        receiverName: 'Hiroshi Tanaka',
        receiverPhone: '+81 3-6895-4231',
        receiverAddress: '2-11-1 Meguro-ku, Kamimeguro, Tokyo 153-0051, Japan',
        deliveryCity: 'Tokyo',
        type: 'Box',
        parcelType: 'Box',
        weight: 8.2,
        serviceLevel: 'International Priority',
        deliveryType: 'International',
        paymentMethod: 'Digital Wallet',
        paymentReference: 'PayPal • emma@paypal.com',
        paymentStatus: 'Paid',
        status: 'Delivered',
        totalAmount: 184.50,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        locations: { pickupCity: 'London, UK', hubCity: 'Heathrow Global Hub', deliveryCity: 'Tokyo, Japan' },
        quote: {
          base_price: 50, distance: 9560, weight: 8.2, deliveryType: 'International',
          distanceCharge: 478, weightCharge: 164, multiplier: 2.2, total: 184.50,
          etaDate: new Date(Date.now() - 86400000).toISOString(),
          etaText: '5-7 Business Days'
        }
      }));
    } else {
      shipments.push(getById(secondId));
    }
    return shipments;
  }

  function ensureDemoShipment() {
    ensureDemoShipments();
    const demoId = 'PK20258432A';
    return getById(demoId);
  }

  ensureDemoShipments();

  return {
    STATUSES,
    getAll,
    getById,
    create,
    update,
    remove,
    delete: remove,
    updateStatus,
    advanceStatus,
    byUser,
    calculateQuote,
    estimateDistance,
    generateTrackingId,
    buildTimeline,
    ensureDemoShipment,
    ensureDemoShipments
  };
})();
