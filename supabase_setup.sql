-- ================================================================
-- EASE FIT — Supabase DB 재구축 스크립트
-- Supabase SQL Editor에 전체 붙여넣기 후 RUN 클릭
-- ================================================================

-- ── 기존 테이블·함수 삭제 (초기화) ─────────────────────────────
DROP TABLE IF EXISTS product_images   CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_colors   CASCADE;
DROP TABLE IF EXISTS product_sizes    CASCADE;
DROP TABLE IF EXISTS products         CASCADE;
DROP TABLE IF EXISTS wishlist_items   CASCADE;
DROP TABLE IF EXISTS cart_items       CASCADE;
DROP TABLE IF EXISTS orders           CASCADE;
DROP TABLE IF EXISTS users            CASCADE;

DROP FUNCTION IF EXISTS fn_login(TEXT, TEXT);
DROP FUNCTION IF EXISTS fn_check_login_id(TEXT);
DROP FUNCTION IF EXISTS fn_check_phone(TEXT);
DROP FUNCTION IF EXISTS fn_check_email(TEXT);
DROP FUNCTION IF EXISTS fn_find_login_id(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS fn_verify_user(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS fn_reset_password(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS fn_get_order_status_counts(UUID);
DROP FUNCTION IF EXISTS fn_get_mypage_summary(UUID, TEXT);

-- ================================================================
-- 테이블 생성
-- ================================================================

-- 1. users
CREATE TABLE users (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id         TEXT        NOT NULL UNIQUE,
  password         TEXT        NOT NULL,
  name             TEXT        NOT NULL,
  email            TEXT        NOT NULL UNIQUE,
  phone            TEXT        NOT NULL UNIQUE,
  address          TEXT        NOT NULL DEFAULT '',
  address_detail   TEXT        NOT NULL DEFAULT '',
  info_agree       BOOLEAN     NOT NULL DEFAULT false,
  marketing_agree  BOOLEAN     NOT NULL DEFAULT false,
  status           TEXT        NOT NULL DEFAULT 'active',
  points           INTEGER     NOT NULL DEFAULT 0,
  coupons          INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. orders (마이페이지 주문 현황용)
CREATE TABLE orders (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  status     TEXT        NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. cart_items
CREATE TABLE cart_items (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   TEXT        NOT NULL,
  product_id   TEXT        NOT NULL,
  product_name TEXT        NOT NULL DEFAULT '',
  brand        TEXT        NOT NULL DEFAULT 'EASE FIT',
  color        TEXT        NOT NULL DEFAULT '',
  size         TEXT        NOT NULL DEFAULT '',
  quantity     INTEGER     NOT NULL DEFAULT 1,
  price        TEXT        NOT NULL DEFAULT '',
  image        TEXT        NOT NULL DEFAULT '',
  url          TEXT        NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. wishlist_items
CREATE TABLE wishlist_items (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     TEXT        NOT NULL,
  product_id     TEXT        NOT NULL,
  product_name   TEXT        NOT NULL DEFAULT '',
  category       TEXT        NOT NULL DEFAULT 'EASE FIT',
  price          TEXT        NOT NULL DEFAULT '',
  original_price TEXT        NOT NULL DEFAULT '',
  discount       TEXT        NOT NULL DEFAULT '',
  image          TEXT        NOT NULL DEFAULT '',
  colors         JSONB       NOT NULL DEFAULT '[]',
  sizes          TEXT        NOT NULL DEFAULT 'XS-3XL',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. products
CREATE TABLE products (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT        NOT NULL UNIQUE,
  name          TEXT        NOT NULL,
  price         INTEGER     NOT NULL,
  model_info    TEXT        NOT NULL DEFAULT '',
  default_color TEXT        NOT NULL DEFAULT '',
  default_size  TEXT        NOT NULL DEFAULT 'M',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. product_colors
CREATE TABLE product_colors (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_key     TEXT    NOT NULL,
  color_name    TEXT    NOT NULL,
  swatch        TEXT    NOT NULL DEFAULT '#000000',
  display_order INTEGER NOT NULL DEFAULT 0
);

-- 7. product_images
CREATE TABLE product_images (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  color_id      UUID    NOT NULL REFERENCES product_colors(id) ON DELETE CASCADE,
  image_path    TEXT    NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- 8. product_variants
CREATE TABLE product_variants (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size       TEXT    NOT NULL,
  in_stock   BOOLEAN NOT NULL DEFAULT true
);

-- 9. product_sizes (공통 사이즈 실측표)
CREATE TABLE product_sizes (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  size          TEXT    NOT NULL UNIQUE,
  chest         TEXT    NOT NULL DEFAULT '',
  shoulder      TEXT    NOT NULL DEFAULT '',
  length        TEXT    NOT NULL DEFAULT '',
  fit_desc      TEXT    NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);

-- ================================================================
-- RLS (Row Level Security)
-- ================================================================

ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_colors   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes    ENABLE ROW LEVEL SECURITY;

-- users: anon은 INSERT만 허용 (SELECT/UPDATE는 SECURITY DEFINER 함수로만)
CREATE POLICY "users_insert" ON users FOR INSERT TO anon WITH CHECK (status = 'active');

-- cart_items
CREATE POLICY "cart_select" ON cart_items FOR SELECT TO anon USING (true);
CREATE POLICY "cart_insert" ON cart_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "cart_delete" ON cart_items FOR DELETE TO anon USING (true);

-- wishlist_items
CREATE POLICY "wishlist_select" ON wishlist_items FOR SELECT TO anon USING (true);
CREATE POLICY "wishlist_insert" ON wishlist_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "wishlist_delete" ON wishlist_items FOR DELETE TO anon USING (true);

-- 상품 테이블: 읽기 전용
CREATE POLICY "products_select"         ON products         FOR SELECT TO anon USING (true);
CREATE POLICY "product_colors_select"   ON product_colors   FOR SELECT TO anon USING (true);
CREATE POLICY "product_images_select"   ON product_images   FOR SELECT TO anon USING (true);
CREATE POLICY "product_variants_select" ON product_variants FOR SELECT TO anon USING (true);
CREATE POLICY "product_sizes_select"    ON product_sizes    FOR SELECT TO anon USING (true);

-- ================================================================
-- RPC Functions
-- ================================================================

-- 로그인
CREATE OR REPLACE FUNCTION fn_login(p_id TEXT, p_password TEXT)
RETURNS TABLE(user_id UUID, login_id TEXT, name TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.login_id, u.name
  FROM users u
  WHERE u.login_id = p_id
    AND u.password  = p_password
    AND u.status    = 'active';
END;
$$;

-- 아이디 중복확인 (true = 사용 가능)
CREATE OR REPLACE FUNCTION fn_check_login_id(p_login_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM users WHERE login_id = p_login_id);
END;
$$;

-- 휴대폰 중복확인 (true = 사용 가능)
CREATE OR REPLACE FUNCTION fn_check_phone(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM users WHERE phone = p_phone);
END;
$$;

-- 이메일 중복확인 (true = 사용 가능)
CREATE OR REPLACE FUNCTION fn_check_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM users WHERE email = p_email);
END;
$$;

-- 아이디 찾기
CREATE OR REPLACE FUNCTION fn_find_login_id(p_name TEXT, p_phone TEXT, p_email TEXT)
RETURNS TABLE(login_id TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT u.login_id FROM users u
  WHERE u.name = p_name
    AND (
      (p_phone <> '' AND u.phone = p_phone) OR
      (p_email <> '' AND u.email = p_email)
    )
    AND u.status = 'active';
END;
$$;

-- 본인 확인 (비밀번호 재설정 1단계)
CREATE OR REPLACE FUNCTION fn_verify_user(p_login_id TEXT, p_name TEXT, p_phone TEXT, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE login_id = p_login_id
      AND name     = p_name
      AND (
        (p_phone <> '' AND phone = p_phone) OR
        (p_email <> '' AND email = p_email)
      )
      AND status = 'active'
  );
END;
$$;

-- 비밀번호 재설정
CREATE OR REPLACE FUNCTION fn_reset_password(
  p_login_id TEXT, p_name TEXT, p_phone TEXT, p_email TEXT, p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE users
  SET password = p_new_password
  WHERE login_id = p_login_id
    AND name     = p_name
    AND (
      (p_phone <> '' AND phone = p_phone) OR
      (p_email <> '' AND email = p_email)
    )
    AND status = 'active';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

-- 마이페이지 주문 현황
CREATE OR REPLACE FUNCTION fn_get_order_status_counts(p_user_id UUID)
RETURNS TABLE(status TEXT, cnt BIGINT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT o.status, COUNT(*)::BIGINT
  FROM orders o
  WHERE o.user_id = p_user_id
  GROUP BY o.status;
END;
$$;

-- 마이페이지 요약 (포인트·쿠폰·리뷰·위시리스트)
CREATE OR REPLACE FUNCTION fn_get_mypage_summary(p_user_id UUID, p_session_id TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_points   INTEGER;
  v_coupons  INTEGER;
  v_wishlist BIGINT;
BEGIN
  SELECT u.points, u.coupons INTO v_points, v_coupons
  FROM users u WHERE u.id = p_user_id;

  SELECT COUNT(*) INTO v_wishlist
  FROM wishlist_items WHERE session_id = p_session_id;

  RETURN json_build_object(
    'points',   COALESCE(v_points,  0),
    'coupons',  COALESCE(v_coupons, 0),
    'reviews',  0,
    'wishlist', COALESCE(v_wishlist, 0)
  );
END;
$$;

-- ================================================================
-- 상품 데이터 삽입 (EF001 ~ EF012)
-- ================================================================

DO $$
DECLARE
  pid UUID;
  cid UUID;
BEGIN

  -- ─── EF001 워싱 루즈핏 데님 팬츠 ───────────────────────────────
  INSERT INTO products (code, name, price, model_info, default_color, default_size)
  VALUES ('EF001', '워싱 루즈핏 데님 팬츠', 15900, '키 165cm · M 착용', 'ivory', 'M')
  RETURNING id INTO pid;

  INSERT INTO product_variants (product_id, size, in_stock) VALUES
    (pid,'XS',true),(pid,'S',true),(pid,'M',true),(pid,'L',true),
    (pid,'XL',true),(pid,'2XL',true),(pid,'3XL',true);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'ivory','아이보리','#e7e3dd',0) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content1/product1/SHOT_26_004 (1).jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'red','레드','#f43a3d',1) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content1/product1/SHOT_26_004 (1).jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'black','블랙','#0f0d0d',2) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content1/product1/SHOT_26_004 (1).jpeg',0);

  -- ─── EF002 프론트 슬릿 데님 롱스커트 ──────────────────────────
  INSERT INTO products (code, name, price, model_info, default_color, default_size)
  VALUES ('EF002', '프론트 슬릿 데님 롱스커트', 29900, '키 165cm · M 착용', 'denim', 'M')
  RETURNING id INTO pid;

  INSERT INTO product_variants (product_id, size, in_stock) VALUES
    (pid,'XS',true),(pid,'S',true),(pid,'M',true),(pid,'L',true),
    (pid,'XL',true),(pid,'2XL',true),(pid,'3XL',true);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'denim','데님','#87a8c6',0) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content1/product2/SHOT_56_1906.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'gray','그레이','#b8b8b4',1) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content1/product2/SHOT_56_1906.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'black','블랙','#0f0d0d',2) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content1/product2/SHOT_56_1906.jpeg',0);

  -- ─── EF003 딥블루 와이드 밴딩 팬츠 ────────────────────────────
  INSERT INTO products (code, name, price, model_info, default_color, default_size)
  VALUES ('EF003', '딥블루 와이드 밴딩 팬츠', 32900, '키 165cm · M 착용', 'blue', 'M')
  RETURNING id INTO pid;

  INSERT INTO product_variants (product_id, size, in_stock) VALUES
    (pid,'XS',true),(pid,'S',true),(pid,'M',true),(pid,'L',true),
    (pid,'XL',true),(pid,'2XL',true),(pid,'3XL',true);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'white','화이트','#ffffff',0) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content1/product3/Relaxed_Bootcut_Jeans_Anzio_Blue_USPA1886_904_001_008.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'blue','블루','#7496bd',1) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content1/product3/Relaxed_Bootcut_Jeans_Anzio_Blue_USPA1886_904_001_008.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'black','블랙','#0f0d0d',2) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content1/product3/Relaxed_Bootcut_Jeans_Anzio_Blue_USPA1886_904_001_008.jpeg',0);

  -- ─── EF004 베이직 브이넥 반팔 티셔츠 ──────────────────────────
  INSERT INTO products (code, name, price, model_info, default_color, default_size)
  VALUES ('EF004', '베이직 브이넥 반팔 티셔츠', 19900, '키 165cm · M 착용', 'black', 'M')
  RETURNING id INTO pid;

  INSERT INTO product_variants (product_id, size, in_stock) VALUES
    (pid,'XS',true),(pid,'S',true),(pid,'M',true),(pid,'L',true),
    (pid,'XL',true),(pid,'2XL',true),(pid,'3XL',true);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'white','화이트','#ffffff',0) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content1/product4/Ashley_V_Neck_Tee_Black_USTO0567V_001_001_013 (1).jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'pink','핑크','#edc2cf',1) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content1/product4/Ashley_V_Neck_Tee_Black_USTO0567V_001_001_013 (1).jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'black','블랙','#0f0d0d',2) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content1/product4/Ashley_V_Neck_Tee_Black_USTO0567V_001_001_013 (1).jpeg',0);

  -- ─── EF005 포켓 코튼 반팔 티셔츠 ──────────────────────────────
  INSERT INTO products (code, name, price, model_info, default_color, default_size)
  VALUES ('EF005', '포켓 코튼 반팔 티셔츠', 24900, '키 165cm · M 착용', 'white', 'M')
  RETURNING id INTO pid;

  INSERT INTO product_variants (product_id, size, in_stock) VALUES
    (pid,'XS',true),(pid,'S',true),(pid,'M',true),(pid,'L',true),
    (pid,'XL',true),(pid,'2XL',true),(pid,'3XL',true);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'white','화이트','#ffffff',0) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product5/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'gray','그레이','#b8b8b4',1) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product5/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'black','블랙','#0f0d0d',2) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product5/main.jpeg',0);

  -- ─── EF006 에션셜 와이드 코튼 팬츠 ────────────────────────────
  INSERT INTO products (code, name, price, model_info, default_color, default_size)
  VALUES ('EF006', '에션셜 와이드 코튼 팬츠', 39900, '키 165cm · M 착용', 'beige', 'M')
  RETURNING id INTO pid;

  INSERT INTO product_variants (product_id, size, in_stock) VALUES
    (pid,'XS',true),(pid,'S',true),(pid,'M',true),(pid,'L',true),
    (pid,'XL',true),(pid,'2XL',true),(pid,'3XL',true);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'beige','베이지','#c9b8a1',0) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product6/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'brown','브라운','#7b4e35',1) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product6/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'black','블랙','#0f0d0d',2) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product6/main.jpeg',0);

  -- ─── EF007 스트라이프 보트넥 탑 ────────────────────────────────
  INSERT INTO products (code, name, price, model_info, default_color, default_size)
  VALUES ('EF007', '스트라이프 보트넥 탑', 27900, '키 165cm · M 착용', 'ivory', 'M')
  RETURNING id INTO pid;

  INSERT INTO product_variants (product_id, size, in_stock) VALUES
    (pid,'XS',true),(pid,'S',true),(pid,'M',true),(pid,'L',true),
    (pid,'XL',true),(pid,'2XL',true),(pid,'3XL',true);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'ivory','아이보리','#e7e3dd',0) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product7/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'pink','핑크','#edc2cf',1) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product7/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'black','블랙','#0f0d0d',2) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product7/main.jpeg',0);

  -- ─── EF008 루즈핏 코튼 셔츠 ────────────────────────────────────
  INSERT INTO products (code, name, price, model_info, default_color, default_size)
  VALUES ('EF008', '루즈핏 코튼 셔츠', 34900, '키 165cm · M 착용', 'denim', 'M')
  RETURNING id INTO pid;

  INSERT INTO product_variants (product_id, size, in_stock) VALUES
    (pid,'XS',true),(pid,'S',true),(pid,'M',true),(pid,'L',true),
    (pid,'XL',true),(pid,'2XL',true),(pid,'3XL',true);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'denim','데님','#87a8c6',0) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product8/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'blue','블루','#7496bd',1) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product8/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'black','블랙','#0f0d0d',2) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product8/main.jpeg',0);

  -- ─── EF009 라이트 블루 반팔 셔츠 ───────────────────────────────
  INSERT INTO products (code, name, price, model_info, default_color, default_size)
  VALUES ('EF009', '라이트 블루 반팔 셔츠', 45900, '키 165cm · M 착용', 'blue', 'M')
  RETURNING id INTO pid;

  INSERT INTO product_variants (product_id, size, in_stock) VALUES
    (pid,'XS',true),(pid,'S',true),(pid,'M',true),(pid,'L',true),
    (pid,'XL',true),(pid,'2XL',true),(pid,'3XL',true);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'white','화이트','#ffffff',0) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product9/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'blue','블루','#7496bd',1) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product9/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'gray','그레이','#b8b8b4',2) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product9/main.jpeg',0);

  -- ─── EF010 슬리브리스 코튼 탑 ──────────────────────────────────
  INSERT INTO products (code, name, price, model_info, default_color, default_size)
  VALUES ('EF010', '슬리브리스 코튼 탑', 15900, '키 165cm · M 착용', 'white', 'M')
  RETURNING id INTO pid;

  INSERT INTO product_variants (product_id, size, in_stock) VALUES
    (pid,'XS',true),(pid,'S',true),(pid,'M',true),(pid,'L',true),
    (pid,'XL',true),(pid,'2XL',true),(pid,'3XL',true);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'white','화이트','#ffffff',0) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product10/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'red','레드','#f43a3d',1) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product10/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'black','블랙','#0f0d0d',2) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product10/main.jpeg',0);

  -- ─── EF011 스퀘어넥 롱슬리브 탑 ────────────────────────────────
  INSERT INTO products (code, name, price, model_info, default_color, default_size)
  VALUES ('EF011', '스퀘어넥 롱슬리브 탑', 31900, '키 165cm · M 착용', 'black', 'M')
  RETURNING id INTO pid;

  INSERT INTO product_variants (product_id, size, in_stock) VALUES
    (pid,'XS',true),(pid,'S',true),(pid,'M',true),(pid,'L',true),
    (pid,'XL',true),(pid,'2XL',true),(pid,'3XL',true);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'gray','그레이','#b8b8b4',0) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product11/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'beige','베이지','#c9b8a1',1) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product11/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'black','블랙','#0f0d0d',2) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product11/main.jpeg',0);

  -- ─── EF012 스트라이프 슬리브리스 니트 탑 ───────────────────────
  INSERT INTO products (code, name, price, model_info, default_color, default_size)
  VALUES ('EF012', '스트라이프 슬리브리스 니트 탑', 28900, '키 165cm · M 착용', 'ivory', 'M')
  RETURNING id INTO pid;

  INSERT INTO product_variants (product_id, size, in_stock) VALUES
    (pid,'XS',true),(pid,'S',true),(pid,'M',true),(pid,'L',true),
    (pid,'XL',true),(pid,'2XL',true),(pid,'3XL',true);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'ivory','아이보리','#e7e3dd',0) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product12/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'brown','브라운','#7b4e35',1) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product12/main.jpeg',0);

  INSERT INTO product_colors (product_id, color_key, color_name, swatch, display_order)
  VALUES (pid,'black','블랙','#0f0d0d',2) RETURNING id INTO cid;
  INSERT INTO product_images (color_id, image_path, display_order)
  VALUES (cid,'./img/main_content3/product12/main.jpeg',0);

END $$;

-- ================================================================
-- 사이즈 실측표 (공통)
-- ================================================================

INSERT INTO product_sizes (size, chest, shoulder, length, fit_desc, display_order) VALUES
  ('XS',  '80', '36', '55', '슬림하게 떨어지는 핏', 0),
  ('S',   '84', '38', '57', '슬림하게 떨어지는 핏', 1),
  ('M',   '88', '40', '59', '적당한 여유감의 레귤러 핏', 2),
  ('L',   '92', '42', '61', '여유있는 편안한 핏', 3),
  ('XL',  '96', '44', '63', '여유있는 편안한 핏', 4),
  ('2XL','100', '46', '65', '넉넉한 루즈핏', 5),
  ('3XL','104', '48', '67', '넉넉한 루즈핏', 6);
