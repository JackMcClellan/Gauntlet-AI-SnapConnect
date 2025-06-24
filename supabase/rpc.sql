-- This function retrieves a list of conversations for a specific user.
-- A "conversation" is defined by the other participant.
-- It returns the other user's profile and the last message exchanged.
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
    with conversation_partners as (
        -- Find all unique users the specified user has messaged or received messages from
        select distinct
            case
                when sender_id = p_user_id then receiver_id
                else sender_id
            end as other_user_id
        from public.messages
        where sender_id = p_user_id or receiver_id = p_user_id
    ),
    messages_with_rank as (
        -- For each conversation, rank messages by time to find the latest one
        select
            m.id,
            m.content_type,
            m.content,
            m.created_at,
            case
                when m.sender_id = p_user_id then m.receiver_id
                else m.sender_id
            end as other_user_id,
            row_number() over(partition by (
                case
                    when m.sender_id = p_user_id then m.receiver_id
                    else m.sender_id
                end
            ) order by m.created_at desc) as rn
        from public.messages m
        join conversation_partners cp on (m.sender_id = p_user_id and m.receiver_id = cp.other_user_id)
                                       or (m.receiver_id = p_user_id and m.sender_id = cp.other_user_id)
    )
    -- Select the latest message for each conversation and join with the other user's profile
    select
        p.other_user_id,
        u.username as other_user_username,
        u.avatar_url as other_user_avatar_url,
        m.id as last_message_id,
        m.content_type as last_message_content_type,
        m.content as last_message_content,
        m.created_at as last_message_created_at
    from messages_with_rank m
    join public.users u on u.id = m.other_user_id
    join conversation_partners p on p.other_user_id = m.other_user_id
    where m.rn = 1
    order by m.created_at desc;
$$; 