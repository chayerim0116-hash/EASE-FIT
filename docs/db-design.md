"# EASE FIT — Supabase DB 설계 문서

> 작성 기준: 2026-06-29  
> 실제 생성된 테이블 기준 (추측 없음)  
> Supabase project ref: `sloxjwxqwwukgsqrkqgq`

---

## 목차

1. [전체 테이블 목록](#1-전체-테이블-목록)
2. [테이블 컬럼 상세](#2-테이블-컬럼-상세)
3. [테이블 관계도 (ERD 텍스트)](#3-테이블-관계도-erd-텍스트)
4. [RLS 정책](#4-rls-정책)
5. [RPC 함수 (SECURITY DEFINER)](#5-rpc-함수-security-definer)
6. [Edge Functions](#6-edge-functions)
7. [프론트 연결 현황](#7-프론트-연결-현황)
8. [향후 확장 테이블 (미생성)](#8-향후-확장-테이블-미생성)
9. [보안 설계 원칙](#9-보안-설계-원칙)

---

## 1. 전체 테이블 목록

실제 생성된 테이블 10개 (2026-06-29 기준)

| # | 테이블명 | 역할 | 현재 row 수 | RLS |
|---|---|---|---|---|
| 1 | `users` | 회원 정보 | 1 | ON |
| 2 | `cart_items` | 장바구니 항목 | 0 | ON |
| 3 | `wishlist_items` | 위시리스트 항목 | 0 | ON |
| 4 | `products` | 상품 마스터 | 12 | ON |
| 5 | `product_colors` | 상품별 컬러 옵션 | 36 | ON |
| 6 | `product_images` | 컬러별 상품 이미지 | 144 | ON |
| 7 | `product_sizes` | 공통 사이즈 실측 데이터 | 7 | ON |
| 8 | `product_variants` | 상품×컬러×사이즈 재고 | 252 | ON |
| 9 | `verification_codes` | SMS 인증번호 임시 저장 | 0 | ON |
| 10 | `social_accounts` | 카카오/네이버 소셜 계정 연동 | 0 | ON |

---

## 2. 테이블 컬럼 상세

### 2-1. `users` — 회원 정보

| 컬럼명 | 타입 | Nullable | 기본값 | 제약 |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `login_id` | `varchar(12)` | NO | — | UNIQUE |
| `password` | `text` | NO | — | — |
| `name` | `varchar(50)` | NO | — | — |
| `email` | `varchar(100)` | **YES** | — | UNIQUE |
| `phone` | `varchar(11)` | **YES** | — | UNIQUE |
| `address` | `text` | YES | `''` | — |
| `address_detail` | `varchar(200)` | YES | `''` | — |
| `info_agree` | `boolean` | YES | `false` | — |
| `marketing_agree` | `boolean` | YES | `false` | — |
| `status` | `varchar(20)` | YES | `'active'` | — |
| `created_at` | `timestamptz` | YES | `now()` | — |

> **설계 메모:**
> - `password`는 SHA-256 해시값 저장 (원문 저장 금지). 실서비스는 bcrypt/Argon2 권장.
> - `email`, `phone`은 일반 회원가입 시 필수 입력이나 소셜 로그인 사용자는 NULL 허용 (UNIQUE는 NULL을 서로 다른 값으로 처리 → 중복 없음).
> - 직접 SELECT/UPDATE 불가 → 모든 조회·수정은 SECURITY DEFINER RPC 경유.

---

### 2-2. `cart_items` — 장바구니

| 컬럼명 | 타입 | Nullable | 기본값 | 제약 |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `session_id` | `varchar` | NO | — | UNIQUE (복합: session_id + product_id + color + size) |
| `product_id` | `varchar` | NO | — | UNIQUE (복합) |
| `product_name` | `varchar` | NO | — | — |
| `brand` | `varchar` | YES | `'EASE FIT'` | — |
| `color` | `varchar` | YES | `''` | UNIQUE (복합) |
| `size` | `varchar` | YES | `''` | UNIQUE (복합) |
| `quantity` | `integer` | YES | `1` | — |
| `price` | `integer` | YES | `0` | — |
| `image` | `text` | YES | `''` | — |
| `url` | `text` | YES | `''` | — |
| `created_at` | `timestamptz` | YES | `now()` | — |

> **설계 메모:** `session_id`는 비로그인 사용자의 UUID (localStorage `easefit_session_id`). UUID 정규식 RLS로 임의 문자열 차단.

---

### 2-3. `wishlist_items` — 위시리스트

| 컬럼명 | 타입 | Nullable | 기본값 | 제약 |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `session_id` | `varchar` | NO | — | UNIQUE (복합: session_id + product_id) |
| `product_id` | `varchar` | NO | — | UNIQUE (복합) |
| `product_name` | `varchar` | YES | `''` | — |
| `category` | `varchar` | YES | `'EASE FIT'` | — |
| `price` | `varchar` | YES | `''` | — |
| `original_price` | `varchar` | YES | `''` | — |
| `discount` | `varchar` | YES | `''` | — |
| `image` | `text` | YES | `''` | — |
| `colors` | `jsonb` | YES | `[]` | — |
| `sizes` | `varchar` | YES | `'XS-3XL'` | — |
| `created_at` | `timestamptz` | YES | `now()` | — |

---

### 2-4. `products` — 상품 마스터

| 컬럼명 | 타입 | Nullable | 기본값 | 제약 |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `code` | `varchar` | NO | — | UNIQUE |
| `name` | `varchar` | NO | — | — |
| `price` | `integer` | NO | — | — |
| `model_info` | `varchar` | YES | — | — |
| `default_color` | `varchar` | YES | — | — |
| `default_size` | `varchar` | YES | — | — |
| `created_at` | `timestamptz` | YES | `now()` | — |

> 현재 시드 데이터: EF001~EF012 (12개 상품)

---

### 2-5. `product_colors` — 컬러 옵션

| 컬럼명 | 타입 | Nullable | 기본값 | 제약 |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `product_id` | `uuid` | NO | — | FK → products(id), UNIQUE (복합) |
| `color_key` | `varchar` | NO | — | UNIQUE (복합: product_id + color_key) |
| `color_name` | `varchar` | NO | — | — |
| `swatch` | `varchar` | NO | — | — |
| `display_order` | `smallint` | YES | `0` | — |

---

### 2-6. `product_images` — 상품 이미지

| 컬럼명 | 타입 | Nullable | 기본값 | 제약 |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `color_id` | `uuid` | NO | — | FK → product_colors(id) |
| `image_path` | `text` | NO | — | — |
| `display_order` | `smallint` | YES | `0` | — |

> 컬러 1개당 평균 4장 이미지 (12상품 × 3컬러 × 4장 = 144행)

---

### 2-7. `product_sizes` — 사이즈 실측

| 컬럼명 | 타입 | Nullable | 기본값 | 제약 |
|---|---|---|---|---|
| `size` | `varchar` | NO | — | PK |
| `chest` | `varchar` | YES | — | — |
| `shoulder` | `varchar` | YES | — | — |
| `length` | `varchar` | YES | — | — |
| `fit_desc` | `text` | YES | — | — |
| `display_order` | `smallint` | YES | `0` | — |

> 사이즈: XS, S, M, L, XL, 2XL, 3XL (7개)

---

### 2-8. `product_variants` — 재고 현황

| 컬럼명 | 타입 | Nullable | 기본값 | 제약 |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `product_id` | `uuid` | NO | — | FK → products(id), UNIQUE (복합) |
| `color_id` | `uuid` | NO | — | FK → product_colors(id), UNIQUE (복합) |
| `size` | `varchar` | NO | — | UNIQUE (복합: product_id + color_id + size) |
| `in_stock` | `boolean` | YES | `true` | — |

> 12상품 × 3컬러 × 7사이즈 = 252행

---

### 2-9. `verification_codes` — SMS 인증번호

| 컬럼명 | 타입 | Nullable | 기본값 | 제약 |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `phone` | `varchar(11)` | NO | — | — |
| `code` | `char(6)` | NO | — | — |
| `purpose` | `varchar(30)` | NO | — | — |
| `expires_at` | `timestamptz` | NO | — | — |
| `used` | `boolean` | YES | `false` | — |
| `created_at` | `timestamptz` | YES | `now()` | — |

> `purpose` 값: `'join'` | `'find-id'` | `'reset-password'`  
> 만료: 생성 시점 +5분. 사용 후 `used=true` 마킹.  
> RLS policy 없음 → anon 접근 불가. Edge Function (service_role)만 접근.

---

### 2-10. `social_accounts` — 소셜 계정 연동

| 컬럼명 | 타입 | Nullable | 기본값 | 제약 |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → users(id) ON DELETE CASCADE |
| `provider` | `varchar` | NO | — | UNIQUE (복합: provider + provider_id) |
| `provider_id` | `varchar` | NO | — | UNIQUE (복합) |
| `email` | `varchar` | YES | — | — |
| `name` | `varchar` | YES | — | — |
| `created_at` | `timestamptz` | YES | `now()` | — |

> `provider` 값: `'kakao'` | `'naver'`  
> RLS policy 없음 → anon 접근 불가. Edge Function (service_role)만 접근.

---

## 3. 테이블 관계도 (ERD 텍스트)

```
users (1)
  ├─ (1:N) social_accounts     [user_id → users.id]
  └─ (인증만) verification_codes  [연결 없음, 독립 테이블]

products (1)
  ├─ (1:N) product_colors      [product_id → products.id]
  │    └─ (1:N) product_images [color_id → product_colors.id]
  └─ (1:N) product_variants    [product_id → products.id]
                                [color_id  → product_colors.id]

product_sizes  ← 독립 테이블 (공통 사이즈 실측, FK 없음)

cart_items     ← 독립 테이블 (session_id 기반, FK 없음)
wishlist_items ← 독립 테이블 (session_id 기반, FK 없음)
```

---

## 4. RLS 정책

실제 생성된 정책 13개

| # | 테이블 | policy 이름 | 작업 | role | 조건 |
|---|---|---|---|---|---|
| 1 | `cart_items` | `cart_anon_select` | SELECT | anon | session_id = UUID 형식 |
| 2 | `cart_items` | `cart_anon_insert` | INSERT | anon | session_id = UUID 형식 (WITH CHECK) |
| 3 | `cart_items` | `cart_anon_update` | UPDATE | anon | session_id = UUID 형식 |
| 4 | `cart_items` | `cart_anon_delete` | DELETE | anon | session_id = UUID 형식 |
| 5 | `wishlist_items` | `wishlist_anon_select` | SELECT | anon | session_id = UUID 형식 |
| 6 | `wishlist_items` | `wishlist_anon_insert` | INSERT | anon | session_id = UUID 형식 (WITH CHECK) |
| 7 | `wishlist_items` | `wishlist_anon_delete` | DELETE | anon | session_id = UUID 형식 |
| 8 | `users` | `users_anon_signup` | INSERT | anon | status = 'active' (WITH CHECK) |
| 9 | `products` | `products_select_public` | SELECT | anon, authenticated | true (전체 공개) |
| 10 | `product_colors` | `product_colors_select_public` | SELECT | anon, authenticated | true |
| 11 | `product_images` | `product_images_select_public` | SELECT | anon, authenticated | true |
| 12 | `product_sizes` | `product_sizes_select_public` | SELECT | anon, authenticated | true |
| 13 | `product_variants` | `product_variants_select_public` | SELECT | anon, authenticated | true |

**UUID 정규식 조건:**  
```sql
session_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
```

**정책 없는 테이블:**
- `verification_codes` — policy 없음 (Edge Function service_role 전용)
- `social_accounts` — policy 없음 (Edge Function service_role 전용)

**참고:**
- `users` SELECT/UPDATE 정책 없음 → SECURITY DEFINER RPC 함수로만 접근 가능
- `wishlist_items` UPDATE 정책 없음 → 프론트에서 delete+insert 방식으로 처리 중

---

## 5. RPC 함수 (SECURITY DEFINER)

모두 `SECURITY DEFINER` 설정 → DB 슈퍼유저 권한으로 실행 (RLS 우회)  
프론트는 anon key로 `db.rpc('fn_...', {...})` 방식 호출

| # | 함수명 | 입력 파라미터 | 반환 타입 | 역할 | 사용 페이지 |
|---|---|---|---|---|---|
| 1 | `fn_check_login_id` | `p_login_id text` | `boolean` | 아이디 중복 여부 (true = 사용 가능) | join.html |
| 2 | `fn_check_email` | `p_email text` | `boolean` | 이메일 중복 여부 | join.html |
| 3 | `fn_check_phone` | `p_phone text` | `boolean` | 전화번호 중복 여부 | join.html |
| 4 | `fn_login` | `p_id text`, `p_password text` | `TABLE(user_id uuid, login_id varchar, name varchar, status varchar)` | 로그인 인증 (SHA-256 비교) | login.html |
| 5 | `fn_find_login_id` | `p_name text`, `p_phone text`, `p_email text` | `TABLE(login_id varchar, created_at timestamptz)` | 이름+전화/이메일로 아이디 조회 | find-id.html |
| 6 | `fn_verify_user` | `p_login_id text`, `p_name text`, `p_phone text`, `p_email text` | `boolean` | 비밀번호 재설정 전 본인 확인 | reset-password.html |
| 7 | `fn_reset_password` | `p_login_id text`, `p_name text`, `p_phone text`, `p_email text`, `p_new_password text` | `boolean` | 비밀번호 SHA-256 해시 업데이트 | reset-password.html |

---

## 6. Edge Functions

모두 `verify_jwt: false` 설정 (비로그인 상태에서도 호출 가능)  
Base URL: `https://sloxjwxqwwukgsqrkqgq.supabase.co/functions/v1`

| # | 함수명 | 버전 | 역할 | API 키 저장 위치 |
|---|---|---|---|---|
| 1 | `send-verification-code` | v1 | 6자리 인증번호 생성 → DB 저장 → SMS 발송 | Supabase Secrets |
| 2 | `verify-sms-code` | v1 | 코드 검증 → used=true 마킹 | — |
| 3 | `kakao-auth` | v2 | 카카오 OAuth URL 생성 / 토큰 교환 / 회원 처리 | Supabase Secrets |
| 4 | `naver-auth` | v2 | 네이버 OAuth URL 생성 / 토큰 교환 / 회원 처리 | Supabase Secrets |

### 6-1. `send-verification-code` 동작 흐름

```
프론트 → POST /send-verification-code { phone, purpose }
         ↓
    1. 전화번호 형식 검증 (010XXXXXXXX)
    2. 6자리 난수 생성
    3. verification_codes에 저장 (expires_at = now + 5분)
    4. 이전 미사용 코드 삭제
    5. CoolSMS 또는 NAVER SENS API 호출
         ↓
    { success: true }
```

### 6-2. `kakao-auth` / `naver-auth` 동작 흐름

```
GET ?action=url&redirectUri=...  →  { url: "https://kauth.kakao.com/..." }
                                              ↓ 사용자가 카카오 로그인
POST { code, redirectUri }
    1. 카카오 서버에서 access_token 교환
    2. 카카오 사용자 정보 조회 (id, nickname, email)
    3. social_accounts에서 기존 사용자 조회
       - 있으면: 기존 loginId, name 반환
       - 없으면: users 신규 생성 (login_id = kakao_{id[:10]})
                 social_accounts 연동 레코드 생성
    4. { loginId, name } 반환
```

### 6-3. Supabase Secrets (설정 필요 항목)

| 키 이름 | 용도 | 설정 명령 |
|---|---|---|
| `COOLSMS_API_KEY` | CoolSMS 인증 키 | `supabase secrets set COOLSMS_API_KEY=...` |
| `COOLSMS_API_SECRET` | CoolSMS 인증 시크릿 | `supabase secrets set COOLSMS_API_SECRET=...` |
| `COOLSMS_FROM` | 발신 번호 | `supabase secrets set COOLSMS_FROM=010XXXXXXXX` |
| `KAKAO_CLIENT_ID` | 카카오 REST API 키 | `supabase secrets set KAKAO_CLIENT_ID=...` |
| `KAKAO_CLIENT_SECRET` | 카카오 Client Secret | `supabase secrets set KAKAO_CLIENT_SECRET=...` |
| `NAVER_CLIENT_ID` | 네이버 Client ID | `supabase secrets set NAVER_CLIENT_ID=...` |
| `NAVER_CLIENT_SECRET` | 네이버 Client Secret | `supabase secrets set NAVER_CLIENT_SECRET=...` |

---

## 7. 프론트 연결 현황

| 기능 | HTML 파일 | JS 파일 | 연결 대상 | 상태 |
|---|---|---|---|---|
| 회원가입 | join.html | account.js | `users` INSERT + fn_check_* RPCs | ✅ 완료 |
| 로그인 | login.html | account.js | `fn_login` RPC | ✅ 완료 |
| 아이디 찾기 | find-id.html | account.js | SMS Edge Fn + `fn_find_login_id` RPC | ✅ 완료 (SMS 키 미설정) |
| 비밀번호 재설정 | reset-password.html | account.js | SMS Edge Fn + `fn_verify_user` + `fn_reset_password` | ✅ 완료 (SMS 키 미설정) |
| 카카오 로그인 | login.html → oauth-callback.html | account.js | `kakao-auth` Edge Fn | ✅ 구조 완료 (API 키 미설정) |
| 네이버 로그인 | login.html → oauth-callback.html | account.js | `naver-auth` Edge Fn | ✅ 구조 완료 (API 키 미설정) |
| 장바구니 | cart.html, product-detail.html | common.js | `cart_items` CRUD | ✅ 완료 |
| 위시리스트 | wishlist.html, product-detail.html | common.js | `wishlist_items` CRUD | ✅ 완료 |
| 상품 상세 | product-detail.html | product-detail.js | `products` + 네스티드 SELECT | ✅ 완료 |

---

## 8. 향후 확장 테이블 (미생성)

현재 DB에는 존재하지 않으며, 기능 구현 시 추가 필요한 테이블입니다.

### 8-1. `orders` — 주문 (예시 설계)

| 컬럼명 | 타입 | 설명 |
|---|---|---|
| `id` | `uuid` PK | 주문 ID |
| `user_id` | `uuid` FK → users(id) | 주문자 |
| `total_price` | `integer` | 결제 총액 |
| `status` | `varchar` | 주문상태 (pending / paid / shipped / delivered / cancelled) |
| `created_at` | `timestamptz` | 주문일시 |

### 8-2. `order_items` — 주문 상품 (예시 설계)

| 컬럼명 | 타입 | 설명 |
|---|---|---|
| `id` | `uuid` PK | — |
| `order_id` | `uuid` FK → orders(id) | 주문 |
| `product_id` | `uuid` FK → products(id) | 상품 |
| `color` | `varchar` | 선택 컬러 |
| `size` | `varchar` | 선택 사이즈 |
| `quantity` | `integer` | 수량 |
| `price` | `integer` | 단가 |

### 8-3. `reviews` — 상품 리뷰 (예시 설계)

| 컬럼명 | 타입 | 설명 |
|---|---|---|
| `id` | `uuid` PK | — |
| `product_id` | `uuid` FK → products(id) | 리뷰 대상 상품 |
| `user_id` | `uuid` FK → users(id) | 작성자 |
| `rating` | `smallint` | 별점 (1~5) |
| `content` | `text` | 리뷰 내용 |
| `created_at` | `timestamptz` | 작성일시 |

---

## 9. 보안 설계 원칙

| 항목 | 원칙 |
|---|---|
| **비밀번호 저장** | SHA-256 해시만 저장. 원문 절대 저장 금지. (실서비스: bcrypt/Argon2 사용 권장) |
| **SMS API 키** | Supabase Secrets(서버 환경변수)에만 저장. 프론트 코드에 절대 포함 금지. |
| **OAuth Client Secret** | Supabase Secrets에만 저장. 프론트에는 Redirect URI만 노출. |
| **Supabase 키 분리** | 프론트: anon key만 사용. Edge Function: service_role key (서버에서만). |
| **users 테이블 보호** | anon key로 직접 SELECT/UPDATE 불가. 전용 SECURITY DEFINER RPC 함수를 통해서만 접근. |
| **비로그인 장바구니** | UUID 형식 session_id 정규식 검증으로 임의 문자열 공격 차단. |
| **인증번호 만료** | 발송 후 5분 자동 만료, 사용 즉시 used=true 마킹으로 재사용 차단. |

---

*문서 생성: Claude Sonnet 4.6 / 2026-06-29*
