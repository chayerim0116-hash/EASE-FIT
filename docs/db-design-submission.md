# EASE FIT DB 설계

> 작성자: 차예림
> 작성 목적: EASE FIT 쇼핑몰 웹사이트 기능 역기획 기반 데이터베이스 설계 문서
> 구분 표기: ✅ 구현 완료 / 📋 설계 (구현 예정)

---

## 1. DB 설계 목적

EASE FIT은 체형과 핏을 중심으로 한 의류 쇼핑몰로, 단순 상품 구매를 넘어 **사이즈 실측 정보**, **모델 착용 피팅 가이드**, **First Fitting 무료 반품 서비스** 등 핏 중심의 UX를 제공한다.

이 문서는 현재 구현된 EASE FIT 웹사이트의 주요 기능을 분석하여, 해당 기능을 실제 서비스 수준으로 운영하기 위해 필요한 데이터베이스 테이블 구조를 역기획 형태로 정리한 것이다.

현재 일부 기능(장바구니, 위시리스트, 최근 본 상품 등)은 브라우저 localStorage 또는 세션 기반으로 구현되어 있으나, 실제 서비스에서는 DB 기반으로 전환되어야 한다. 이 문서는 그 전환 기준도 함께 포함한다.

---

## 2. 주요 테이블 목록

| # | 테이블명 | 역할 | 상태 |
|---|---|---|---|
| 1 | `users` | 회원 기본 정보 관리 (아이디, 비밀번호, 연락처 등) | ✅ |
| 2 | `social_accounts` | 카카오·네이버 소셜 로그인 연동 정보 관리 | ✅ |
| 3 | `verification_codes` | SMS 인증번호 임시 저장 및 유효성 관리 | ✅ |
| 4 | `products` | 상품 기본 정보 관리 (상품명, 가격, 코드 등) | ✅ |
| 5 | `product_colors` | 상품별 컬러 옵션 관리 | ✅ |
| 6 | `product_images` | 컬러별 상품 이미지 관리 | ✅ |
| 7 | `product_sizes` | 공통 사이즈별 실측 정보 관리 (가슴·어깨·기장) | ✅ |
| 8 | `product_variants` | 상품×컬러×사이즈 재고 관리 | ✅ |
| 9 | `cart_items` | 장바구니 상품 항목 관리 (비회원 포함) | ✅ |
| 10 | `wishlist_items` | 위시리스트(찜) 상품 관리 (비회원 포함) | ✅ |
| 11 | `recent_views` | 최근 본 상품 이력 관리 | 📋 |
| 12 | `product_measurements` | 상품별 사이즈 실측 상세 정보 관리 | 📋 |
| 13 | `product_fit_guides` | 사이즈별 핏 유형 및 설명 관리 | 📋 |
| 14 | `product_model_fits` | 모델 착용 피팅 가이드 정보 관리 | 📋 |
| 15 | `orders` | 주문 기본 정보 관리 | 📋 |
| 16 | `order_items` | 주문 상품 항목 관리 | 📋 |
| 17 | `first_fitting_returns` | 첫 주문 무료 반품 이력 관리 | 📋 |

---

## 3. 테이블 상세 설계

---

### users ✅

회원 계정 정보를 저장하는 핵심 테이블. 소셜 로그인 사용자는 이메일·전화번호 없이도 가입 가능하도록 해당 컬럼은 NULL 허용.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 회원 고유 ID (자동 생성) |
| login_id | VARCHAR(12) | UNIQUE | N | 로그인 아이디 (영문 소문자+숫자, 4~12자) |
| password | TEXT | | N | 비밀번호 (SHA-256 해시 저장) |
| name | VARCHAR(50) | | N | 회원 이름 |
| email | VARCHAR(100) | UNIQUE | Y | 이메일 주소 (소셜 로그인 시 NULL 가능) |
| phone | VARCHAR(11) | UNIQUE | Y | 휴대폰 번호 (소셜 로그인 시 NULL 가능) |
| address | TEXT | | Y | 기본 배송지 도로명 주소 |
| address_detail | VARCHAR(200) | | Y | 기본 배송지 상세 주소 |
| info_agree | BOOLEAN | | Y | 정보 수신 동의 여부 |
| marketing_agree | BOOLEAN | | Y | 마케팅 수신 동의 여부 |
| status | VARCHAR(20) | | Y | 계정 상태 (active / inactive / banned) |
| created_at | DATETIME | | N | 가입 일시 |

---

### social_accounts ✅

카카오 및 네이버 소셜 로그인으로 가입한 사용자의 외부 계정 연동 정보를 관리. 동일 사용자가 여러 소셜 계정을 연결할 수 있도록 설계.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 소셜 계정 고유 ID |
| user_id | UUID | FK | N | 연결된 회원 ID (→ users.id) |
| provider | VARCHAR(10) | | N | 소셜 제공자 (kakao / naver) |
| provider_id | VARCHAR(100) | | N | 소셜 플랫폼에서 발급한 사용자 고유 ID |
| email | VARCHAR(100) | | Y | 소셜 계정 이메일 (제공 시) |
| name | VARCHAR(50) | | Y | 소셜 계정 닉네임 |
| created_at | DATETIME | | N | 연동 일시 |

> **제약:** provider + provider_id 조합은 UNIQUE (동일 소셜 계정 중복 연동 방지)

---

### verification_codes ✅

회원가입·아이디 찾기·비밀번호 재설정 시 발송되는 SMS 인증번호를 임시로 저장. 발송 후 5분이 지나면 만료되며, 사용된 코드는 재사용 불가.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 인증 기록 고유 ID |
| phone | VARCHAR(11) | | N | 인증 대상 휴대폰 번호 |
| code | CHAR(6) | | N | 발송된 6자리 인증번호 |
| purpose | VARCHAR(30) | | N | 사용 목적 (join / find-id / reset-password) |
| expires_at | DATETIME | | N | 만료 일시 (발송 시각 +5분) |
| used | BOOLEAN | | Y | 사용 여부 (기본값: false) |
| created_at | DATETIME | | Y | 생성 일시 |

---

### products ✅

EASE FIT에서 판매하는 상품의 기본 정보를 관리. 상품 코드(EF001~EF012)를 기준으로 상세 페이지가 구분됨.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 상품 고유 ID |
| code | VARCHAR(20) | UNIQUE | N | 상품 코드 (예: EF001) |
| name | VARCHAR(100) | | N | 상품명 |
| price | INT | | N | 판매가 (원) |
| model_info | VARCHAR(100) | | Y | 대표 모델 정보 (예: 키 168cm, M 착용) |
| default_color | VARCHAR(30) | | Y | 기본 선택 컬러 키 |
| default_size | VARCHAR(10) | | Y | 기본 선택 사이즈 |
| created_at | DATETIME | | N | 등록 일시 |

---

### product_colors ✅

상품별 컬러 옵션을 관리. 컬러 스와치(색상 코드)와 표시 순서를 함께 저장.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 컬러 옵션 고유 ID |
| product_id | UUID | FK | N | 상품 ID (→ products.id) |
| color_key | VARCHAR(30) | | N | 컬러 식별 키 (예: black, ivory) |
| color_name | VARCHAR(30) | | N | 컬러 표시명 (예: 블랙, 아이보리) |
| swatch | VARCHAR(20) | | N | 컬러 스와치 (HEX 코드 또는 이미지 경로) |
| display_order | SMALLINT | | Y | 컬러 목록 표시 순서 |

> **제약:** product_id + color_key 조합은 UNIQUE

---

### product_images ✅

컬러별 상품 이미지를 관리. 동일 컬러에 여러 장의 이미지(메인 + 썸네일)를 순서대로 등록.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 이미지 고유 ID |
| color_id | UUID | FK | N | 컬러 옵션 ID (→ product_colors.id) |
| image_path | TEXT | | N | 이미지 파일 경로 또는 URL |
| display_order | SMALLINT | | Y | 이미지 표시 순서 (0이 메인 이미지) |

---

### product_sizes ✅

전 상품 공통으로 적용되는 사이즈별 실측 정보를 관리. XS~3XL의 가슴·어깨·기장 수치를 포함.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| size | VARCHAR(5) | PK | N | 사이즈 명칭 (XS / S / M / L / XL / 2XL / 3XL) |
| chest | VARCHAR(20) | | Y | 가슴 실측 (예: 90~95cm) |
| shoulder | VARCHAR(20) | | Y | 어깨 실측 (예: 38~40cm) |
| length | VARCHAR(20) | | Y | 기장 실측 (예: 58~60cm) |
| fit_desc | TEXT | | Y | 해당 사이즈 핏 설명 |
| display_order | SMALLINT | | Y | 사이즈 표시 순서 |

---

### product_variants ✅

상품·컬러·사이즈의 조합별 재고 상태를 관리. 재고 없는 사이즈는 상세 페이지에서 비활성화로 표시.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 재고 항목 고유 ID |
| product_id | UUID | FK | N | 상품 ID (→ products.id) |
| color_id | UUID | FK | N | 컬러 옵션 ID (→ product_colors.id) |
| size | VARCHAR(5) | | N | 사이즈 (XS~3XL) |
| in_stock | BOOLEAN | | Y | 재고 여부 (기본값: true) |

> **제약:** product_id + color_id + size 조합은 UNIQUE

---

### cart_items ✅

장바구니에 담긴 상품 항목을 관리. 비회원도 세션 ID를 기준으로 장바구니를 이용할 수 있도록 설계.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 장바구니 항목 고유 ID |
| session_id | VARCHAR(36) | | N | 사용자 세션 UUID (비회원 포함) |
| product_id | VARCHAR(20) | | N | 상품 코드 |
| product_name | VARCHAR(100) | | N | 상품명 (스냅샷 저장) |
| brand | VARCHAR(30) | | Y | 브랜드명 (기본값: EASE FIT) |
| color | VARCHAR(30) | | Y | 선택한 컬러 |
| size | VARCHAR(10) | | Y | 선택한 사이즈 |
| quantity | INT | | Y | 수량 (기본값: 1) |
| price | INT | | Y | 단가 (스냅샷 저장) |
| image | TEXT | | Y | 상품 이미지 경로 |
| url | TEXT | | Y | 상품 상세 페이지 URL |
| created_at | DATETIME | | Y | 담은 일시 |

> **제약:** session_id + product_id + color + size 조합은 UNIQUE (동일 옵션 중복 담기 방지)

---

### wishlist_items ✅

위시리스트(찜)에 저장된 상품을 관리. 비회원도 세션 ID 기준으로 이용 가능.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 위시리스트 항목 고유 ID |
| session_id | VARCHAR(36) | | N | 사용자 세션 UUID |
| product_id | VARCHAR(20) | | N | 상품 코드 |
| product_name | VARCHAR(100) | | Y | 상품명 |
| category | VARCHAR(30) | | Y | 카테고리 |
| price | VARCHAR(20) | | Y | 판매가 (표시용 문자열) |
| original_price | VARCHAR(20) | | Y | 정가 (표시용 문자열) |
| discount | VARCHAR(10) | | Y | 할인율 (예: 20%) |
| image | TEXT | | Y | 대표 이미지 경로 |
| colors | JSON | | Y | 사용 가능한 컬러 목록 |
| sizes | VARCHAR(30) | | Y | 사용 가능한 사이즈 범위 (예: XS-3XL) |
| created_at | DATETIME | | Y | 담은 일시 |

---

### recent_views 📋

사용자가 최근에 조회한 상품 이력을 관리. 현재는 localStorage로 구현되어 있으며, 실제 서비스에서는 DB 기반으로 전환.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 조회 기록 고유 ID |
| session_id | VARCHAR(36) | | N | 사용자 세션 UUID |
| product_id | VARCHAR(20) | FK | N | 조회한 상품 코드 (→ products.code) |
| product_name | VARCHAR(100) | | Y | 상품명 (스냅샷) |
| image | TEXT | | Y | 대표 이미지 경로 |
| viewed_at | DATETIME | | N | 조회 일시 |

> 동일 사용자가 같은 상품을 다시 조회하면 viewed_at만 갱신 (UPSERT 처리)

---

### product_measurements 📋

상품별 사이즈 실측 상세 정보를 관리. 현재 공통 테이블(product_sizes)로 운영 중이나, 상품마다 다른 실측값을 관리하기 위해 상품별로 분리.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 실측 정보 고유 ID |
| product_id | UUID | FK | N | 상품 ID (→ products.id) |
| size | VARCHAR(5) | | N | 사이즈 (XS~3XL) |
| chest | VARCHAR(20) | | Y | 가슴 실측 수치 |
| shoulder | VARCHAR(20) | | Y | 어깨 실측 수치 |
| length | VARCHAR(20) | | Y | 기장 실측 수치 |
| sleeve | VARCHAR(20) | | Y | 소매 실측 수치 (해당 상품 적용 시) |
| display_order | SMALLINT | | Y | 사이즈 표시 순서 |

---

### product_fit_guides 📋

사이즈별 핏 유형과 착용 추천 설명을 관리. 같은 사이즈라도 상품마다 핏 특성이 다를 수 있어 상품별로 관리.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 핏 가이드 고유 ID |
| product_id | UUID | FK | N | 상품 ID (→ products.id) |
| size | VARCHAR(5) | | N | 사이즈 (XS~3XL) |
| fit_type | VARCHAR(20) | | Y | 핏 유형 (slim / regular / loose) |
| fit_desc | TEXT | | Y | 핏 설명 (예: 슬림하게 착용 시 M 추천) |
| recommend_body | VARCHAR(100) | | Y | 추천 체형 설명 |

---

### product_model_fits 📋

실제 모델이 해당 상품을 착용한 피팅 정보를 관리. EASE FIT의 핵심 UX인 체형별 착용 가이드를 제공하기 위한 테이블.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 모델 피팅 정보 고유 ID |
| product_id | UUID | FK | N | 상품 ID (→ products.id) |
| size_label | VARCHAR(10) | | N | 착용 사이즈 (예: M) |
| model_height | INT | | N | 모델 키 (cm) |
| wearing_size | VARCHAR(10) | | N | 실제 착용 사이즈 |
| body_type_tag | VARCHAR(50) | | Y | 체형 태그 (예: 상체 보통 / 하체 발달) |
| image_url | TEXT | | Y | 착용 이미지 URL |
| fit_comment | TEXT | | Y | 착용 코멘트 (예: 키 170cm 기준 기장이 적당함) |
| display_order | SMALLINT | | Y | 표시 순서 |

> **설계 원칙:** 몸무게 정보는 민감 개인정보에 해당하므로 컬럼에서 제외. 키·착용 사이즈·체형 태그 중심으로 구성.

---

### orders 📋

회원의 주문 기본 정보를 관리. 주문 상태에 따라 배송 추적 등의 기능과 연동 가능.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 주문 고유 ID |
| user_id | UUID | FK | N | 주문한 회원 ID (→ users.id) |
| total_price | INT | | N | 결제 총액 |
| shipping_address | TEXT | | N | 배송지 도로명 주소 |
| shipping_detail | VARCHAR(200) | | Y | 배송지 상세 주소 |
| status | VARCHAR(20) | | N | 주문 상태 (pending / paid / shipping / delivered / cancelled) |
| is_first_order | BOOLEAN | | Y | 첫 주문 여부 (First Fitting 반품 자격 기준) |
| created_at | DATETIME | | N | 주문 일시 |

---

### order_items 📋

주문에 포함된 개별 상품 항목을 관리. 주문 시점의 가격과 옵션을 스냅샷으로 저장.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 주문 항목 고유 ID |
| order_id | UUID | FK | N | 주문 ID (→ orders.id) |
| product_id | UUID | FK | N | 상품 ID (→ products.id) |
| product_name | VARCHAR(100) | | N | 상품명 (주문 시점 스냅샷) |
| color | VARCHAR(30) | | Y | 선택한 컬러 |
| size | VARCHAR(10) | | Y | 선택한 사이즈 |
| quantity | INT | | N | 수량 |
| unit_price | INT | | N | 단가 (주문 시점 스냅샷) |

---

### first_fitting_returns 📋

첫 주문 고객 대상 1회 무료 반품(First Fitting Service) 신청 및 처리 이력을 관리.

| 컬럼명 | 데이터 타입 | 키 | NULL | 설명 |
|---|---|---|---|---|
| id | UUID | PK | N | 반품 신청 고유 ID |
| user_id | UUID | FK | N | 신청 회원 ID (→ users.id) |
| order_id | UUID | FK | N | 대상 주문 ID (→ orders.id) |
| reason | TEXT | | Y | 반품 사유 (사이즈 불일치 등) |
| status | VARCHAR(20) | | N | 처리 상태 (requested / approved / completed / rejected) |
| requested_at | DATETIME | | N | 신청 일시 |
| processed_at | DATETIME | | Y | 처리 완료 일시 |

---

## 4. 테이블 관계

```
users (1)
  ├─ (1:N) social_accounts     소셜 로그인 연동 정보
  ├─ (1:N) orders              회원의 주문 내역
  └─ (1:N) first_fitting_returns  무료 반품 신청 내역

orders (1)
  ├─ (1:N) order_items         주문 상품 항목
  └─ (0:1) first_fitting_returns  첫 주문 무료 반품 (회원당 1회)

products (1)
  ├─ (1:N) product_colors      컬러 옵션
  │    └─ (1:N) product_images    컬러별 이미지
  ├─ (1:N) product_variants    컬러×사이즈 재고 현황
  ├─ (1:N) product_measurements   상품별 사이즈 실측 정보
  ├─ (1:N) product_fit_guides  사이즈별 핏 설명
  └─ (1:N) product_model_fits  모델 착용 피팅 가이드

[독립 테이블 — session_id 기반]
cart_items       장바구니 (회원/비회원 공통)
wishlist_items   위시리스트 (회원/비회원 공통)
recent_views     최근 본 상품

[독립 테이블]
product_sizes    공통 사이즈 실측 정보
verification_codes  SMS 인증번호 임시 저장
```

**주요 관계 설명**

- 회원(users) 1명은 여러 소셜 계정(social_accounts)을 연동할 수 있다.
- 상품(products) 1개는 여러 컬러(product_colors)를 가질 수 있고, 각 컬러는 여러 이미지(product_images)를 가진다.
- 재고(product_variants)는 상품·컬러·사이즈의 조합 단위로 관리된다.
- 장바구니(cart_items)와 위시리스트(wishlist_items)는 로그인 여부와 무관하게 session_id를 기준으로 동작한다.
- 주문(orders)은 회원만 생성할 수 있으며, 주문 항목(order_items)과 1:N 관계다.
- First Fitting 무료 반품(first_fitting_returns)은 회원의 첫 주문에 한해 1회만 신청 가능하다.
- 모델 피팅 정보(product_model_fits)는 키와 착용 사이즈, 체형 태그를 기반으로 고객이 자신과 유사한 체형의 착용 결과를 참고할 수 있도록 설계되었다.

---

## 5. localStorage와 DB 매핑

현재 EASE FIT 프론트엔드에서 브라우저 저장소로 임시 관리 중인 데이터와 실제 서비스 DB 테이블 간의 매핑 관계를 정리한다.

| localStorage / sessionStorage 키 | 현재 저장 내용 | 실제 서비스 DB 테이블 |
|---|---|---|
| `easefit_session_id` | 비회원 세션 UUID | cart_items, wishlist_items의 session_id 컬럼 |
| `easefit_user` (sessionStorage) | 로그인 회원 정보 (id, 이름, 아이디) | users 테이블 조회로 대체 |
| `easefit_recent_views` | 최근 본 상품 목록 (상품코드, 이름, 이미지) | recent_views 테이블 |
| `easefit_saved_id` | 아이디 저장 체크 시 로그인 아이디 | 클라이언트 유지 (DB 불필요) |
| 장바구니 데이터 | 이미 Supabase cart_items로 전환 완료 | cart_items ✅ |
| 위시리스트 데이터 | 이미 Supabase wishlist_items로 전환 완료 | wishlist_items ✅ |
| 선택한 컬러 / 사이즈 | 상세 페이지 선택 상태 (페이지 내 변수) | order_items.color, order_items.size (주문 시점에 저장) |

---

## 6. EASE FIT 특화 데이터 구조

EASE FIT은 핏 중심 쇼핑몰로, 일반 쇼핑몰에는 없는 아래 데이터 구조가 차별화 포인트다.

### 6-1. 핏 데이터 흐름

```
고객이 상품 상세 페이지 접근
  → product_sizes     사이즈별 실측 수치 확인 (가슴·어깨·기장)
  → product_fit_guides  해당 사이즈 핏 유형 확인 (슬림 / 레귤러 / 루즈)
  → product_model_fits  비슷한 키·체형 모델의 착용 이미지 및 코멘트 확인
  → 사이즈 선택 → 장바구니 또는 바로 구매
```

### 6-2. product_model_fits 설계 의도

| 항목 | 내용 |
|---|---|
| 목적 | 키와 체형 태그 기준으로 고객이 자신과 유사한 착용 결과를 확인할 수 있도록 지원 |
| 민감정보 처리 | 몸무게는 저장하지 않음. 키·착용사이즈·체형 태그 중심으로 구성 |
| 체형 태그 예시 | 상체 보통 / 하체 발달 / 어깨 넓음 / 슬림 / 보통 체형 등 |
| 활용 방식 | 상세 페이지 내 '체형별 착용컷' 섹션에서 필터 기반으로 노출 |

### 6-3. First Fitting Service 데이터 구조

| 항목 | 내용 |
|---|---|
| 대상 | 첫 주문 회원 (orders.is_first_order = true) |
| 적용 조건 | 회원 계정 기준 1회, 첫 번째 주문에만 적용 |
| 반품 사유 | 사이즈 불일치 중심 (핏이 맞지 않음) |
| 이력 관리 | first_fitting_returns 테이블에 신청~처리 전 과정 기록 |

---

## 7. 정리

EASE FIT의 데이터베이스는 크게 세 영역으로 구분할 수 있다.

**① 회원 및 인증 영역**
users, social_accounts, verification_codes로 구성. 일반 로그인과 카카오·네이버 소셜 로그인을 모두 지원하며, SMS 인증 기반 본인 확인 흐름을 관리한다.

**② 상품 및 핏 정보 영역**
products를 중심으로 product_colors, product_images, product_variants, product_sizes, product_measurements, product_fit_guides, product_model_fits가 연결된다. 일반 쇼핑몰과 달리 사이즈 실측, 핏 유형, 모델 착용 피팅 정보까지 관리하는 것이 EASE FIT의 데이터 구조적 특징이다.

**③ 고객 활동 영역**
cart_items, wishlist_items, recent_views, orders, order_items, first_fitting_returns로 구성. 비회원도 장바구니와 위시리스트를 이용할 수 있도록 session_id 기반 구조를 채택하였으며, 첫 주문 무료 반품(First Fitting Service)은 별도 테이블로 이력을 관리한다.

현재 구현 완료된 테이블은 10개이며, 향후 주문·결제·핏 가이드 기능 구현 시 7개 테이블이 추가될 예정이다.

| 구분 | 테이블 수 |
|---|---|
| ✅ 구현 완료 | 10개 |
| 📋 설계 (구현 예정) | 7개 |
| **합계** | **17개** |
