-- This function retrieves a list of conversations for a specific user.
-- A "conversation" includes all accepted friends, even if no messages have been exchanged.
-- It returns the other user's profile and the last message, or the friendship creation date if no messages exist.
create or replace function get_user_conversations(p_user_id uuid)
returns table (
    other_user_id uuid,
    other_user_username text,
    other_user_avatar_url text,
    last_message_id uuid,
    last_message_content_type text,
    last_message_content text,
    last_message_created_at timestamp with time zone
)
language sql
security definer
as $$
    with friends as (
        -- Find all accepted friends of the specified user
        select
            case
                when user_id1 = p_user_id then user_id2
                else user_id1
            end as friend_id,
            created_at as friendship_created_at
        from public.friends
        where (user_id1 = p_user_id or user_id2 = p_user_id) and status = 'accepted'
    ),
    last_messages as (
        -- Find the last message for each conversation
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
    )
    -- Combine friends with their last message (if any)
    select
        f.friend_id as other_user_id,
        u.username as other_user_username,
        u.avatar_url as other_user_avatar_url,
        lm.message_id as last_message_id,
        coalesce(lm.content_type, 'text') as last_message_content_type,
        coalesce(lm.content, 'You are now friends.') as last_message_content,
        coalesce(lm.created_at, f.friendship_created_at) as last_message_created_at
    from friends f
    join public.users u on u.id = f.friend_id
    left join last_messages lm on lm.other_user_id = f.friend_id and lm.rn = 1
    order by last_message_created_at desc;
$$; 