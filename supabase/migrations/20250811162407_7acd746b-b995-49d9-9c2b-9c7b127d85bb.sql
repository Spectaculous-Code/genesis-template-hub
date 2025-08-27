-- Fix security issue with materialized view access

-- The issue is that materialized views are accessible via the API but don't respect RLS
-- Solution: Remove the materialized view from the API by revoking public access

-- 1. Revoke public access to the materialized view to remove it from the API
REVOKE ALL ON public.chapter_verses_mv FROM anon;
REVOKE ALL ON public.chapter_verses_mv FROM authenticated;

-- 2. Grant specific access only to the service role for internal operations
-- This ensures the materialized view is only accessible internally, not via the public API

-- 3. The chapter_verses_user_v view will still work because it's a regular view
-- that properly respects user permissions through the underlying tables

-- 4. Verify that our main access pattern (through chapter_verses_user_v) 
-- still works properly and respects user permissions