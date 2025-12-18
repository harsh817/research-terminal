/*
  # Reset Database and Create Custom Types

  1. Changes
    - Drop existing tables (news_items, tags, news_item_tags)
    - Create custom enum types for the new schema:
      - region_t: Geographic regions
      - market_t: Market categories
      - theme_t: News themes
  
  2. Notes
    - This migration removes the old schema to implement the new design
    - Enum types allow for structured, validated tagging
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS news_item_tags CASCADE;
DROP TABLE IF EXISTS news_items CASCADE;
DROP TABLE IF EXISTS tags CASCADE;

-- Create region enum type
DO $$ BEGIN
  CREATE TYPE region_t AS ENUM (
    'AMERICAS',
    'EUROPE',
    'ASIA_PACIFIC',
    'MIDDLE_EAST',
    'AFRICA',
    'GLOBAL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create market enum type
DO $$ BEGIN
  CREATE TYPE market_t AS ENUM (
    'EQUITIES',
    'FIXED_INCOME',
    'FX',
    'COMMODITIES',
    'CRYPTO',
    'DERIVATIVES',
    'CREDIT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create theme enum type
DO $$ BEGIN
  CREATE TYPE theme_t AS ENUM (
    'MONETARY_POLICY',
    'FISCAL_POLICY',
    'EARNINGS',
    'M_AND_A',
    'GEOPOLITICS',
    'REGULATION',
    'RISK_EVENT',
    'ECONOMIC_DATA',
    'CORPORATE_ACTION',
    'MARKET_STRUCTURE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;