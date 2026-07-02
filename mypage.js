'use strict';

function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('easefit_user') || 'null');
  } catch {
    return null;
  }
}

const user = getStoredUser();

const memberName = document.getElementById('memberName');
const memberLoginId = document.getElementById('memberLoginId');
const mypageContent = document.querySelector('.mypage-content');
const mypageNavLinks = document.querySelectorAll('.mypage-nav-link[data-mypage-view]');
const mypagePanels = document.querySelectorAll('.mypage-view[data-mypage-panel]');
const mypageTitle = document.querySelector('[data-mypage-title]');
const memberPanel = document.querySelector('[data-member-panel]');
const reviewModal = document.getElementById('reviewModal');
const reviewOpenButtons = document.querySelectorAll('[data-review-open]');
const reviewCloseButtons = document.querySelectorAll('[data-review-close]');
const reviewStarButtons = document.querySelectorAll('.review-stars button');
const reviewRatingText = document.querySelector('.review-rating-text');
const reviewKeywordButtons = document.querySelectorAll('.review-keyword-row button');
const reviewPhotoInputs = document.querySelectorAll('.review-photo-list input');
const reviewTextarea = document.querySelector('.review-text-field textarea');
const reviewTextCount = document.getElementById('reviewTextCount');

if (!user) {
  window.location.href = './login.html';
} else {
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

function showMypageView(viewName) {
  const isReviewView = viewName === 'reviews';

  mypageNavLinks.forEach((link) => {
    link.classList.toggle('is-active', link.dataset.mypageView === viewName);
  });

  mypagePanels.forEach((panel) => {
    const isActive = panel.dataset.mypagePanel === viewName;
    panel.hidden = !isActive;
    panel.classList.toggle('is-active', isActive);
  });

  mypageContent?.classList.toggle('is-review-mode', isReviewView);

  if (memberPanel) {
    memberPanel.hidden = isReviewView;
  }

  if (mypageTitle) {
    mypageTitle.hidden = isReviewView;
  }
}

mypageNavLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showMypageView(link.dataset.mypageView);
  });
});

const ratingCopy = {
  1: '아쉬워요',
  2: '조금 아쉬워요',
  3: '보통이에요',
  4: '만족해요',
  5: '아주 만족해요',
};

function setReviewRating(rating) {
  reviewStarButtons.forEach((button) => {
    button.classList.toggle('is-selected', Number(button.dataset.rating) <= rating);
  });
  if (reviewRatingText) reviewRatingText.textContent = ratingCopy[rating] || '아주 만족해요';
}

function openReviewModal() {
  if (!reviewModal) return;
  reviewStarButtons.forEach(btn => btn.classList.remove('is-selected'));
  if (reviewRatingText) reviewRatingText.textContent = '';
  reviewKeywordButtons.forEach(btn => btn.classList.remove('is-selected'));
  if (reviewTextarea) reviewTextarea.value = '';
  if (reviewTextCount) reviewTextCount.textContent = '0';
  reviewModal.classList.add('is-open');
  reviewModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
  if (!reviewModal) return;
  reviewModal.classList.remove('is-open');
  reviewModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

reviewOpenButtons.forEach((button) => {
  button.addEventListener('click', openReviewModal);
});

reviewCloseButtons.forEach((button) => {
  button.addEventListener('click', closeReviewModal);
});

reviewStarButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setReviewRating(Number(button.dataset.rating));
  });
});

reviewKeywordButtons.forEach((button) => {
  button.addEventListener('click', () => {
    button.classList.toggle('is-selected');
  });
});

reviewPhotoInputs.forEach((input) => {
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    const label = input.closest('label');
    const image = label?.querySelector('img');

    if (!file || !label || !image) return;

    image.src = URL.createObjectURL(file);
    label.classList.add('has-image');
  });
});

reviewTextarea?.addEventListener('input', () => {
  if (reviewTextCount) reviewTextCount.textContent = String(reviewTextarea.value.length);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeReviewModal();
});

setReviewRating(5);

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
