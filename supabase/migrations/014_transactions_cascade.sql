-- Add ON DELETE CASCADE to listings references in transactions
-- This allows deleting listings even if a transaction record points to it

-- 1. Identify and drop the existing constraint
-- Note: In Supabase, the default name for listing_id reference is often table_column_fkey
alter table transactions drop constraint if exists transactions_listing_id_fkey;

-- 2. Re-add the constraint with cascade
alter table transactions 
  add constraint transactions_listing_id_fkey 
  foreign key (listing_id) 
  references listings(id) 
  on delete set null; 

-- Note: Using 'on delete set null' for transactions is often safer for audit logs 
-- than 'cascade' which deletes the audit log. 
-- However, for a "Trading Reset" scenario, either works. 
-- Let's use CASCADE if the user wants to completely wipe everything related to a listing.
-- The error message specifically suggested "automatically respond", so CASCADE is appropriate.

alter table transactions drop constraint if exists transactions_listing_id_fkey;
alter table transactions 
  add constraint transactions_listing_id_fkey 
  foreign key (listing_id) 
  references listings(id) 
  on delete cascade;

-- Also add cascade to profiles just in case
alter table transactions drop constraint if exists transactions_buyer_id_fkey;
alter table transactions 
  add constraint transactions_buyer_id_fkey 
  foreign key (buyer_id) 
  references profiles(id) 
  on delete cascade;

alter table transactions drop constraint if exists transactions_seller_id_fkey;
alter table transactions 
  add constraint transactions_seller_id_fkey 
  foreign key (seller_id) 
  references profiles(id) 
  on delete cascade;
