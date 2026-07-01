'use strict';

/* ════════════════════════════════════════════
   account.js — 로그인 / 회원가입 / 아이디찾기 / 비밀번호재설정
   RLS 적용 이후: users 테이블 직접 접근 금지
   모든 users 조회·수정은 db.rpc('fn_...') 로만 처리
   ════════════════════════════════════════════ */

const SAVED_ID_KEY   = 'easefit_saved_id';
const FUNCTIONS_URL  = 'https://sloxjwxqwwukgsqrkqgq.supabase.co/functions/v1';

/* ── 헤더 마이페이지 메뉴 로그인 상태 처리 ───────────────────── */

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
    link.href = './mypage.html';
  });

  document.querySelectorAll('.mypage-menu-wrap .icon-link').forEach(link => {
    link.href = user ? './mypage.html' : './login.html';
  });
}

document.addEventListener('DOMContentLoaded', initHeaderAuthMenu);

/* ── 인증번호 헬퍼 (MOCK 모드) ─────────────────────────────────────
   TODO: 실제 서비스 전환 시 아래 mock 함수 2개를 삭제하고
         주석 처리된 Edge Function 호출 코드로 교체하세요.
   ──────────────────────────────────────────────────────────────── */

// TODO: 실제 SMS 발송으로 교체
// async function sendVerificationCode(phone, purpose) {
//   const res  = await fetch(`${FUNCTIONS_URL}/send-verification-code`, {
//     method:  'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body:    JSON.stringify({ phone, purpose }),
//   });
//   const data = await res.json();
//   if (!res.ok) throw new Error(data.error || 'SMS 발송 실패');
//   return true;
// }
//
// TODO: 실제 코드 검증으로 교체
// async function verifySmsCode(phone, code, purpose) {
//   const res  = await fetch(`${FUNCTIONS_URL}/verify-sms-code`, {
//     method:  'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body:    JSON.stringify({ phone, code, purpose }),
//   });
//   const data = await res.json();
//   if (!res.ok) throw new Error(data.error || '인증 실패');
//   return { valid: data.valid === true, error: data.error || '' };
// }

const MOCK_CODE = '123456'; // TODO: 실제 API 연결 시 이 상수 삭제

function sendVerificationCode(_phone, _purpose) {
  return Promise.resolve(true);
}

function verifySmsCode(_phone, code, _purpose) {
  return Promise.resolve({
    valid: code === MOCK_CODE,
    error: code !== MOCK_CODE ? '인증번호가 일치하지 않습니다.' : '',
  });
}

async function getOAuthUrl(provider) {
  const redirectUri = `${window.location.origin}/oauth-callback.html?provider=${provider}`;
  const res  = await fetch(
    `${FUNCTIONS_URL}/${provider}-auth?action=url&redirectUri=${encodeURIComponent(redirectUri)}`
  );
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error || 'OAuth URL 획득 실패');
  return data.url;
}

/* ── 유효성 검사 헬퍼 ─────────────────────── */

function setMessage(el, text, type) {
  if (!el) return;
  el.textContent = text || '';
  el.classList.remove('is-error', 'is-success');
  if (type) el.classList.add(type === 'error' ? 'is-error' : 'is-success');
}

function isStrongPassword(value) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s])\S{8,16}$/.test(value);
}
function isValidLoginId(value)  { return /^[a-z0-9]{4,12}$/.test(value); }
function isValidName(value)     { return /^[가-힣A-Za-z\s]{2,}$/.test(value.trim()); }
function isValidPhone(value)    { return /^010\d{8}$/.test(value); }
function isValidEmail(value)    { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function sanitizeLoginValue(v)  { return v.toLowerCase().replace(/[^a-z0-9@._-]/g, ''); }
function onlyDigits(value)      { return value.replace(/\D/g, ''); }

function buildJoinEmail() {
  const id     = document.getElementById('join-email-id')?.value.trim()     || '';
  const domain = document.getElementById('join-email-domain')?.value.trim() || '';
  return id && domain ? `${id}@${domain}` : '';
}

/* ── 탭 전환 (login.html) ─────────────────── */

const tabMember   = document.getElementById('tab-member');
const tabGuest    = document.getElementById('tab-guest');
const panelMember = document.getElementById('panel-member');
const panelGuest  = document.getElementById('panel-guest');

if (tabMember && tabGuest && panelMember && panelGuest) {
  tabMember.addEventListener('click', () => {
    tabMember.classList.add('is-active'); tabGuest.classList.remove('is-active');
    tabMember.setAttribute('aria-selected', 'true');
    tabGuest.setAttribute('aria-selected', 'false');
    panelMember.hidden = false; panelGuest.hidden = true;
  });
  tabGuest.addEventListener('click', () => {
    tabGuest.classList.add('is-active'); tabMember.classList.remove('is-active');
    tabGuest.setAttribute('aria-selected', 'true');
    tabMember.setAttribute('aria-selected', 'false');
    panelGuest.hidden = false; panelMember.hidden = true;
  });
}

/* ── 아이디 저장 ─────────────────────────── */

const saveIdCheckbox = document.getElementById('save-id');
const loginIdInput   = document.getElementById('login-id');

if (saveIdCheckbox && loginIdInput) {
  const savedId = localStorage.getItem(SAVED_ID_KEY);
  if (savedId) { loginIdInput.value = savedId; saveIdCheckbox.checked = true; }
  saveIdCheckbox.addEventListener('change', () => {
    if (saveIdCheckbox.checked) localStorage.setItem(SAVED_ID_KEY, loginIdInput.value);
    else localStorage.removeItem(SAVED_ID_KEY);
  });
}
if (loginIdInput) {
  loginIdInput.addEventListener('input', () => {
    loginIdInput.value = sanitizeLoginValue(loginIdInput.value);
  });
}

/* ── 비밀번호 보기/숨기기 ────────────────── */

document.querySelectorAll('.pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.setAttribute('aria-pressed', String(input.type === 'text'));
  });
});

/* ════════════════════════════════════════════
   로그인 — db.rpc('fn_login')
   users 테이블 직접 SELECT 불가 (RLS)
   ════════════════════════════════════════════ */

const loginForm = document.querySelector('[data-auth-form="login"]');
if (loginForm) {
  const loginMessage = document.getElementById('login-message');
  const loginPwInput = document.getElementById('login-pw');

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const id = loginIdInput ? loginIdInput.value.trim() : '';
    const pw = loginPwInput ? loginPwInput.value : '';

    if (!id || !pw) {
      setMessage(loginMessage, '아이디와 비밀번호를 입력해 주세요.', 'error'); return;
    }

    setMessage(loginMessage, '로그인 중...', '');

    // 비밀번호 SHA-256 해시 (실서비스: Edge Function에서 bcrypt/Argon2 권장)
    const hashedPw = await hashPassword(pw);

    // RPC 호출 — RLS 우회(SECURITY DEFINER), 테이블 직접 접근 아님
    const { data: rows, error } = await db.rpc('fn_login', {
      p_id:       id,
      p_password: hashedPw
    });

    if (error) {
      setMessage(loginMessage, '로그인 중 오류가 발생했습니다.', 'error'); return;
    }

    const user = rows && rows.length > 0 ? rows[0] : null;
    if (!user) {
      setMessage(loginMessage, '아이디 또는 비밀번호가 올바르지 않습니다.', 'error'); return;
    }

    if (saveIdCheckbox?.checked) localStorage.setItem(SAVED_ID_KEY, id);

    sessionStorage.setItem('easefit_user', JSON.stringify({
      id:      user.user_id,
      loginId: user.login_id,
      name:    user.name
    }));

    setMessage(loginMessage, `${user.name}님, 환영합니다!`, 'success');
    setTimeout(() => { window.location.href = './index.html'; }, 900);
  });
}

/* 비회원 주문조회 */
const guestForm = document.querySelector('[data-auth-form="guest-order"]');
if (guestForm) {
  const guestMessage = document.getElementById('guest-message');
  guestForm.addEventListener('submit', e => {
    e.preventDefault();
    const name  = document.getElementById('guest-name')?.value.trim();
    const phone = onlyDigits(document.getElementById('guest-phone')?.value || '');
    const order = document.getElementById('guest-order')?.value.trim();
    if (!name || phone.length < 10 || !order) {
      setMessage(guestMessage, '이름, 휴대폰 번호, 주문번호를 모두 확인해 주세요.', 'error'); return;
    }
    setMessage(guestMessage, '비회원 주문조회는 준비 중입니다.', 'success');
  });
}

/* SNS 로그인 — Edge Function에서 OAuth URL 획득 후 리디렉트 */
['kakao-btn', 'naver-btn'].forEach(id => {
  const btn      = document.getElementById(id);
  const provider = id === 'kakao-btn' ? 'kakao' : 'naver';
  if (!btn) return;
  btn.addEventListener('click', async () => {
    btn.disabled    = true;
    btn.textContent = '연결 중...';
    try {
      const url = await getOAuthUrl(provider);
      window.location.href = url;
    } catch (err) {
      console.error('OAuth URL 오류:', err);
      btn.disabled    = false;
      btn.textContent = provider === 'kakao' ? '카카오로 시작하기' : '네이버로 시작하기';
      alert('로그인 서비스 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
  });
});

/* ════════════════════════════════════════════
   회원가입 — users INSERT (RLS 정책: anon INSERT 허용)
   중복확인은 db.rpc('fn_check_...') 로 처리
   ════════════════════════════════════════════ */

/* 전체 동의 */
const agreeAll = document.getElementById('agree-all');
if (agreeAll) {
  const others = () => document.querySelectorAll('.terms-checkbox:not(#agree-all)');
  agreeAll.addEventListener('change', () => others().forEach(cb => { cb.checked = agreeAll.checked; }));
  others().forEach(cb => {
    cb.addEventListener('change', () => { agreeAll.checked = [...others()].every(c => c.checked); });
  });
}

let isJoinIdChecked     = false, checkedJoinId     = '';
let isJoinEmailChecked  = false, checkedJoinEmail  = '';
let isJoinPhoneVerified = false, verifiedJoinPhone = '';
let joinPhoneCodeIssued = false;
let joinEmailCodeIssued = false;

const joinIdInput      = document.getElementById('join-id');
const checkIdBtn       = document.getElementById('check-id-btn');
const joinIdMessage    = document.getElementById('join-id-message');
const joinPhoneInput   = document.getElementById('join-phone');
const joinPhoneMessage = document.getElementById('join-phone-message');
const joinEmailSelect  = document.getElementById('join-email-select');
const joinEmailDomain  = document.getElementById('join-email-domain');
const joinEmailMessage = document.getElementById('join-email-message');

/* ── 아이디 중복확인 → db.rpc('fn_check_login_id') ── */
if (joinIdInput) {
  joinIdInput.addEventListener('input', () => {
    joinIdInput.value = joinIdInput.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
    isJoinIdChecked = false; checkedJoinId = '';
    setMessage(joinIdMessage, '아이디 입력 후 중복확인을 진행해 주세요.');
  });
}

if (checkIdBtn && joinIdInput) {
  checkIdBtn.addEventListener('click', async () => {
    const id = joinIdInput.value.trim();
    if (!isValidLoginId(id)) {
      setMessage(joinIdMessage, '아이디는 영문 소문자와 숫자만 사용해 4~12자로 입력해 주세요.', 'error'); return;
    }

    const { data: available, error } = await db.rpc('fn_check_login_id', { p_login_id: id });

    if (error) { setMessage(joinIdMessage, '확인 중 오류가 발생했습니다.', 'error'); return; }
    if (!available) {
      setMessage(joinIdMessage, '이미 사용 중인 아이디입니다.', 'error');
      isJoinIdChecked = false; return;
    }
    isJoinIdChecked = true; checkedJoinId = id;
    setMessage(joinIdMessage, '사용 가능한 아이디입니다.', 'success');
  });
}

/* ── 휴대폰 중복확인 → db.rpc('fn_check_phone') ── */
if (joinPhoneInput) {
  joinPhoneInput.addEventListener('input', () => {
    joinPhoneInput.value = onlyDigits(joinPhoneInput.value).slice(0, 11);
    isJoinPhoneVerified = false; verifiedJoinPhone = '';
  });
}

const sendPhoneCodeBtn = document.getElementById('send-phone-code-btn');
if (sendPhoneCodeBtn && joinPhoneInput) {
  sendPhoneCodeBtn.addEventListener('click', async () => {
    const phone = onlyDigits(joinPhoneInput.value);
    if (!isValidPhone(phone)) {
      setMessage(joinPhoneMessage, '휴대폰 번호는 010으로 시작하는 11자리 숫자로 입력해 주세요.', 'error'); return;
    }

    const { data: available, error } = await db.rpc('fn_check_phone', { p_phone: phone });

    if (error) { setMessage(joinPhoneMessage, '확인 중 오류가 발생했습니다.', 'error'); return; }
    if (!available) { setMessage(joinPhoneMessage, '이미 가입된 휴대폰 번호입니다.', 'error'); return; }

    try {
      await sendVerificationCode(phone, 'join');
      joinPhoneCodeIssued = true;
      // TODO: 실제 SMS 발송 후 '인증번호가 발송되었습니다. (5분 이내 입력)'으로 교체
      setMessage(joinPhoneMessage, '테스트 인증번호 123456을 입력해 주세요.', 'success');
    } catch (err) {
      setMessage(joinPhoneMessage, err.message || 'SMS 발송 실패. 번호를 확인해 주세요.', 'error');
    }
  });
}

const verifyPhoneCodeBtn = document.getElementById('verify-phone-code-btn');
if (verifyPhoneCodeBtn && joinPhoneInput) {
  verifyPhoneCodeBtn.addEventListener('click', async () => {
    const code  = document.getElementById('join-phone-code')?.value.trim();
    const phone = onlyDigits(joinPhoneInput.value);
    if (!joinPhoneCodeIssued) { setMessage(joinPhoneMessage, '인증번호 받기를 먼저 진행해 주세요.', 'error'); return; }
    if (!code) { setMessage(joinPhoneMessage, '인증번호를 입력해 주세요.', 'error'); return; }
    try {
      const { valid, error } = await verifySmsCode(phone, code, 'join');
      if (!valid) { setMessage(joinPhoneMessage, error || '인증번호가 일치하지 않습니다.', 'error'); return; }
      isJoinPhoneVerified = true; verifiedJoinPhone = phone;
      setMessage(joinPhoneMessage, '휴대폰 인증이 완료되었습니다.', 'success');
    } catch (err) {
      setMessage(joinPhoneMessage, err.message || '인증 확인 중 오류가 발생했습니다.', 'error');
    }
  });
}

/* ── 이메일 중복확인 → db.rpc('fn_check_email') ── */
if (joinEmailSelect && joinEmailDomain) {
  joinEmailSelect.addEventListener('change', () => {
    joinEmailDomain.value   = joinEmailSelect.value;
    joinEmailDomain.readOnly = Boolean(joinEmailSelect.value);
    isJoinEmailChecked = false; checkedJoinEmail = '';
    joinEmailCodeIssued = false;
    setMessage(joinEmailMessage, '이메일 확인을 진행해 주세요.');
  });
}
['join-email-id', 'join-email-domain'].forEach(id => {
  const input = document.getElementById(id);
  if (input) input.addEventListener('input', () => {
    isJoinEmailChecked = false; checkedJoinEmail = '';
    joinEmailCodeIssued = false;
  });
});

const checkEmailBtn = document.getElementById('check-email-btn');
if (checkEmailBtn) {
  checkEmailBtn.addEventListener('click', async () => {
    const email = buildJoinEmail();
    if (!isValidEmail(email)) {
      setMessage(joinEmailMessage, '이메일 형식을 확인해 주세요.', 'error'); return;
    }

    const { data: available, error } = await db.rpc('fn_check_email', { p_email: email });

    if (error) { setMessage(joinEmailMessage, '확인 중 오류가 발생했습니다.', 'error'); return; }
    if (!available) {
      setMessage(joinEmailMessage, '이미 가입된 이메일입니다.', 'error');
      isJoinEmailChecked = false; joinEmailCodeIssued = false; return;
    }
    // 중복 없음 → 인증번호 발급
    isJoinEmailChecked = false;
    joinEmailCodeIssued = true;
    // TODO: 실제 이메일 인증 코드 발송으로 교체
    setMessage(joinEmailMessage, '테스트 인증번호 123456을 입력해 주세요.', 'success');
  });
}

const verifyEmailCodeBtn = document.getElementById('verify-email-code-btn');
if (verifyEmailCodeBtn) {
  verifyEmailCodeBtn.addEventListener('click', () => {
    const email = buildJoinEmail();
    const code  = document.getElementById('join-email-code')?.value.trim();
    if (!joinEmailCodeIssued) {
      setMessage(joinEmailMessage, '이메일 확인을 먼저 진행해 주세요.', 'error'); return;
    }
    if (!code) { setMessage(joinEmailMessage, '인증번호를 입력해 주세요.', 'error'); return; }
    // TODO: 실제 이메일 코드 검증으로 교체
    if (code !== MOCK_CODE) { setMessage(joinEmailMessage, '인증번호가 일치하지 않습니다.', 'error'); return; }
    isJoinEmailChecked = true; checkedJoinEmail = email;
    setMessage(joinEmailMessage, '이메일 인증이 완료되었습니다.', 'success');
  });
}

/* 주소 찾기 — 카카오 우편번호 서비스 (페이지 내 레이어 방식) */
const findAddressBtn = document.getElementById('find-address-btn');
let postcodeOverlay;
let postcodeLayer;

function applySelectedAddress(data) {
  const addr = data.address || data.roadAddress || data.jibunAddress || '';
  const addressInput = document.getElementById('join-address');
  if (!addr || !addressInput) return false;

  addressInput.removeAttribute('readonly');
  addressInput.value = addr;
  addressInput.dispatchEvent(new Event('input', { bubbles: true }));
  addressInput.dispatchEvent(new Event('change', { bubbles: true }));
  addressInput.setAttribute('readonly', '');

  requestAnimationFrame(() => {
    document.getElementById('join-address-detail')?.focus();
  });

  return true;
}

window.easefitApplySelectedAddress = applySelectedAddress;

function closePostcodeLayer() {
  if (postcodeOverlay) {
    postcodeOverlay.hidden = true;
    postcodeOverlay.setAttribute('aria-hidden', 'true');
  }
  if (postcodeLayer) postcodeLayer.innerHTML = '';
}

function ensurePostcodeLayer() {
  if (postcodeOverlay && postcodeLayer) return;

  postcodeOverlay = document.createElement('div');
  postcodeOverlay.className = 'postcode-overlay';
  postcodeOverlay.hidden = true;
  postcodeOverlay.setAttribute('aria-hidden', 'true');
  postcodeOverlay.innerHTML = `
    <div class="postcode-panel" role="dialog" aria-modal="true" aria-label="주소 검색">
      <div class="postcode-panel-head">
        <strong>주소 검색</strong>
        <button type="button" class="postcode-close" aria-label="주소 검색 닫기">×</button>
      </div>
      <div class="postcode-layer"></div>
    </div>
  `;
  document.body.appendChild(postcodeOverlay);

  postcodeLayer = postcodeOverlay.querySelector('.postcode-layer');
  postcodeOverlay.querySelector('.postcode-close')?.addEventListener('click', closePostcodeLayer);
  postcodeOverlay.addEventListener('click', event => {
    if (event.target === postcodeOverlay) closePostcodeLayer();
  });
}

if (findAddressBtn) {
  findAddressBtn.addEventListener('click', () => {
    if (!window.daum?.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    ensurePostcodeLayer();
    postcodeLayer.innerHTML = '';
    postcodeOverlay.hidden = false;
    postcodeOverlay.setAttribute('aria-hidden', 'false');

    new daum.Postcode({
      width: '100%',
      height: '100%',
      oncomplete: function(data) {
        if (applySelectedAddress(data)) closePostcodeLayer();
      },
    }).embed(postcodeLayer);
  });
}

/* ── 회원가입 제출 → db.from('users').insert()
      RLS: anon INSERT 정책으로 허용 (status='active' 강제)
   ── */
const joinForm = document.querySelector('[data-auth-form="join"]');
if (joinForm) {
  const joinMessage  = document.getElementById('join-message');
  const joinComplete = document.getElementById('join-complete');

  joinForm.addEventListener('submit', async e => {
    e.preventDefault();

    for (const field of document.querySelectorAll('.join-required')) {
      if (!field.value.trim()) {
        setMessage(joinMessage, '필수 입력 항목을 모두 입력해주세요.', 'error');
        field.focus(); return;
      }
    }

    const id = joinIdInput ? joinIdInput.value.trim() : '';
    if (!isValidLoginId(id)) {
      setMessage(joinMessage, '아이디 형식을 확인해 주세요.', 'error'); joinIdInput?.focus(); return;
    }
    if (!isJoinIdChecked || checkedJoinId !== id) {
      setMessage(joinMessage, '아이디 중복확인을 완료해 주세요.', 'error'); return;
    }

    const pw        = document.getElementById('join-pw');
    const pwConfirm = document.getElementById('join-pw-confirm');
    if (!pw || !isStrongPassword(pw.value)) {
      setMessage(joinMessage, '비밀번호는 영문, 숫자, 특수문자를 포함해 8~16자로 입력해 주세요.', 'error');
      pw?.focus(); return;
    }
    if (pwConfirm && pw.value !== pwConfirm.value) {
      setMessage(joinMessage, '비밀번호가 일치하지 않습니다.', 'error'); pwConfirm.focus(); return;
    }

    const name = document.getElementById('join-name')?.value.trim() || '';
    if (!isValidName(name)) {
      setMessage(joinMessage, '이름은 2자 이상이며 숫자와 특수문자는 사용할 수 없습니다.', 'error');
      document.getElementById('join-name')?.focus(); return;
    }

    const phone = onlyDigits(document.getElementById('join-phone')?.value || '');
    const email = buildJoinEmail();
    if (!isValidPhone(phone)) { setMessage(joinMessage, '휴대폰 번호 형식을 확인해 주세요.', 'error'); return; }
    if (!isJoinPhoneVerified || verifiedJoinPhone !== phone) {
      setMessage(joinMessage, '휴대폰 인증을 완료해 주세요.', 'error'); return;
    }
    if (!isValidEmail(email)) { setMessage(joinMessage, '이메일 형식을 확인해 주세요.', 'error'); return; }
    if (!isJoinEmailChecked || checkedJoinEmail !== email) {
      setMessage(joinMessage, '이메일 인증을 완료해 주세요.', 'error'); return;
    }

    const address       = document.getElementById('join-address')?.value.trim()        || '';
    const addressDetail = document.getElementById('join-address-detail')?.value.trim() || '';
    if (!address || !addressDetail) {
      setMessage(joinMessage, '주소와 상세주소를 입력해 주세요.', 'error'); return;
    }
    for (const cb of document.querySelectorAll('.term-required')) {
      if (!cb.checked) { setMessage(joinMessage, '필수 약관에 동의해주세요.', 'error'); return; }
    }

    setMessage(joinMessage, '가입 처리 중...', '');

    // 비밀번호 SHA-256 해시 저장 (실서비스: bcrypt/Argon2 사용 권장)
    const hashedPw = await hashPassword(pw.value);

    // users INSERT (RLS 정책: anon INSERT 허용, status='active' 강제 검증)
    const { error } = await db.from('users').insert([{
      login_id:        id,
      password:        hashedPw,
      name,
      email,
      phone,
      address,
      address_detail:  addressDetail,
      info_agree:      Boolean(document.getElementById('agree-info')?.checked),
      marketing_agree: Boolean(document.getElementById('agree-marketing')?.checked),
      status:          'active'
    }]);

    if (error) {
      if (error.code === '23505') {
        setMessage(joinMessage, '이미 사용 중인 아이디, 이메일 또는 휴대폰 번호입니다.', 'error');
      } else {
        setMessage(joinMessage, '회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
        console.error('가입 오류:', error);
      }
      return;
    }

    setMessage(joinMessage, '회원가입이 완료되었습니다!', 'success');
    if (joinComplete) joinComplete.hidden = false;
  });
}

/* ════════════════════════════════════════════
   아이디 찾기 — db.rpc('fn_find_login_id')
   ════════════════════════════════════════════ */

const findForm     = document.querySelector('[data-auth-form="find-id"]');
const findSendCode = document.getElementById('find-send-code');
let findCodeIssued = false;

if (findSendCode) {
  findSendCode.addEventListener('click', async () => {
    const message = document.getElementById('find-message');
    const name    = document.getElementById('find-name')?.value.trim();
    const phone   = onlyDigits(document.getElementById('find-phone')?.value || '');
    const email   = document.getElementById('find-email')?.value.trim() || '';
    if (!isValidName(name || '')) {
      setMessage(message, '이름을 정확히 입력해 주세요.', 'error'); return;
    }
    if (!isValidPhone(phone) && !isValidEmail(email)) {
      setMessage(message, '휴대폰 번호 또는 이메일 중 하나를 정확히 입력해 주세요.', 'error'); return;
    }
    if (!isValidPhone(phone)) {
      // 이메일로 찾는 경우: 인증번호 없이 바로 진행
      findCodeIssued = true;
      setMessage(message, '이메일로 확인합니다. 아래 버튼을 눌러 진행해 주세요.', 'success');
      return;
    }
    try {
      await sendVerificationCode(phone, 'find-id');
      findCodeIssued = true;
      // TODO: 실제 SMS 발송 후 '인증번호가 발송되었습니다. (5분 이내 입력)'으로 교체
      setMessage(message, '테스트 인증번호 123456을 입력해 주세요.', 'success');
    } catch (err) {
      setMessage(message, err.message || 'SMS 발송 실패', 'error');
    }
  });
}

if (findForm) {
  const findResult = document.getElementById('find-result');
  const message    = document.getElementById('find-message');

  findForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!findCodeIssued) {
      setMessage(message, '인증번호 받기를 먼저 진행해 주세요.', 'error'); return;
    }

    const name  = document.getElementById('find-name')?.value.trim() || '';
    const phone = onlyDigits(document.getElementById('find-phone')?.value || '');
    const email = document.getElementById('find-email')?.value.trim() || '';
    const code  = document.getElementById('find-code')?.value.trim() || '';

    // 휴대폰 인증번호 검증 (전화번호 입력 시)
    if (isValidPhone(phone)) {
      if (!code) { setMessage(message, '인증번호를 입력해 주세요.', 'error'); return; }
      try {
        const { valid, error } = await verifySmsCode(phone, code, 'find-id');
        if (!valid) { setMessage(message, error || '인증번호가 일치하지 않습니다.', 'error'); return; }
      } catch (err) {
        setMessage(message, err.message || '인증 확인 중 오류가 발생했습니다.', 'error'); return;
      }
    }

    // RPC 호출 — users 테이블 직접 SELECT 불가 (RLS)
    const { data: rows, error } = await db.rpc('fn_find_login_id', {
      p_name:  name,
      p_phone: isValidPhone(phone) ? phone : '',
      p_email: isValidPhone(phone) ? '' : email
    });

    if (error || !rows || !rows.length) {
      setMessage(message, '일치하는 회원 정보를 찾을 수 없습니다.', 'error'); return;
    }

    setMessage(message, '', '');
    if (findResult) {
      findResult.hidden = false;
      const idEl = findResult.querySelector('[data-result="login-id"]');
      if (idEl) idEl.textContent = rows[0].login_id;
    }
  });
}

/* ════════════════════════════════════════════
   비밀번호 재설정
   본인확인: db.rpc('fn_verify_user')
   비밀번호 변경: db.rpc('fn_reset_password')
   ════════════════════════════════════════════ */

const resetSendCode  = document.getElementById('reset-send-code');
const resetVerifyBtn = document.getElementById('reset-verify-btn');
const resetForm      = document.querySelector('[data-auth-form="reset-password"]');
let resetCodeIssued  = false;

// 본인 확인 후 재설정 단계에서 재사용할 입력값 저장
let _resetIdentity = { loginId: '', name: '', phone: '', email: '' };

if (resetSendCode) {
  resetSendCode.addEventListener('click', async () => {
    const message = document.getElementById('reset-verify-message');
    const id      = document.getElementById('reset-id')?.value.trim();
    const name    = document.getElementById('reset-name')?.value.trim();
    const phone   = onlyDigits(document.getElementById('reset-phone')?.value || '');
    const email   = document.getElementById('reset-email')?.value.trim() || '';
    if (!isValidLoginId(id || '')) {
      setMessage(message, '아이디는 영문 소문자와 숫자 4~12자로 입력해 주세요.', 'error'); return;
    }
    if (!isValidName(name || '')) {
      setMessage(message, '이름을 정확히 입력해 주세요.', 'error'); return;
    }
    if (!isValidPhone(phone) && !isValidEmail(email)) {
      setMessage(message, '휴대폰 번호 또는 이메일 중 하나를 정확히 입력해 주세요.', 'error'); return;
    }
    if (!isValidPhone(phone)) {
      resetCodeIssued = true;
      setMessage(message, '이메일로 확인합니다. 아래 버튼을 눌러 진행해 주세요.', 'success');
      return;
    }
    try {
      await sendVerificationCode(phone, 'reset-password');
      resetCodeIssued = true;
      // TODO: 실제 SMS 발송 후 '인증번호가 발송되었습니다. (5분 이내 입력)'으로 교체
      setMessage(message, '테스트 인증번호 123456을 입력해 주세요.', 'success');
    } catch (err) {
      setMessage(message, err.message || 'SMS 발송 실패', 'error');
    }
  });
}

if (resetVerifyBtn) {
  resetVerifyBtn.addEventListener('click', async () => {
    const message = document.getElementById('reset-verify-message');
    if (!resetCodeIssued) {
      setMessage(message, '인증번호 받기를 먼저 진행해 주세요.', 'error'); return;
    }

    const id    = document.getElementById('reset-id')?.value.trim()   || '';
    const name  = document.getElementById('reset-name')?.value.trim() || '';
    const phone = onlyDigits(document.getElementById('reset-phone')?.value || '');
    const email = document.getElementById('reset-email')?.value.trim() || '';
    const code  = document.getElementById('reset-code')?.value.trim() || '';

    // 휴대폰 인증번호 검증 (전화번호 입력 시)
    if (isValidPhone(phone)) {
      if (!code) { setMessage(message, '인증번호를 입력해 주세요.', 'error'); return; }
      try {
        const { valid, error } = await verifySmsCode(phone, code, 'reset-password');
        if (!valid) { setMessage(message, error || '인증번호가 일치하지 않습니다.', 'error'); return; }
      } catch (err) {
        setMessage(message, err.message || '인증 확인 중 오류', 'error'); return;
      }
    }

    // RPC 호출 — 회원 존재 여부 확인 (SECURITY DEFINER)
    const { data: verified, error } = await db.rpc('fn_verify_user', {
      p_login_id: id,
      p_name:     name,
      p_phone:    isValidPhone(phone) ? phone : '',
      p_email:    isValidPhone(phone) ? '' : email
    });

    if (error || !verified) {
      setMessage(message, '일치하는 회원 정보를 찾을 수 없습니다.', 'error'); return;
    }

    // 비밀번호 재설정 단계에서 쓸 본인 정보 저장
    _resetIdentity = {
      loginId: id,
      name,
      phone:   isValidPhone(phone) ? phone : '',
      email:   isValidPhone(phone) ? '' : email
    };

    const verifyStep = document.querySelector('[data-step="verify"]');
    const pwStep     = document.querySelector('[data-step="new-password"]');
    if (verifyStep && pwStep) {
      verifyStep.hidden = true;  verifyStep.classList.remove('is-active');
      pwStep.hidden     = false; pwStep.classList.add('is-active');
    }
  });
}

if (resetForm) {
  const result  = document.getElementById('reset-result');
  const message = document.getElementById('reset-password-message');

  resetForm.addEventListener('submit', async e => {
    e.preventDefault();
    const pw      = document.getElementById('reset-new-pw');
    const confirm = document.getElementById('reset-new-pw-confirm');

    if (!pw || !isStrongPassword(pw.value)) {
      setMessage(message, '비밀번호는 영문, 숫자, 특수문자를 포함해 8~16자로 입력해 주세요.', 'error');
      pw?.focus(); return;
    }
    if (confirm && pw.value !== confirm.value) {
      setMessage(message, '새 비밀번호가 일치하지 않습니다.', 'error'); confirm.focus(); return;
    }

    setMessage(message, '변경 중...', '');

    // 비밀번호 SHA-256 해시 (실서비스: bcrypt/Argon2 권장)
    const hashedPw = await hashPassword(pw.value);

    // RPC 호출 — users UPDATE 직접 불가 (RLS), SECURITY DEFINER 함수로 처리
    const { data: success, error } = await db.rpc('fn_reset_password', {
      p_login_id:     _resetIdentity.loginId,
      p_name:         _resetIdentity.name,
      p_phone:        _resetIdentity.phone,
      p_email:        _resetIdentity.email,
      p_new_password: hashedPw
    });

    if (error || !success) {
      setMessage(message, '비밀번호 변경 중 오류가 발생했습니다.', 'error');
      console.error('비밀번호 변경 오류:', error); return;
    }

    setMessage(message, '비밀번호가 변경되었습니다.', 'success');
    if (result) result.hidden = false;
  });
}
