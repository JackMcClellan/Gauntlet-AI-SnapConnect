-- This function retrieves a list of conversations for a specific user.
-- A "conversation" is defined as any interaction with another user, either through an accepted friendship
-- or by exchanging messages. It returns the other user's profile and the last message details.
create or replace function get_user_conversations(p_user_id uuid)
returns table (
    other_user_id uuid,
    other_user_username text,
    other_user_avatar_storage_path text,
    last_message_id uuid,
    last_message_content_type text,
    last_message_content text,
    last_message_created_at timestamp with time zone
)
language sql
security definer
as $$
    with conversation_partners as (
        -- Get all unique users who are either accepted friends or have exchanged messages
        select distinct user_id from (
            -- Accepted friends
            select
                case
                    when user_id1 = p_user_id then user_id2
                    else user_id1
                end as user_id
            from public.friends
            where (user_id1 = p_user_id or user_id2 = p_user_id) and status = 'accepted'
            union
            -- Users from messages
            select
                case
                    when sender_id = p_user_id then receiver_id
                    else sender_id
                end as user_id
            from public.messages
            where sender_id = p_user_id or receiver_id = p_user_id
        ) as all_partners
    ),
    last_messages as (
        -- Find the last message for each conversation, partitioned by the other user
        select
            id as message_id,
            content_type,
            content,
            created_at,
            case
                when sender_id = p_user_id then receiver_id
                else sender_id
            end as other_user_id,
            row_number() over(partition by
                case
                    when sender_id = p_user_id then receiver_id
                    else sender_id
                end
            order by created_at desc) as rn
        from public.messages
        where sender_id = p_user_id or receiver_id = p_user_id
    ),
    friendship_details as (
        -- Get friendship status and creation date to use for sorting and default messages
        select
            case
                when user_id1 = p_user_id then user_id2
                else user_id1
            end as friend_id,
            created_at as friendship_created_at
        from public.friends
        where (user_id1 = p_user_id or user_id2 = p_user_id) and status = 'accepted'
    )
    -- Combine partners with their last message and user details
    select
        cp.user_id as other_user_id,
        u.username as other_user_username,
        f.storage_path as other_user_avatar_storage_path,
        lm.message_id as last_message_id,
        coalesce(lm.content_type, 'text') as last_message_content_type,
        case
            when lm.content_type = 'file' then 'Sent an Image'
            else coalesce(lm.content, 
                case 
                    when fd.friend_id is not null then 'You are now friends.' 
                    else 'Start the conversation!' 
                end
            )
        end as last_message_content,
        coalesce(lm.created_at, fd.friendship_created_at, u.created_at) as last_message_created_at
    from conversation_partners cp
    join public.users u on u.id = cp.user_id
    left join public.files f on f.id = u.file_id
    left join last_messages lm on lm.other_user_id = cp.user_id and lm.rn = 1
    left join friendship_details fd on fd.friend_id = cp.user_id
    order by last_message_created_at desc;
$$; 