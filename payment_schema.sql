-- Updated Database Schema for Payment and Enrollment Flow
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Courses table (if not exists)
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders table for pending/completed payments
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  paid_at TIMESTAMPTZ,
  -- Add indexes
  CONSTRAINT orders_reference_unique UNIQUE (reference)
);

-- User courses (enrollments) table
CREATE TABLE IF NOT EXISTS user_courses (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  paid BOOLEAN DEFAULT false NOT NULL,
  PRIMARY KEY (user_id, course_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders table
-- Users can select their own orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders (for status changes)
CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_courses table
-- Users can select their own enrollments
CREATE POLICY "Users can view their own enrollments" ON user_courses
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own enrollments
CREATE POLICY "Users can create their own enrollments" ON user_courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional: Allow users to update their own enrollments (for progress tracking)
CREATE POLICY "Users can update their own enrollments" ON user_courses
  FOR UPDATE USING (auth.uid() = user_id);