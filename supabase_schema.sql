-- ==================================================
-- Kyohansha Database Schema for Supabase
-- Run this in your Supabase SQL Editor
-- ==================================================

-- User profiles with karma and persona preference
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  karma INTEGER DEFAULT 0,
  selected_persona TEXT DEFAULT 'outlaw',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streak tracking
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  last_chat_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory (owned gacha items)
CREATE TABLE IF NOT EXISTS user_inventory (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Equipped skin
CREATE TABLE IF NOT EXISTS user_equipped (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  equipped_skin TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- Row Level Security (RLS)
-- ==================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipped ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- User Streaks Policies
CREATE POLICY "Users can view own streak" 
  ON user_streaks FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own streak" 
  ON user_streaks FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own streak" 
  ON user_streaks FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- User Inventory Policies
CREATE POLICY "Users can view own inventory" 
  ON user_inventory FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory" 
  ON user_inventory FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- User Equipped Policies
CREATE POLICY "Users can view own equipped" 
  ON user_equipped FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own equipped" 
  ON user_equipped FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own equipped" 
  ON user_equipped FOR INSERT 
  WITH CHECK (auth.uid() = id);
