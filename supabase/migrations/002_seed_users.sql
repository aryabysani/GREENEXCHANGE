-- ============================================================
-- GreenCredits — Bulk Create 31 Stall Accounts
-- Run this in Supabase SQL Editor AFTER 001_greencredits_schema.sql
--
-- Each stall has a unique password (see CREDENTIALS below)
-- ============================================================
--
-- ┌─────────────┬──────────────────┬─────────────────┐
-- │  Username   │   Stall Name     │    Password     │
-- ├─────────────┼──────────────────┼─────────────────┤
-- │ stall01     │ Food Court       │ Kp7mN2xQ        │
-- │ stall02     │ Gaming Zone      │ Lw9vB4jR        │
-- │ stall03     │ Merch Stall      │ Xz3hD6fT        │
-- │ stall04     │ Tech Demos       │ Mn8cG1yU        │
-- │ stall05     │ Art Gallery      │ Pq5sA9eW        │
-- │ stall06     │ Music Corner     │ Vy2tF7kI        │
-- │ stall07     │ Photo Booth      │ Rn4bH3mO        │
-- │ stall08     │ Smoothie Bar     │ Tj6wC8pL        │
-- │ stall09     │ Book Stall       │ Zk1xE5nS        │
-- │ stall10     │ Coding Club      │ Fb9mJ2qV        │
-- │ stall11     │ Robotics Club    │ Uc3vK7rD        │
-- │ stall12     │ Sports Zone      │ Gh5nL4wX        │
-- │ stall13     │ Drama Society    │ Wd8oM1tY        │
-- │ stall14     │ Debate Club      │ Iq2pN6cZ        │
-- │ stall15     │ Film Club        │ Ej7qO3sA        │
-- │ stall16     │ Dance Studio     │ Ak4rP8dB        │
-- │ stall17     │ Craft Workshop   │ Bl6sQ2eC        │
-- │ stall18     │ Bake Sale        │ Cm9tR5fD        │
-- │ stall19     │ Science Fair     │ Dn1uS7gE        │
-- │ stall20     │ Quiz Corner      │ Eo3vT4hF        │
-- │ stall21     │ Photography Club │ Fp5wU6iG        │
-- │ stall22     │ Design Lab       │ Gq7xV8jH        │
-- │ stall23     │ Finance Club     │ Hr2yW1kI        │
-- │ stall24     │ Marketing Cell   │ Is4zX9lJ        │
-- │ stall25     │ Startup Hub      │ Jt6aY3mK        │
-- │ stall26     │ Wellness Corner  │ Ku8bZ5nL        │
-- │ stall27     │ Cultural Society │ Lv1cA7oM        │
-- │ stall28     │ Environment Club │ Mw3dB2pN        │
-- │ stall29     │ Astronomy Club   │ Nx5eC4qO        │
-- │ stall30     │ Innovation Lab   │ Oy7fD6rP        │
-- │ stall31     │ Admin Stall      │ Pz9gE8sQ        │
-- └─────────────┴──────────────────┴─────────────────┘
-- ============================================================

DO $$
DECLARE
  r    RECORD;
  uid  uuid;
BEGIN
  FOR r IN
    SELECT *
    FROM (VALUES
      ('stall01@fest.com', 'Stall 01', 'Kp7mN2xQ'),
      ('stall02@fest.com', 'Stall 02', 'Lw9vB4jR'),
      ('stall03@fest.com', 'Stall 03', 'Xz3hD6fT'),
      ('stall04@fest.com', 'Stall 04', 'Mn8cG1yU'),
      ('stall05@fest.com', 'Stall 05', 'Pq5sA9eW'),
      ('stall06@fest.com', 'Stall 06', 'Vy2tF7kI'),
      ('stall07@fest.com', 'Stall 07', 'Rn4bH3mO'),
      ('stall08@fest.com', 'Stall 08', 'Tj6wC8pL'),
      ('stall09@fest.com', 'Stall 09', 'Zk1xE5nS'),
      ('stall10@fest.com', 'Stall 10', 'Fb9mJ2qV'),
      ('stall11@fest.com', 'Stall 11', 'Uc3vK7rD'),
      ('stall12@fest.com', 'Stall 12', 'Gh5nL4wX'),
      ('stall13@fest.com', 'Stall 13', 'Wd8oM1tY'),
      ('stall14@fest.com', 'Stall 14', 'Iq2pN6cZ'),
      ('stall15@fest.com', 'Stall 15', 'Ej7qO3sA'),
      ('stall16@fest.com', 'Stall 16', 'Ak4rP8dB'),
      ('stall17@fest.com', 'Stall 17', 'Bl6sQ2eC'),
      ('stall18@fest.com', 'Stall 18', 'Cm9tR5fD'),
      ('stall19@fest.com', 'Stall 19', 'Dn1uS7gE'),
      ('stall20@fest.com', 'Stall 20', 'Eo3vT4hF'),
      ('stall21@fest.com', 'Stall 21', 'Fp5wU6iG'),
      ('stall22@fest.com', 'Stall 22', 'Gq7xV8jH'),
      ('stall23@fest.com', 'Stall 23', 'Hr2yW1kI'),
      ('stall24@fest.com', 'Stall 24', 'Is4zX9lJ'),
      ('stall25@fest.com', 'Stall 25', 'Jt6aY3mK'),
      ('stall26@fest.com', 'Stall 26', 'Ku8bZ5nL'),
      ('stall27@fest.com', 'Stall 27', 'Lv1cA7oM'),
      ('stall28@fest.com', 'Stall 28', 'Mw3dB2pN'),
      ('stall29@fest.com', 'Stall 29', 'Nx5eC4qO'),
      ('stall30@fest.com', 'Stall 30', 'Oy7fD6rP'),
      ('stall31@fest.com', 'Stall 31', 'Pz9gE8sQ')
    ) AS t(email, stall_name, password)
  LOOP
    uid := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, aud, role
    ) VALUES (
      uid,
      '00000000-0000-0000-0000-000000000000',
      r.email,
      crypt(r.password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated'
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      uid,
      r.email,
      json_build_object('sub', uid::text, 'email', r.email),
      'email',
      now(), now(), now()
    );

    INSERT INTO public.profiles (id, stall_name, carbon_balance)
    VALUES (uid, r.stall_name, 100);

  END LOOP;
END $$;
