// United Coffee — Demo Admin
// Single-page admin with tab switching. Each tab is a render function in
// the `tabs` registry below. Seeded with realistic mock data; pulls live
// orders from localStorage where available so the cart-placed orders show.
(() => {
  'use strict';

  // ---------- Tiny DOM helper ----------
  const el = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') node.className = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k === 'style') node.setAttribute('style', v);
      else if (k.startsWith('aria-')) node.setAttribute(k, v);
      else if (k.startsWith('data-')) node.setAttribute(k, v);
      else if (k in node) node[k] = v;
      else node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null || c === false) continue;
      if (Array.isArray(c)) { c.forEach(x => x && node.appendChild(typeof x === 'string' ? document.createTextNode(x) : x)); continue; }
      node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    }
    return node;
  };
  const clear = (n) => { while (n.firstChild) n.removeChild(n.firstChild); };
  const $ = (sel, root = document) => root.querySelector(sel);
  const fmt$ = (n) => '$' + Number(n).toFixed(2);
  const fmtInt = (n) => Number(n).toLocaleString();
  const fmtTime = (date) => {
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    const am = h < 12;
    const hr = h === 0 ? 12 : (h > 12 ? h - 12 : h);
    return `${hr}:${m}${am ? 'a' : 'p'}`;
  };

  // ==========================================================================
  // SEED DATA — realistic for a Fort Wayne specialty café
  // ==========================================================================

  // Menu — mirrors the public menu.html
  const MENU = [
    { id: 'espresso', section: 'Espresso', items: [
      { name: 'Espresso',     price: 3.50, available: true, sales: 142 },
      { name: 'Doppio',       price: 4.25, available: true, sales: 98 },
      { name: 'Macchiato',    price: 3.95, available: true, sales: 56 },
      { name: 'Cortado',      price: 4.50, available: true, sales: 81 },
      { name: 'Cappuccino',   price: 4.95, available: true, sales: 174 },
      { name: 'Latte',        price: 5.25, available: true, sales: 218 },
      { name: 'Flat White',   price: 5.25, available: true, sales: 64 },
      { name: 'Affogato',     price: 6.50, available: true, sales: 22 },
      { name: 'Shakerato',    price: 5.50, available: true, sales: 19 }
    ]},
    { id: 'brew-tea', section: 'Brew & Tea', items: [
      { name: 'Drip Coffee',     price: 3.25, available: true, sales: 156 },
      { name: 'Pour-Over',       price: 5.50, available: true, sales: 24 },
      { name: 'Cold Brew',       price: 4.75, available: true, sales: 88 },
      { name: 'Espresso Tonic',  price: 5.95, available: true, sales: 31 },
      { name: 'Hot Chocolate',   price: 5.25, available: true, sales: 47 },
      { name: 'Tea — Loose Leaf',price: 3.75, available: true, sales: 38 },
      { name: 'Matcha Latte',    price: 5.50, available: true, sales: 52 },
      { name: 'Chai Latte',      price: 5.25, available: true, sales: 41 }
    ]},
    { id: 'waffles', section: 'Liège Waffles', items: [
      { name: 'Classico',           price: 7.50,  available: true, sales: 38 },
      { name: 'Bacio',              price: 9.95,  available: true, sales: 96 },
      { name: 'Estate',             price: 10.95, available: true, sales: 41 },
      { name: 'Limone',             price: 10.50, available: true, sales: 18 },
      { name: 'Tiramisù Waffle',    price: 11.50, available: true, sales: 33 },
      { name: 'Banana Pecan',       price: 10.95, available: true, sales: 27 },
      { name: 'Berry Bowl',         price: 10.95, available: false, sales: 22 },
      { name: 'Prosciutto & Egg',   price: 12.95, available: true, sales: 19 }
    ]},
    { id: 'savory', section: 'Panini & Bowls', items: [
      { name: 'Caprese',             price: 11.50, available: true, sales: 45 },
      { name: 'Prosciutto e Funghi', price: 13.95, available: true, sales: 38 },
      { name: 'Pollo Pesto',         price: 12.95, available: true, sales: 52 },
      { name: 'Breakfast Panino',    price: 10.50, available: true, sales: 71 },
      { name: 'Insalata della Casa', price: 11.50, available: true, sales: 24 },
      { name: 'Yogurt Parfait',      price: 8.95,  available: true, sales: 33 }
    ]},
    { id: 'dolci', section: 'Dolci', items: [
      { name: 'Cornetto',         price: 4.50, available: true, sales: 88 },
      { name: 'Sfogliatella',     price: 5.95, available: true, sales: 42 },
      { name: 'Biscotti',         price: 3.25, available: true, sales: 67 },
      { name: 'Tiramisù Cup',     price: 7.50, available: true, sales: 31 },
      { name: 'Canolo Siciliano', price: 5.50, available: true, sales: 28 },
      { name: 'Olive Oil Cake',   price: 5.95, available: false, sales: 19 }
    ]},
    { id: 'beans', section: 'Beans to Go', items: [
      { name: 'Gold · Premium',  price: 22.00, available: true, sales: 14 },
      { name: 'Doppio · Espresso', price: 24.00, available: true, sales: 18 },
      { name: 'Decaffeinato',    price: 23.00, available: true, sales: 4 }
    ]}
  ];

  // Build a flat lookup of menu items
  const menuFlat = MENU.flatMap(s => s.items.map(i => ({ ...i, section: s.section })));

  // ---------- Orders: seed with varying ages + statuses ----------
  // Generate a deterministic-ish list anchored to "now"
  const customerNames = ['Marcus T.','Sarah R.','Devon K.','Maria R.','James L.','Emma S.','Olivia M.','Liam B.','Noah C.','Ava H.','Sofia G.','Ethan D.','Mia W.','Lucas P.','Isabella V.','Jack F.','Charlotte K.','Henry A.','Amelia O.','Daniel N.'];
  const pick = (arr, i) => arr[i % arr.length];
  const fakeMods = (idx) => {
    const choices = [
      [{ group: 'Size', label: 'Doppio (8 oz)', price: 0.75 }, { group: 'Milk', label: 'Oat', price: 0.75 }],
      [{ group: 'Size', label: 'Grande (12 oz)', price: 1.25 }, { group: 'Milk', label: 'Whole', price: 0 }],
      [{ group: 'Size', label: 'Piccolo (4 oz)', price: 0 }, { group: 'Milk', label: 'Almond', price: 0.75 }, { group: 'Extras', label: 'Vanilla', price: 0.75 }],
      [{ group: 'Add-ons', label: 'Avocado', price: 1.50 }],
      [{ group: 'Warm it up', label: 'Warmed', price: 0 }],
      []
    ];
    return choices[idx % choices.length];
  };

  const buildSeedOrders = () => {
    const now = new Date();
    const orders = [];
    // 4 active orders (recent, in various non-completed states)
    const activeOffsetsMin = [2, 6, 11, 18];
    const activeStatuses = ['pending', 'preparing', 'preparing', 'ready'];
    activeOffsetsMin.forEach((mins, i) => {
      const placed = new Date(now.getTime() - mins * 60000);
      const itemA = menuFlat[(i * 7) % menuFlat.length];
      const itemB = menuFlat[(i * 11 + 3) % menuFlat.length];
      const items = [
        { name: itemA.name, basePrice: itemA.price, modifiers: fakeMods(i), qty: 1 },
        { name: itemB.name, basePrice: itemB.price, modifiers: fakeMods(i + 1), qty: i === 2 ? 2 : 1 }
      ];
      orders.push({
        id: 'UC-' + (placed.getTime().toString(36).toUpperCase().slice(-6)),
        customer: pick(customerNames, i + 7),
        method: i % 2 === 0 ? 'In-person' : 'Curbside',
        placedAt: placed.toISOString(),
        readyAt: new Date(placed.getTime() + 12 * 60000).toISOString(),
        status: activeStatuses[i],
        items,
        subtotal: items.reduce((s, it) => s + (it.basePrice + it.modifiers.reduce((m, x) => m + x.price, 0)) * it.qty, 0)
      });
    });
    // 8 completed orders earlier today
    for (let i = 0; i < 8; i++) {
      const minsAgo = 30 + i * 18 + Math.floor(Math.random() * 12);
      const placed = new Date(now.getTime() - minsAgo * 60000);
      const itemA = menuFlat[(i * 13) % menuFlat.length];
      const itemB = menuFlat[(i * 17 + 5) % menuFlat.length];
      const items = [
        { name: itemA.name, basePrice: itemA.price, modifiers: fakeMods(i + 2), qty: 1 }
      ];
      if (i % 2 === 0) items.push({ name: itemB.name, basePrice: itemB.price, modifiers: fakeMods(i + 4), qty: 1 });
      orders.push({
        id: 'UC-' + placed.getTime().toString(36).toUpperCase().slice(-6),
        customer: pick(customerNames, i),
        method: i % 3 === 0 ? 'Curbside' : 'In-person',
        placedAt: placed.toISOString(),
        readyAt: new Date(placed.getTime() + 13 * 60000).toISOString(),
        status: 'completed',
        items,
        subtotal: items.reduce((s, it) => s + (it.basePrice + it.modifiers.reduce((m, x) => m + x.price, 0)) * it.qty, 0)
      });
    }
    return orders;
  };

  let orders = buildSeedOrders();

  // Pull any cart-placed orders the customer left in localStorage (just for fun)
  try {
    const cart = JSON.parse(localStorage.getItem('unitedCart') || '{"items":[]}');
    if (cart.items && cart.items.length) {
      const subtotal = cart.items.reduce((s, i) => s + (i.basePrice + (i.modifiers || []).reduce((m, x) => m + x.price, 0)) * i.qty, 0);
      orders.unshift({
        id: 'UC-CART',
        customer: 'You (in-cart preview)',
        method: 'In-person',
        placedAt: new Date().toISOString(),
        readyAt: new Date(Date.now() + 15 * 60000).toISOString(),
        status: 'pending',
        items: cart.items,
        subtotal
      });
    }
  } catch (e) { /* ignore */ }

  // Customers (top regulars)
  const CUSTOMERS = customerNames.slice(0, 12).map((name, i) => ({
    name,
    visits: Math.round(80 - i * 5 + (i % 3) * 6),
    spent: Math.round((1500 - i * 70 + (i % 4) * 30) * 100) / 100,
    last: ['1d ago','2d ago','3d ago','5d ago','1w ago','2w ago'][i % 6],
    drink: ['Cappuccino','Cortado','Latte (oat)','Doppio','Drip','Espresso','Hot Chocolate','Pour-Over'][i % 8]
  }));

  // Events (catering bookings, private events)
  const today = new Date();
  const futureDate = (days, hour) => {
    const d = new Date(today);
    d.setDate(today.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const EVENTS = [
    { date: futureDate(2, 8),  name: 'Sweetwater Office Breakfast',     type: 'Catering · Espresso bar',  status: 'confirmed', value: 850, attendees: 75 },
    { date: futureDate(5, 7),  name: 'Saturday Morning Run Club',        type: 'Recurring · In-store',     status: 'confirmed', value: 0,   attendees: 35 },
    { date: futureDate(8, 18), name: 'Italian Wine Pairing Night',       type: 'Private event · Reserve',  status: 'confirmed', value: 1200, attendees: 24 },
    { date: futureDate(11, 9), name: 'Indiana Tech Coffee + Pastry',     type: 'Catering · Drop-off',      status: 'pending',   value: 425, attendees: 40 },
    { date: futureDate(14, 16),name: 'Coffee 101 Workshop',              type: 'Class · 6 seats',          status: 'confirmed', value: 360, attendees: 6  },
    { date: futureDate(19, 7), name: 'Saturday Morning Run Club',        type: 'Recurring · In-store',     status: 'confirmed', value: 0,   attendees: 35 },
    { date: futureDate(23, 11),name: 'Horani Family Wedding Pre-Party',  type: 'Private event · Buyout',   status: 'confirmed', value: 2800, attendees: 60 }
  ];

  // Hourly distribution today
  const HOURLY = [12, 38, 62, 71, 48, 32, 28, 41, 55, 47, 36, 22, 18];
  const HOUR_LABELS = ['7a','8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p'];

  // ==========================================================================
  // TAB RENDERERS
  // ==========================================================================
  const tabs = {};

  // ---------- Dashboard ----------
  tabs.dashboard = {
    title: 'Today',
    subtitle: 'A live look at the bar',
    render(panel) {
      clear(panel);
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const todayOrders = orders.filter(o => new Date(o.placedAt) >= todayStart);
      const completed = todayOrders.filter(o => o.status === 'completed');
      const revenue = completed.reduce((s, o) => s + o.subtotal * 1.07, 0);
      const avgTicket = completed.length ? revenue / completed.length : 0;
      const open = todayOrders.filter(o => o.status !== 'completed').length;

      // Header
      panel.appendChild(buildHeader('Today', 'A live look at the bar', [
        { label: '⟳ Refresh', class: 'admin-btn ghost' },
        { label: 'Print Day Report', class: 'admin-btn' },
        { label: 'End-of-Day Close', class: 'admin-btn primary' }
      ]));

      // KPI grid
      panel.appendChild(el('div', { class: 'kpi-grid' },
        kpi('Revenue Today',   fmt$(revenue),       '+12.4% vs last Wed', 'up'),
        kpi('Orders',          fmtInt(todayOrders.length), '+8 vs last Wed', 'up'),
        kpi('Avg Ticket',      fmt$(avgTicket),     '+$0.42 vs week avg',  'up'),
        kpi('Open Orders',     fmtInt(open),         open > 3 ? 'Keep moving' : 'On pace', open > 3 ? 'flat' : 'up')
      ));

      // Two-col split: live queue + side stack
      const grid = el('div', { class: 'split-2' });

      // Live order queue
      const queueCard = el('div', { class: 'admin-panel' },
        el('div', { class: 'admin-panel-header' },
          el('div', {},
            el('div', { class: 'admin-panel-title' }, 'Live Order Queue'),
            el('span', { class: 'status live' }, 'Live')
          ),
          el('a', { href: '#', class: 'admin-btn ghost', 'data-jump': 'orders' }, 'View All →')
        )
      );
      const queueList = el('div', {});
      todayOrders.filter(o => o.status !== 'completed').slice(0, 5).forEach(o => queueList.appendChild(buildLiveOrder(o)));
      if (todayOrders.filter(o => o.status !== 'completed').length === 0) {
        queueList.appendChild(el('p', { class: 'text-dim', style: 'padding: 1rem 0;' }, 'All caught up — nothing pending.'));
      }
      queueCard.appendChild(queueList);
      grid.appendChild(queueCard);

      // Right column stack
      const right = el('div', {});

      // Top items today
      const topCard = el('div', { class: 'admin-panel' },
        el('div', { class: 'admin-panel-header' }, el('div', { class: 'admin-panel-title' }, 'Top Items'), el('div', { class: 'admin-panel-meta' }, 'Today')),
        buildBarChart(menuFlat.slice().sort((a, b) => b.sales - a.sales).slice(0, 5).map(i => ({ label: i.name, value: i.sales, suffix: ' sold' })))
      );
      right.appendChild(topCard);

      // Alerts
      const alertCard = el('div', { class: 'admin-panel' },
        el('div', { class: 'admin-panel-header' }, el('div', { class: 'admin-panel-title' }, 'Alerts')),
        alertRow('Whole milk · 1 jug left', 'Reorder before close'),
        alertRow('Berry Bowl waffle out', 'Restock berries Thu AM'),
        alertRow('Square sync', 'Last synced 4 min ago', true)
      );
      right.appendChild(alertCard);

      grid.appendChild(right);
      panel.appendChild(grid);

      // Hourly chart
      const hourCard = el('div', { class: 'admin-panel' },
        el('div', { class: 'admin-panel-header' },
          el('div', { class: 'admin-panel-title' }, 'Orders by Hour'),
          el('div', { class: 'admin-panel-meta' }, 'Today · 7a — 7p')
        ),
        buildColChart(HOURLY, HOUR_LABELS)
      );
      panel.appendChild(hourCard);
    }
  };

  // ---------- Orders ----------
  let orderFilter = 'all';
  tabs.orders = {
    title: 'Orders',
    subtitle: 'Pending, in progress, completed',
    render(panel) {
      clear(panel);
      panel.appendChild(buildHeader('Orders', 'Manage the queue · pickup + curbside', [
        { label: '+ Manual Order', class: 'admin-btn primary' }
      ]));

      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const todayOrders = orders.filter(o => new Date(o.placedAt) >= todayStart);
      const counts = { all: todayOrders.length };
      ['pending','preparing','ready','completed'].forEach(s => counts[s] = todayOrders.filter(o => o.status === s).length);

      const filterRow = el('div', { class: 'filter-row' });
      [['all','All'],['pending','Pending'],['preparing','Preparing'],['ready','Ready'],['completed','Completed']].forEach(([k, label]) => {
        const btn = el('button', { class: 'filter-pill' + (orderFilter === k ? ' is-active' : '') }, `${label} · ${counts[k] || 0}`);
        btn.addEventListener('click', () => { orderFilter = k; tabs.orders.render(panel); });
        filterRow.appendChild(btn);
      });
      panel.appendChild(filterRow);

      const filtered = orderFilter === 'all' ? todayOrders : todayOrders.filter(o => o.status === orderFilter);
      const wrap = el('div', { class: 'admin-panel', style: 'padding: 0;' });
      const table = el('table', { class: 'admin-table' });
      table.appendChild(el('thead', {},
        el('tr', {},
          el('th', {}, 'Order'),
          el('th', {}, 'Customer'),
          el('th', { class: 'hide-sm' }, 'Items'),
          el('th', { class: 'hide-sm' }, 'Method'),
          el('th', {}, 'Time'),
          el('th', {}, 'Status'),
          el('th', { class: 'num' }, 'Total')
        )
      ));
      const tbody = el('tbody', {});
      filtered.sort((a,b) => new Date(b.placedAt) - new Date(a.placedAt)).forEach(o => tbody.appendChild(buildOrderRow(o)));
      table.appendChild(tbody);
      wrap.appendChild(table);
      panel.appendChild(wrap);
    }
  };

  // ---------- Menu ----------
  tabs.menu = {
    title: 'Menu',
    subtitle: 'Edit prices · toggle availability · sold-out',
    render(panel) {
      clear(panel);
      panel.appendChild(buildHeader('Menu', 'Edit prices · toggle availability', [
        { label: '+ Add Item', class: 'admin-btn ghost' },
        { label: 'Save Changes', class: 'admin-btn primary' }
      ]));

      MENU.forEach(section => {
        const card = el('div', { class: 'admin-panel' },
          el('div', { class: 'admin-panel-header' },
            el('div', { class: 'admin-panel-title' }, section.section),
            el('div', { class: 'admin-panel-meta' }, `${section.items.length} items`)
          )
        );
        const table = el('table', { class: 'admin-table' });
        table.appendChild(el('thead', {},
          el('tr', {},
            el('th', {}, 'Item'),
            el('th', { class: 'num' }, 'Price'),
            el('th', { class: 'hide-sm num' }, 'Sold (wk)'),
            el('th', {}, 'Available'),
            el('th', {}, '')
          )
        ));
        const tbody = el('tbody', {});
        section.items.forEach(item => {
          const priceInput = el('input', { class: 'admin-input num', type: 'text', value: item.price.toFixed(2) });
          const toggleInput = el('input', { type: 'checkbox' });
          if (item.available) toggleInput.checked = true;
          toggleInput.addEventListener('change', (e) => {
            item.available = e.target.checked;
          });
          const tr = el('tr', {},
            el('td', {}, el('strong', {}, item.name), item.available ? null : el('span', { class: 'tag', style: 'background: var(--rosso); color: var(--cream); margin-left: 0.5rem;' }, '86\'d')),
            el('td', { class: 'num' }, priceInput),
            el('td', { class: 'hide-sm num' }, fmtInt(item.sales)),
            el('td', {}, el('label', { class: 'toggle' }, toggleInput, el('span', { class: 'toggle-slider' }))),
            el('td', { style: 'text-align: right;' }, el('button', { class: 'admin-btn ghost' }, 'Edit'))
          );
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        card.appendChild(table);
        panel.appendChild(card);
      });
    }
  };

  // ---------- Analytics ----------
  let analyticsRange = 'week';
  tabs.analytics = {
    title: 'Analytics',
    subtitle: 'Sales, items, hours',
    render(panel) {
      clear(panel);
      panel.appendChild(buildHeader('Analytics', 'Sales, items, hours', [
        { label: 'Export CSV', class: 'admin-btn ghost' }
      ]));

      // Range filter
      const filterRow = el('div', { class: 'filter-row' });
      [['day','Today'],['week','This Week'],['month','This Month'],['year','This Year']].forEach(([k, label]) => {
        const btn = el('button', { class: 'filter-pill' + (analyticsRange === k ? ' is-active' : '') }, label);
        btn.addEventListener('click', () => { analyticsRange = k; tabs.analytics.render(panel); });
        filterRow.appendChild(btn);
      });
      panel.appendChild(filterRow);

      const rangeData = {
        day:   { revenue: 1247, orders: 168, ticket: 7.42, repeat: 38, growth: '+12%' },
        week:  { revenue: 8923, orders: 1142, ticket: 7.81, repeat: 64, growth: '+8.3%' },
        month: { revenue: 38540, orders: 4862, ticket: 7.93, repeat: 71, growth: '+14.1%' },
        year:  { revenue: 462180, orders: 58420, ticket: 7.91, repeat: 78, growth: '+22.6%' }
      };
      const r = rangeData[analyticsRange];

      panel.appendChild(el('div', { class: 'kpi-grid' },
        kpi('Revenue', fmt$(r.revenue), `${r.growth} vs prior period`, 'up'),
        kpi('Orders',  fmtInt(r.orders), `${(r.orders / (analyticsRange === 'day' ? 12 : 1)).toFixed(0)}/hr peak`, 'flat'),
        kpi('Avg Ticket', fmt$(r.ticket), 'Italian-roast premium showing', 'up'),
        kpi('Repeat %',   r.repeat + '%', 'Loyal regulars climbing', 'up')
      ));

      // Top items
      panel.appendChild(el('div', { class: 'admin-panel' },
        el('div', { class: 'admin-panel-header' },
          el('div', { class: 'admin-panel-title' }, 'Top 8 Items'),
          el('div', { class: 'admin-panel-meta' }, analyticsRange.toUpperCase())
        ),
        buildBarChart(menuFlat.slice().sort((a,b) => b.sales - a.sales).slice(0, 8).map(i => ({ label: i.name, value: Math.round(i.sales * (analyticsRange === 'day' ? 0.18 : 1)), suffix: ' sold' })))
      ));

      // Hourly + revenue by day-of-week
      panel.appendChild(el('div', { class: 'split-2' },
        el('div', { class: 'admin-panel' },
          el('div', { class: 'admin-panel-header' }, el('div', { class: 'admin-panel-title' }, 'Orders by Hour')),
          buildColChart(HOURLY, HOUR_LABELS)
        ),
        el('div', { class: 'admin-panel' },
          el('div', { class: 'admin-panel-header' }, el('div', { class: 'admin-panel-title' }, 'Revenue by Day')),
          buildBarChart([
            { label: 'Mon', value: 1180, suffix: '' },
            { label: 'Tue', value: 1310, suffix: '' },
            { label: 'Wed', value: 1247, suffix: '' },
            { label: 'Thu', value: 1402, suffix: '' },
            { label: 'Fri', value: 1645, suffix: '' },
            { label: 'Sat', value: 1820, suffix: '' },
            { label: 'Sun', value: 1320, suffix: '' }
          ].map(d => ({ ...d, value: d.value, fmt: fmt$ })))
        )
      ));

      // Customer mix
      panel.appendChild(el('div', { class: 'admin-panel' },
        el('div', { class: 'admin-panel-header' }, el('div', { class: 'admin-panel-title' }, 'Customer Mix')),
        el('div', { class: 'split-3' },
          miniStat('New', '128', 'this week'),
          miniStat('Returning', '716', 'this week'),
          miniStat('Repeat Rate', r.repeat + '%', 'rolling 30d')
        )
      ));
    }
  };

  // ---------- Accounting ----------
  tabs.accounting = {
    title: 'Accounting',
    subtitle: 'P&L · taxes · invoices',
    render(panel) {
      clear(panel);
      panel.appendChild(buildHeader('Accounting', 'P&L · taxes · invoices', [
        { label: 'Sync to Xero', class: 'admin-btn ghost' },
        { label: 'Export PDF', class: 'admin-btn primary' }
      ]));

      // KPIs
      panel.appendChild(el('div', { class: 'kpi-grid' },
        kpi('MTD Revenue', fmt$(38540), '+14.1%', 'up'),
        kpi('MTD Net Profit', fmt$(8230), '21.4% margin', 'up'),
        kpi('Outstanding (Catering)', fmt$(1325), '2 invoices', 'flat'),
        kpi('Sales Tax Owed (Q4)', fmt$(2698), 'Due Jan 30', 'flat')
      ));

      // P&L
      const pnl = el('div', { class: 'admin-panel' },
        el('div', { class: 'admin-panel-header' },
          el('div', { class: 'admin-panel-title' }, 'P&L Summary'),
          el('div', { class: 'admin-panel-meta' }, 'Month-to-date · November 2026')
        ),
        pnlRow('Espresso Bar Revenue',     21450,  false),
        pnlRow('Waffle & Food Revenue',     9870,  false),
        pnlRow('Beans-to-go & Retail',      3120,  false),
        pnlRow('Catering & Events',         4100,  false),
        pnlRow('Revenue',                  38540,  false, 'subtotal'),
        pnlRow('Coffee Beans (Danesi)',    -2840,  true),
        pnlRow('Dairy & Pastry Ingredients',-3105,  true),
        pnlRow('Packaging & Cups',          -984,  true),
        pnlRow('Cost of Goods Sold',       -6929,  true, 'subtotal'),
        pnlRow('Gross Profit',             31611,  false, 'subtotal'),
        pnlRow('Labor (3 baristas + Tony/Marina)', -12200, true),
        pnlRow('Rent & Utilities',         -3850,  true),
        pnlRow('Square + payment fees',    -1110,  true),
        pnlRow('Marketing (Instagram ads)',  -240,  true),
        pnlRow('Operating Expenses',      -17400,  true, 'subtotal'),
        pnlRow('Net Income',               14211,  false, 'total')
      );
      panel.appendChild(pnl);

      // Outstanding invoices
      const inv = el('div', { class: 'admin-panel' },
        el('div', { class: 'admin-panel-header' },
          el('div', { class: 'admin-panel-title' }, 'Outstanding Invoices'),
          el('div', { class: 'admin-panel-meta' }, '2 unpaid · catering side')
        )
      );
      const invTable = el('table', { class: 'admin-table' });
      invTable.appendChild(el('thead', {}, el('tr', {},
        el('th', {}, 'Invoice'),
        el('th', {}, 'Client'),
        el('th', { class: 'hide-sm' }, 'Issued'),
        el('th', { class: 'hide-sm' }, 'Due'),
        el('th', { class: 'num' }, 'Amount'),
        el('th', {}, '')
      )));
      const invBody = el('tbody', {});
      [
        ['INV-2026-0118', 'Sweetwater Inc.',     'Nov 04', 'Nov 19',  900,  'sent'],
        ['INV-2026-0119', 'Indiana Tech',        'Nov 09', 'Nov 24',  425,  'sent']
      ].forEach(([id, c, issued, due, amt, st]) => {
        invBody.appendChild(el('tr', {},
          el('td', {}, el('strong', {}, id)),
          el('td', {}, c),
          el('td', { class: 'hide-sm' }, issued),
          el('td', { class: 'hide-sm' }, due),
          el('td', { class: 'num' }, fmt$(amt)),
          el('td', { style: 'text-align: right;' }, el('button', { class: 'admin-btn ghost' }, 'Send Reminder'))
        ));
      });
      invTable.appendChild(invBody);
      inv.appendChild(invTable);
      panel.appendChild(inv);
    }
  };

  // ---------- Events ----------
  tabs.events = {
    title: 'Events',
    subtitle: 'Catering, classes, private bookings',
    render(panel) {
      clear(panel);
      panel.appendChild(buildHeader('Events', 'Catering · classes · private bookings', [
        { label: '+ Add Event', class: 'admin-btn primary' }
      ]));

      panel.appendChild(el('div', { class: 'kpi-grid' },
        kpi('Upcoming Events', fmtInt(EVENTS.length), 'Next 30 days', 'flat'),
        kpi('Booked Catering', fmt$(EVENTS.reduce((s, e) => s + e.value, 0)), 'Pipeline', 'up'),
        kpi('Confirmed', fmtInt(EVENTS.filter(e => e.status === 'confirmed').length), `${EVENTS.filter(e => e.status === 'pending').length} pending`, 'up')
      ));

      const list = el('div', { class: 'admin-panel' },
        el('div', { class: 'admin-panel-header' },
          el('div', { class: 'admin-panel-title' }, 'Upcoming'),
          el('div', { class: 'admin-panel-meta' }, 'Next 30 days')
        )
      );
      EVENTS.forEach(ev => {
        const monthShort = ev.date.toLocaleString('en-US', { month: 'short' });
        const day = ev.date.getDate();
        list.appendChild(el('div', { class: 'event-card' },
          el('div', { class: 'event-date' },
            el('div', { class: 'day' }, String(day)),
            el('div', { class: 'month' }, monthShort)
          ),
          el('div', {},
            el('div', { class: 'event-name' }, ev.name),
            el('div', { class: 'event-meta' }, `${fmtTime(ev.date)} · ${ev.type} · ${ev.attendees} ppl${ev.value ? ' · ' + fmt$(ev.value) : ''}`),
            el('div', { style: 'margin-top: 0.4rem;' },
              el('span', { class: 'status ' + (ev.status === 'confirmed' ? 'ready' : 'pending') }, ev.status)
            )
          ),
          el('button', { class: 'admin-btn' }, 'Manage')
        ));
      });
      panel.appendChild(list);
    }
  };

  // ---------- Customers ----------
  tabs.customers = {
    title: 'Customers',
    subtitle: 'Regulars, loyalty, marketing list',
    render(panel) {
      clear(panel);
      panel.appendChild(buildHeader('Customers', 'Regulars · loyalty · marketing', [
        { label: 'Export Email List', class: 'admin-btn ghost' },
        { label: 'Send Newsletter', class: 'admin-btn primary' }
      ]));

      panel.appendChild(el('div', { class: 'kpi-grid' },
        kpi('Total Customers',  fmtInt(2148), '+128 this week', 'up'),
        kpi('Loyalty Members',  fmtInt(842),  '39% of base',     'up'),
        kpi('Newsletter Subs',  fmtInt(1340), 'Open rate 41%',   'flat'),
        kpi('Avg Visits / Mo',  '4.8',         'Among regulars',  'up')
      ));

      const card = el('div', { class: 'admin-panel' },
        el('div', { class: 'admin-panel-header' },
          el('div', { class: 'admin-panel-title' }, 'Top Regulars'),
          el('div', { class: 'admin-panel-meta' }, 'By visits, last 90 days')
        )
      );
      const table = el('table', { class: 'admin-table' });
      table.appendChild(el('thead', {}, el('tr', {},
        el('th', {}, 'Name'),
        el('th', { class: 'num' }, 'Visits'),
        el('th', { class: 'num' }, 'Spent'),
        el('th', { class: 'hide-sm' }, 'Usual'),
        el('th', { class: 'hide-sm' }, 'Last seen'),
        el('th', {}, '')
      )));
      const tbody = el('tbody', {});
      CUSTOMERS.forEach(c => {
        tbody.appendChild(el('tr', {},
          el('td', {}, el('strong', {}, c.name)),
          el('td', { class: 'num' }, fmtInt(c.visits)),
          el('td', { class: 'num' }, fmt$(c.spent)),
          el('td', { class: 'hide-sm' }, c.drink),
          el('td', { class: 'hide-sm' }, c.last),
          el('td', { style: 'text-align: right;' }, el('button', { class: 'admin-btn ghost' }, 'Profile'))
        ));
      });
      table.appendChild(tbody);
      card.appendChild(table);
      panel.appendChild(card);
    }
  };

  // ---------- Inventory ----------
  tabs.inventory = {
    title: 'Inventory',
    subtitle: 'Beans, dairy, pastry, supplies',
    render(panel) {
      clear(panel);
      panel.appendChild(buildHeader('Inventory', 'Beans · dairy · pastry · supplies', [
        { label: 'Place Reorder', class: 'admin-btn primary' }
      ]));

      const items = [
        { name: 'Danesi Gold (whole bean) · 5kg', stock: 8.2,  unit: 'kg', threshold: 4, vendor: 'Caffè Danesi · Rome' },
        { name: 'Danesi Doppio (espresso)',      stock: 12.4, unit: 'kg', threshold: 6, vendor: 'Caffè Danesi · Rome' },
        { name: 'Whole milk',                     stock: 1,    unit: 'gallons', threshold: 4, vendor: 'Heritage Dairy' },
        { name: '2% milk',                         stock: 6,    unit: 'gallons', threshold: 4, vendor: 'Heritage Dairy' },
        { name: 'Oat milk',                        stock: 14,   unit: 'cartons', threshold: 6, vendor: 'Oatly' },
        { name: 'Almond milk',                     stock: 8,    unit: 'cartons', threshold: 4, vendor: 'Califia' },
        { name: 'Liège waffle dough (frozen)',     stock: 3.2,  unit: 'kg', threshold: 5, vendor: 'House-made · Tues + Thu' },
        { name: 'Belgian pearl sugar',             stock: 4.5,  unit: 'kg', threshold: 2, vendor: 'Lars Belgian' },
        { name: 'Mascarpone',                      stock: 1.4,  unit: 'kg', threshold: 1, vendor: 'Murray\'s Cheese' },
        { name: 'Hot Cups (12oz)',                 stock: 410,  unit: 'units', threshold: 200, vendor: 'Imperial Dade' },
        { name: 'Cold Cups (16oz)',                stock: 280,  unit: 'units', threshold: 200, vendor: 'Imperial Dade' }
      ];
      const wrap = el('div', { class: 'admin-panel', style: 'padding: 0;' });
      const table = el('table', { class: 'admin-table' });
      table.appendChild(el('thead', {}, el('tr', {},
        el('th', {}, 'Item'),
        el('th', { class: 'num' }, 'On hand'),
        el('th', {}, 'Status'),
        el('th', { class: 'hide-sm' }, 'Vendor'),
        el('th', {}, '')
      )));
      const tbody = el('tbody', {});
      items.forEach(it => {
        const low = it.stock <= it.threshold;
        const critical = it.stock <= it.threshold * 0.5;
        tbody.appendChild(el('tr', {},
          el('td', {}, el('strong', {}, it.name)),
          el('td', { class: 'num' }, `${it.stock} ${it.unit}`),
          el('td', {}, el('span', { class: 'status ' + (critical ? 'cancelled' : low ? 'pending' : 'ready') }, critical ? 'Reorder now' : low ? 'Low' : 'OK')),
          el('td', { class: 'hide-sm', style: 'color: var(--text-dim); font-size: 0.85rem;' }, it.vendor),
          el('td', { style: 'text-align: right;' }, el('button', { class: 'admin-btn ghost' }, 'Order'))
        ));
      });
      table.appendChild(tbody);
      wrap.appendChild(table);
      panel.appendChild(wrap);
    }
  };

  // ---------- Settings ----------
  tabs.settings = {
    title: 'Settings',
    subtitle: 'Hours, store info, integrations',
    render(panel) {
      clear(panel);
      panel.appendChild(buildHeader('Settings', 'Hours · store info · integrations', [
        { label: 'Save Changes', class: 'admin-btn primary' }
      ]));

      // Store info
      panel.appendChild(el('div', { class: 'admin-panel' },
        el('div', { class: 'admin-panel-header' }, el('div', { class: 'admin-panel-title' }, 'Store Information')),
        settingRow('Store name', el('input', { class: 'admin-input', type: 'text', value: 'United Coffee' })),
        settingRow('Address', el('input', { class: 'admin-input', type: 'text', value: '6447 W Jefferson Blvd · Fort Wayne, IN 46804' })),
        settingRow('Phone', el('input', { class: 'admin-input', type: 'tel', value: '(260) 399-5148' })),
        settingRow('Email', el('input', { class: 'admin-input', type: 'email', value: 'hello@unitedcoffee.com' })),
        settingRow('Tax rate', el('input', { class: 'admin-input', type: 'text', value: '7.00%' }))
      ));

      // Hours
      const days = [['Monday','6:30 AM','6:00 PM'],['Tuesday','6:30 AM','6:00 PM'],['Wednesday','6:30 AM','6:00 PM'],['Thursday','6:30 AM','6:00 PM'],['Friday','6:30 AM','6:00 PM'],['Saturday','7:00 AM','5:00 PM'],['Sunday','8:00 AM','3:00 PM']];
      panel.appendChild(el('div', { class: 'admin-panel' },
        el('div', { class: 'admin-panel-header' }, el('div', { class: 'admin-panel-title' }, 'Hours')),
        ...days.map(([d, o, c]) => settingRow(d, el('div', { style: 'display: flex; gap: 0.5rem;' },
          el('input', { class: 'admin-input', style: 'width: 110px;', value: o }),
          el('span', { style: 'align-self: center; color: var(--text-dim);' }, '—'),
          el('input', { class: 'admin-input', style: 'width: 110px;', value: c })
        )))
      ));

      // Pickup methods
      panel.appendChild(el('div', { class: 'admin-panel' },
        el('div', { class: 'admin-panel-header' }, el('div', { class: 'admin-panel-title' }, 'Online Ordering')),
        settingRow('In-person pickup', toggleEl(true)),
        settingRow('Curbside', toggleEl(true)),
        settingRow('Delivery (DoorDash)', toggleEl(false)),
        settingRow('Pickup lead time', el('input', { class: 'admin-input', value: '15 minutes' }))
      ));

      // Integrations
      panel.appendChild(el('div', { class: 'admin-panel' },
        el('div', { class: 'admin-panel-header' }, el('div', { class: 'admin-panel-title' }, 'Integrations')),
        settingRow('Square POS', el('span', { class: 'status ready' }, 'Connected')),
        settingRow('Xero (accounting)', el('span', { class: 'status ready' }, 'Connected')),
        settingRow('Mailchimp (newsletter)', el('span', { class: 'status pending' }, 'Setup required')),
        settingRow('Google Business', el('span', { class: 'status ready' }, 'Connected')),
        settingRow('Instagram + FB ads', el('span', { class: 'status ready' }, 'Connected'))
      ));
    }
  };

  // ==========================================================================
  // SHARED RENDER HELPERS
  // ==========================================================================
  function buildHeader(title, subtitle, actions = []) {
    return el('div', { class: 'admin-header' },
      el('div', {},
        el('h1', { class: 'admin-title' }, title),
        el('div', { class: 'admin-subtitle' }, subtitle)
      ),
      el('div', { class: 'admin-header-actions' },
        ...actions.map(a => el('button', { class: a.class }, a.label))
      )
    );
  }

  function kpi(label, value, delta, dir = 'flat') {
    return el('div', { class: 'kpi-card' },
      el('div', { class: 'kpi-label' }, label),
      el('div', { class: 'kpi-value' }, value),
      el('div', { class: 'kpi-delta ' + dir }, (dir === 'up' ? '↑ ' : dir === 'down' ? '↓ ' : '· ') + delta)
    );
  }

  function miniStat(label, value, sub) {
    return el('div', {},
      el('div', { class: 'kpi-label' }, label),
      el('div', { class: 'kpi-value', style: 'font-size: 1.8rem;' }, value),
      el('div', { class: 'kpi-delta flat' }, '· ' + sub)
    );
  }

  function buildBarChart(items) {
    const max = Math.max(...items.map(i => i.value));
    const root = el('div', { class: 'bar-chart' });
    items.forEach(item => {
      const pct = max > 0 ? (item.value / max) * 100 : 0;
      const fmt = item.fmt || ((v) => fmtInt(v) + (item.suffix || ''));
      root.appendChild(el('div', { class: 'bar-row' },
        el('div', { class: 'bar-label' }, item.label),
        el('div', { class: 'bar-track' }, el('div', { class: 'bar-fill', style: `width: ${pct}%;` })),
        el('div', { class: 'bar-value' }, fmt(item.value))
      ));
    });
    return root;
  }

  function buildColChart(values, labels) {
    const max = Math.max(...values);
    const root = el('div', { class: 'col-chart' });
    values.forEach((v, i) => {
      const pct = max > 0 ? (v / max) * 100 : 2;
      root.appendChild(el('div', { class: 'col-bar', style: `height: ${pct}%;`, 'data-hour': labels[i] }));
    });
    return root;
  }

  function buildLiveOrder(o) {
    const placedAgo = Math.round((Date.now() - new Date(o.placedAt).getTime()) / 60000);
    return el('div', {
      style: 'display: grid; grid-template-columns: 1fr auto auto; gap: 1rem; align-items: center; padding: 0.85rem 0; border-bottom: 1px dashed var(--border);'
    },
      el('div', {},
        el('div', { style: 'display: flex; gap: 0.5rem; align-items: baseline;' },
          el('strong', {}, o.id),
          el('span', { style: 'color: var(--text-dim); font-size: 0.9rem;' }, '· ' + o.customer)
        ),
        el('div', { style: 'font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.04em; color: var(--text-dim); margin-top: 0.2rem;' },
          o.items.map(i => `${i.qty}× ${i.name}`).join(' · ')
        )
      ),
      el('span', { class: 'status ' + o.status }, o.status),
      el('span', { style: 'font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-dim); white-space: nowrap;' }, placedAgo + 'm ago')
    );
  }

  function buildOrderRow(o) {
    let isOpen = false;
    const placedAgo = Math.round((Date.now() - new Date(o.placedAt).getTime()) / 60000);
    const totalRow = el('tr', { class: 'order-row' },
      el('td', {}, el('strong', {}, o.id)),
      el('td', {}, o.customer),
      el('td', { class: 'hide-sm', style: 'color: var(--text-dim); font-size: 0.85rem;' }, o.items.map(i => `${i.qty}× ${i.name}`).join(', ')),
      el('td', { class: 'hide-sm' }, o.method),
      el('td', { style: 'font-family: var(--font-mono); font-size: 0.85rem;' }, fmtTime(new Date(o.placedAt)) + (placedAgo < 60 ? ` · ${placedAgo}m` : '')),
      el('td', {}, el('span', { class: 'status ' + o.status }, o.status)),
      el('td', { class: 'num' }, fmt$(o.subtotal * 1.07))
    );
    const detailRow = el('tr', { style: 'display: none;' },
      el('td', { colspan: '7', class: 'order-detail' },
        el('div', { class: 'order-items' },
          ...o.items.flatMap(i => [
            el('div', {},
              el('strong', {}, `${i.qty}× ${i.name}`),
              el('span', { style: 'color: var(--text-dim); margin-left: 0.7rem;' }, fmt$(i.basePrice + (i.modifiers || []).reduce((m, x) => m + x.price, 0)))
            ),
            (i.modifiers && i.modifiers.length) ? el('div', { class: 'order-item-mods' }, i.modifiers.map(m => m.label + (m.price > 0 ? ` +${fmt$(m.price)}` : '')).join(' · ')) : null
          ])
        ),
        el('div', { class: 'order-actions' },
          o.status === 'pending' ? el('button', { class: 'admin-btn primary' }, 'Mark preparing') : null,
          o.status === 'preparing' ? el('button', { class: 'admin-btn primary' }, 'Mark ready') : null,
          o.status === 'ready' ? el('button', { class: 'admin-btn primary' }, 'Mark completed') : null,
          o.status !== 'completed' ? el('button', { class: 'admin-btn danger' }, 'Cancel') : null,
          el('button', { class: 'admin-btn' }, 'Print receipt'),
          el('button', { class: 'admin-btn ghost' }, 'Refund')
        )
      )
    );
    totalRow.addEventListener('click', () => {
      isOpen = !isOpen;
      detailRow.style.display = isOpen ? '' : 'none';
      totalRow.classList.toggle('is-open', isOpen);
    });
    const fragment = document.createDocumentFragment();
    fragment.appendChild(totalRow);
    fragment.appendChild(detailRow);
    return fragment;
  }

  function alertRow(label, sub, ok = false) {
    return el('div', { style: 'display: grid; grid-template-columns: auto 1fr auto; gap: 0.85rem; padding: 0.7rem 0; border-bottom: 1px dashed var(--border); align-items: center;' },
      el('span', { style: `width: 8px; height: 8px; border-radius: 999px; background: ${ok ? 'var(--olive)' : 'var(--rosso)'};` }),
      el('div', {},
        el('div', { style: 'font-weight: 500;' }, label),
        el('div', { style: 'font-family: var(--font-mono); font-size: 0.65rem; letter-spacing: 0.14em; color: var(--text-dim); text-transform: uppercase; margin-top: 0.15rem;' }, sub)
      ),
      el('button', { class: 'admin-btn ghost' }, ok ? 'View' : 'Resolve')
    );
  }

  function pnlRow(label, amount, isExpense, modifier = '') {
    return el('div', { class: 'pnl-row' + (modifier ? ' ' + modifier : '') },
      el('span', {}, label),
      el('span', { class: 'num' + (isExpense ? ' negative' : '') }, (isExpense && amount > 0 ? '-' : '') + fmt$(Math.abs(amount)))
    );
  }

  function settingRow(label, value) {
    return el('div', { class: 'setting-row' },
      el('div', { class: 'setting-label' }, label),
      el('div', { class: 'setting-value' }, value)
    );
  }

  function toggleEl(checked) {
    const input = el('input', { type: 'checkbox' });
    if (checked) input.checked = true;
    return el('label', { class: 'toggle' }, input, el('span', { class: 'toggle-slider' }));
  }

  // ==========================================================================
  // TAB SWITCHING
  // ==========================================================================
  const switchTab = (name) => {
    document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.toggle('is-active', b.dataset.tab === name));
    document.querySelectorAll('.admin-tab').forEach(p => p.classList.toggle('is-active', p.dataset.panel === name));
    const panel = document.querySelector(`[data-panel="${name}"]`);
    if (panel && tabs[name]) tabs[name].render(panel);
    if (history.replaceState) history.replaceState({}, '', '#' + name);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  document.getElementById('adminNav').addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-nav-btn');
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });

  // Sub-handler: links inside tabs that say "data-jump=..."
  document.querySelector('.admin-content').addEventListener('click', (e) => {
    const jump = e.target.closest('[data-jump]');
    if (!jump) return;
    e.preventDefault();
    switchTab(jump.dataset.jump);
  });

  // Live orders badge
  const updateBadge = () => {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const open = orders.filter(o => new Date(o.placedAt) >= todayStart && o.status !== 'completed').length;
    const badge = document.getElementById('ordersBadge');
    if (badge) badge.textContent = String(open);
  };
  updateBadge();

  // Initial render: respect URL hash
  const initial = (location.hash || '#dashboard').slice(1);
  switchTab(tabs[initial] ? initial : 'dashboard');
})();
