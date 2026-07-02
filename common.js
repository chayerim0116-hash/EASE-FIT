/* ════════════════════════════════════════════
   common.js — 모든 페이지 공통 기능
   index.html, product-detail.html, cart.html, wishlist.html 에서 로드
   ════════════════════════════════════════════ */

const RECENT_KEY      = 'recentViewedProducts';
const MAX_RECENT_COUNT = 5;

/* ════════════════════════════════════════════
   헤더 마이페이지 메뉴 — 로그인 / 로그아웃 상태
   ════════════════════════════════════════════ */

function getLoggedInUser() {
  try {
    return JSON.parse(sessionStorage.getItem('easefit_user') || 'null');
  } catch (error) {
    return null;
  }
}

function logoutEasefitUser() {
  sessionStorage.removeItem('easefit_user');
  window.location.href = './login.html';
}

function initHeaderAuthMenu() {
  const authLinks = document.querySelectorAll('.mypage-auth-link');
  const mypageLinks = document.querySelectorAll('.mypage-page-link');
  const user = getLoggedInUser();

  authLinks.forEach(link => {
    if (user) {
      link.textContent = '로그아웃';
      link.href = '#';
      link.addEventListener('click', event => {
        event.preventDefault();
        logoutEasefitUser();
      });
      return;
    }

    link.textContent = '로그인';
    link.href = './login.html';
  });

  mypageLinks.forEach(link => {
    link.href = user ? './mypage.html' : './login.html';
  });

  document.querySelectorAll('.mypage-menu-wrap .icon-link').forEach(link => {
    link.href = user ? './mypage.html' : './login.html';
  });
}

/* ════════════════════════════════════════════
   장바구니 — Supabase cart_items 테이블
   ════════════════════════════════════════════ */

let _cartCache = [];   // 메모리 캐시 (DB 로드 후 채워짐)

/* DB에서 장바구니 데이터를 불러와 캐시에 저장 */
async function loadCartFromDB() {
  const { data, error } = await db
    .from('cart_items')
    .select('*')
    .eq('session_id', getSessionId())
    .order('created_at', { ascending: true });

  if (error) { console.error('장바구니 로드 오류:', error); return; }

  _cartCache = (data || []).map(row => ({
    id:       row.product_id,
    brand:    row.brand,
    title:    row.product_name,
    price:    row.price,
    image:    row.image,
    color:    row.color,
    size:     row.size,
    quantity: row.quantity,
    url:      row.url
  }));
}

/* 캐시에서 동기 반환 (loadCartFromDB 호출 후 사용) */
function getCartItems() {
  return _cartCache;
}

/* 캐시 갱신 + DB 동기화 (fire-and-forget) */
function saveCartItems(items) {
  _cartCache = items;
  _syncCartToDB(items).catch(err => console.error('장바구니 저장 오류:', err));
}

async function _syncCartToDB(items) {
  const sessionId = getSessionId();
  // 기존 데이터 전체 삭제 후 재삽입
  const { error: delErr } = await db
    .from('cart_items')
    .delete()
    .eq('session_id', sessionId);
  if (delErr) throw delErr;

  if (!items.length) return;

  const { error: insErr } = await db
    .from('cart_items')
    .insert(items.map(item => ({
      session_id:   sessionId,
      product_id:   item.id,
      product_name: item.title,
      brand:        item.brand   || 'EASE FIT',
      color:        item.color   || '',
      size:         item.size    || '',
      quantity:     item.quantity || 1,
      price:        item.price   || 0,
      image:        item.image   || '',
      url:          item.url     || ''
    })));
  if (insErr) throw insErr;
}

/* 헤더 장바구니 수량 업데이트 */
function updateCartCount() {
  const total = _cartCache.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  const el = document.getElementById('cartCount');
  if (el) el.textContent = total;
}

/* ════════════════════════════════════════════
   위시리스트 — Supabase wishlist_items 테이블
   ════════════════════════════════════════════ */

let _wishlistCache = [];

async function loadWishlistFromDB() {
  const { data, error } = await db
    .from('wishlist_items')
    .select('*')
    .eq('session_id', getSessionId())
    .order('created_at', { ascending: true });

  if (error) { console.error('위시리스트 로드 오류:', error); return; }

  _wishlistCache = (data || []).map(row => ({
    id:            row.product_id,
    category:      row.category,
    name:          row.product_name,
    price:         row.price,
    originalPrice: row.original_price,
    discount:      row.discount,
    image:         row.image,
    colors:        row.colors || [],
    sizes:         row.sizes
  }));
}

function getWishlistItems() {
  return _wishlistCache;
}

function saveWishlistItems(items) {
  _wishlistCache = items;
  _syncWishlistToDB(items).catch(err => console.error('위시리스트 저장 오류:', err));
}

async function _syncWishlistToDB(items) {
  const sessionId = getSessionId();
  const { error: delErr } = await db
    .from('wishlist_items')
    .delete()
    .eq('session_id', sessionId);
  if (delErr) throw delErr;

  if (!items.length) return;

  const { error: insErr } = await db
    .from('wishlist_items')
    .insert(items.map(item => ({
      session_id:     sessionId,
      product_id:     item.id,
      product_name:   item.name,
      category:       item.category      || 'EASE FIT',
      price:          item.price         || '',
      original_price: item.originalPrice || '',
      discount:       item.discount      || '',
      image:          item.image         || '',
      colors:         item.colors        || [],
      sizes:          item.sizes         || 'XS-3XL'
    })));
  if (insErr) throw insErr;
}

function normalizeWishlistItem(item) {
  return {
    id:            item.id            || '',
    category:      item.category      || item.brand || 'EASE FIT',
    name:          item.name          || item.title || '',
    price:         item.price         || '',
    originalPrice: item.originalPrice || '',
    discount:      item.discount      || '',
    image:         item.image         || './img/Favicon.png',
    colors:        Array.isArray(item.colors) ? item.colors : [],
    sizes:         item.sizes         || 'XS-3XL'
  };
}

function isWishlisted(productId) {
  return _wishlistCache.some(item => item.id === productId);
}

function toggleWishlistItem(item) {
  if (!item || !item.id) return false;
  const exists = _wishlistCache.some(p => p.id === item.id);

  if (exists) {
    saveWishlistItems(_wishlistCache.filter(p => p.id !== item.id));
    updateWishlistCount();
    return false;
  }

  _wishlistCache.push(normalizeWishlistItem(item));
  saveWishlistItems([..._wishlistCache]);
  updateWishlistCount();
  return true;
}

function removeWishlistItem(productId) {
  saveWishlistItems(_wishlistCache.filter(item => item.id !== productId));
  updateWishlistCount();
}

function updateWishlistCount() {
  const countEl = document.getElementById('wishlistCount');
  if (!countEl) return;
  const count = _wishlistCache.length;
  countEl.textContent = count;
  countEl.hidden = count === 0;
}

/* ════════════════════════════════════════════
   최근 본 상품 — localStorage (기기 내 유지)
   ════════════════════════════════════════════ */

function getRecentProducts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveRecentProduct(product) {
  if (!product || !product.id) return;
  const list    = getRecentProducts();
  const deduped = list.filter(item => item.id !== product.id);
  const updated = [product].concat(deduped).slice(0, MAX_RECENT_COUNT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

function renderRecentProducts() {
  const listEl = document.getElementById('recentList');
  if (!listEl) return;

  const products = getRecentProducts();

  if (!products.length) {
    listEl.innerHTML = '<p class="recent-empty-msg">최근 본 상품이 없습니다.</p>';
    const clearBtn = document.getElementById('recentClearBtn');
    if (clearBtn) clearBtn.style.visibility = 'hidden';
    return;
  }

  const clearBtn = document.getElementById('recentClearBtn');
  if (clearBtn) clearBtn.style.visibility = 'visible';

  listEl.innerHTML = products.map(p => [
    '<a href="' + p.url + '" class="recent-item">',
    '  <div class="recent-item-image">',
    '    <img src="' + p.image + '" alt="' + p.title + '" loading="lazy" />',
    '  </div>',
    '  <div class="recent-item-info">',
    '    <p class="recent-item-brand">' + (p.brand || '') + '</p>',
    '    <p class="recent-item-title">' + p.title + '</p>',
    '    <p class="recent-item-price">' + p.price + '</p>',
    '  </div>',
    '</a>'
  ].join('\n')).join('\n');
}

/* ════════════════════════════════════════════
   최근 본 상품 패널 열기 / 닫기
   ════════════════════════════════════════════ */

function openRecentPanel() {
  const panel = document.getElementById('recentPanel');
  if (!panel) return;
  renderRecentProducts();
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
}

function closeRecentPanel() {
  const panel = document.getElementById('recentPanel');
  if (!panel) return;
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
}

function toggleRecentPanel() {
  const panel = document.getElementById('recentPanel');
  if (!panel) return;
  if (panel.classList.contains('is-open')) closeRecentPanel();
  else openRecentPanel();
}

/* ════════════════════════════════════════════
   퀵메뉴 초기화
   ════════════════════════════════════════════ */

function initQuickMenu() {
  const recentToggleBtn = document.getElementById('recentToggleBtn');
  const recentCloseBtn  = document.getElementById('recentCloseBtn');
  const recentClearBtn  = document.getElementById('recentClearBtn');
  const recentPanel     = document.getElementById('recentPanel');
  const topButton       = document.getElementById('topButton');

  if (recentToggleBtn) {
    recentToggleBtn.addEventListener('click', e => { e.stopPropagation(); toggleRecentPanel(); });
  }
  if (recentCloseBtn) {
    recentCloseBtn.addEventListener('click', () => closeRecentPanel());
  }
  if (recentClearBtn) {
    recentClearBtn.addEventListener('click', () => {
      localStorage.removeItem(RECENT_KEY);
      renderRecentProducts();
    });
  }
  if (recentPanel) {
    recentPanel.addEventListener('click', e => e.stopPropagation());
  }

  document.addEventListener('click', () => closeRecentPanel());
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeRecentPanel(); });

  if (topButton) {
    topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    function updateTopVisibility() {
      topButton.classList.toggle('is-visible', window.scrollY > 40);
    }
    window.addEventListener('scroll', updateTopVisibility, { passive: true });
    updateTopVisibility();
  }
}

/* ════════════════════════════════════════════
   DOMContentLoaded — DB에서 데이터 불러온 뒤 UI 초기화
   ════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  initHeaderAuthMenu();
  initQuickMenu();
  try {
    await Promise.all([loadCartFromDB(), loadWishlistFromDB()]);
    updateCartCount();
    updateWishlistCount();
  } catch (e) {
    console.warn('DB load failed:', e);
  }
});
