-- ============================================
-- Notification Triggers & Automatic Events
-- Migration: 038_notification_triggers.sql
-- ============================================

-- Function to handle chat mentions
CREATE OR REPLACE FUNCTION public.handle_chat_mention()
RETURNS TRIGGER AS $$
DECLARE
    mentioned_username TEXT;
    mentioned_user_id UUID;
    sender_name TEXT;
BEGIN
    -- Only process if message has @
    IF NEW.content ~ '@[a-zA-Z0-9_]+' THEN
        -- Get sender name
        SELECT display_name INTO sender_name FROM public.users WHERE id = NEW.sender_id;
        
        -- Find all matches for @username (this is a simplified version, it will only catch the first one for now)
        -- In a real app, you might loop through multiple mentions
        mentioned_username := (regexp_matches(NEW.content, '@([a-zA-Z0-9_]+)'))[1];
        
        -- Get the user ID for that username
        SELECT id INTO mentioned_user_id FROM public.users WHERE username = mentioned_username;
        
        -- If user exists and is not the sender, create a notification
        IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.sender_id THEN
            INSERT INTO public.notifications (user_id, actor_id, title, content, type, priority, link, metadata)
            VALUES (
                mentioned_user_id,
                NEW.sender_id,
                'You were mentioned',
                sender_name || ' mentioned you in chat: "' || LEFT(NEW.content, 50) || '..."',
                'social',
                'high',
                CASE WHEN NEW.store_id IS NULL THEN '/chat' ELSE '/store/' || NEW.store_id || '/chat' END,
                jsonb_build_object('messageId', NEW.id, 'storeId', NEW.store_id)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for chat mentions
DROP TRIGGER IF EXISTS tr_chat_mention ON public.chat_messages;
CREATE TRIGGER tr_chat_mention
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.handle_chat_mention();

-- Function to handle new followers (if table exists)
-- Assuming we have a 'follows' table based on common patterns
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'follows') THEN
        CREATE OR REPLACE FUNCTION public.handle_new_follower()
        RETURNS TRIGGER AS $follow$
        DECLARE
            follower_name TEXT;
        BEGIN
            SELECT display_name INTO follower_name FROM public.users WHERE id = NEW.follower_id;
            
            INSERT INTO public.notifications (user_id, actor_id, title, content, type, priority, link)
            VALUES (
                NEW.creator_id,
                NEW.follower_id,
                'New Follower!',
                follower_name || ' started following you.',
                'social',
                'medium',
                '/user/' || NEW.follower_id
            );
            RETURN NEW;
        END;
        $follow$ LANGUAGE plpgsql SECURITY DEFINER;

        DROP TRIGGER IF EXISTS tr_new_follower ON public.follows;
        CREATE TRIGGER tr_new_follower
        AFTER INSERT ON public.follows
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_follower();
    END IF;
END $$;
