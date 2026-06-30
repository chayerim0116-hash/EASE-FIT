'use strict';

function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('easefit_user') || 'null');
  } catch {
    return null;
  }
}

const user = getStoredUser();

if (!user || !user.name) {
  window.location.replace('./login.html');
} else {
  const memberName = document.getElementById('memberName');
  const memberLoginId = document.getElementById('memberLoginId');
  if (memberName) memberName.textContent = user.name;
  if (memberLoginId) memberLoginId.textContent = user.loginId || 'EASE FIT MEMBER';
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('easefit_user');
    window.location.href = './login.html';
  });
}

// 주문 상태 → HTML의 <strong> 순서와 매핑
const STATUS_ORDER = ['paid', 'preparing', 'ready', 'shipping', 'delivered'];

async function loadOrderStatusCounts(userId) {
  const { data, error } = await supabase.rpc('fn_get_order_status_counts', {
    p_user_id: userId,
  });
  if (error || !data) return;

  const countMap = {};
  data.forEach(({ status, cnt }) => { countMap[status] = Number(cnt); });

  const items = document.querySelectorAll('.order-status li strong');
  STATUS_ORDER.forEach((status, i) => {
    if (items[i]) items[i].textContent = countMap[status] ?? 0;
  });
}

async function loadMypageSummary(userId, sessionId) {
  const { data, error } = await supabase.rpc('fn_get_mypage_summary', {
    p_user_id:    userId,
    p_session_id: sessionId,
  });
  if (error || !data) return;

  const benefitValues = document.querySelectorAll('.member-benefits dd');
  if (benefitValues[0]) benefitValues[0].textContent = `${data.points.toLocaleString()}P`;
  if (benefitValues[1]) benefitValues[1].textContent = `${data.coupons}장`;
  if (benefitValues[2]) benefitValues[2].textContent = `${data.reviews}건`;

  const wishlistCountEl = document.getElementById('wishlistCount');
  if (wishlistCountEl) {
    wishlistCountEl.textContent = data.wishlist;
    wishlistCountEl.hidden = data.wishlist === 0;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof loadCartFromDB === 'function') {
    await loadCartFromDB();
    if (typeof updateCartCount === 'function') updateCartCount();
  }

  if (typeof loadWishlistFromDB === 'function') {
    await loadWishlistFromDB();
    if (typeof updateWishlistCount === 'function') updateWishlistCount();
  }

  if (!user?.id) return;

  const sessionId = localStorage.getItem('easefit_session_id') || '';

  await Promise.all([
    loadOrderStatusCounts(user.id),
    loadMypageSummary(user.id, sessionId),
  ]);
});
