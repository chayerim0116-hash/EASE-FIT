'use strict';

/* ════════════════════════════════════════════
   supabase.js — Supabase 클라이언트 공통 설정
   모든 페이지에서 이 파일을 common.js / account.js 보다 먼저 로드
   ════════════════════════════════════════════ */

const SUPABASE_URL     = 'https://sloxjwxqwwukgsqrkqgq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsb3hqd3hxd3d1a2dzcXJrcWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjU4ODcsImV4cCI6MjA5NjgwMTg4N30.H5zXQpEJJjbkYOR1Ho27F9fyltXJSMnGKIdF5dtLuxM';

// CDN UMD 빌드에서 전역 window.supabase 사용
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* 비로그인 사용자를 구분하는 세션 ID (장바구니·위시리스트용) */
function getSessionId() {
  let sid = localStorage.getItem('easefit_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('easefit_session_id', sid);
  }
  return sid;
}

/* 비밀번호 SHA-256 해싱 (Web Crypto API) */
async function hashPassword(password) {
  const encoded = new TextEncoder().encode(password);
  const buffer  = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
