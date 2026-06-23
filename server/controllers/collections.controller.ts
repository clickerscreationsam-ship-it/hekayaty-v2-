import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env['SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? ''
);

export const createCollection = async (req: any, res: any) => {
    try {
        const { title, slug, label, description, collectionType, coverImageUrl, bannerImageUrl, price, originalTotalPrice, discountPercentage, isPublished, status, visibility, startDate, endDate, bookIds } = req.body;
        
        // 1. Create collection
        const writerId = req.user?.id || null;
        const { data: collection, error: collectionError } = await supabaseAdmin
            .from('collections')
            .insert({
                writer_id: writerId, // Admin creating it
                title,
                slug,
                label: label || null,
                description,
                collection_type: collectionType,
                cover_image_url: coverImageUrl,
                banner_image_url: bannerImageUrl,
                price,
                original_total_price: originalTotalPrice,
                discount_percentage: discountPercentage,
                is_published: isPublished,
                status,
                visibility,
                start_date: startDate,
                end_date: endDate,
                estimated_total_parts: bookIds?.length || 0
            })
            .select()
            .single();

        if (collectionError) throw collectionError;

        // 2. Fetch books to snapshot their prices
        if (bookIds && bookIds.length > 0) {
            const { data: books } = await supabaseAdmin
                .from('products')
                .select('id, price')
                .in('id', bookIds);

            if (books && books.length > 0) {
                const itemsToInsert = books.map((book: any, index: number) => ({
                    collection_id: collection.id,
                    story_id: book.id,
                    snapshot_price: book.price || 0,
                    order_index: index
                }));

                const { error: itemsError } = await supabaseAdmin
                    .from('collection_items')
                    .insert(itemsToInsert);

                if (itemsError) throw itemsError;
            }
        }

        return res.status(201).json({ success: true, collection });

    } catch (error: any) {
        console.error('Error creating collection:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const updateCollection = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // In a real app, you'd map camelCase to snake_case for Supabase
        const dbUpdates: any = {};
        if (updates.label !== undefined) dbUpdates.label = updates.label || null;
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.collectionType !== undefined) dbUpdates.collection_type = updates.collectionType;
        if (updates.coverImageUrl !== undefined) dbUpdates.cover_image_url = updates.coverImageUrl;
        if (updates.bannerImageUrl !== undefined) dbUpdates.banner_image_url = updates.bannerImageUrl;
        if (updates.price !== undefined) dbUpdates.price = updates.price;
        if (updates.originalTotalPrice !== undefined) dbUpdates.original_total_price = updates.originalTotalPrice;
        if (updates.discountPercentage !== undefined) dbUpdates.discount_percentage = updates.discountPercentage;
        if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
        if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
        if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;

        const { data: collection, error } = await supabaseAdmin
            .from('collections')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return res.status(200).json({ success: true, collection });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getAdminCollections = async (req: any, res: any) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('collections')
            .select('*, items:collection_items(count)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getPublicCollections = async (req: any, res: any) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('collections')
            .select('*')
            .eq('is_published', true)
            .eq('visibility', 'public')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getCollectionBySlug = async (req: any, res: any) => {
    try {
        const { slug } = req.params;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

        let query = supabaseAdmin
            .from('collections')
            .select(`
                *,
                items:collection_items(
                    id,
                    snapshot_price,
                    order_index,
                    story_id,
                    product:products!story_id(*)
                )
            `);
            
        if (isUUID) {
            query = query.eq('id', slug);
        } else {
            query = query.eq('slug', slug);
        }

        const { data: collection, error } = await query.single();

        if (error || !collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        
        // Sort items if present
        if (collection.items && Array.isArray(collection.items)) {
            collection.items.sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));
        } else {
            collection.items = [];
        }

        return res.status(200).json(collection);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteCollection = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        
        const { error } = await supabaseAdmin
            .from('collections')
            .delete()
            .eq('id', id);

        if (error) throw error;
        
        return res.status(200).json({ success: true, message: 'Collection deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
