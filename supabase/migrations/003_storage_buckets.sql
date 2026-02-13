-- Create storage buckets for user content
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('store-banners', 'store-banners', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', true)
on conflict (id) do nothing;

-- Set up security policies for Avatars
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Users can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' );

-- Set up security policies for Store Banners
create policy "Store banners are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'store-banners' );

create policy "Anyone can upload a banner."
  on storage.objects for insert
  with check ( bucket_id = 'store-banners' );

create policy "Users can update their own banner."
  on storage.objects for update
  using ( bucket_id = 'store-banners' );

-- Set up security policies for Product Files
create policy "Product files are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'product-files' );

create policy "Anyone can upload a product file."
  on storage.objects for insert
  with check ( bucket_id = 'product-files' );
