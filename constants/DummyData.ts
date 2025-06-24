// This is a new file

export const DUMMY_CHATS = [
  {
    id: '1',
    name: 'Logan',
    avatar: 'https://i.pravatar.cc/150?u=logan',
    lastMessage: 'Just finished the plumbing job, came out great!',
    timestamp: '10:45 AM',
    unreadCount: 2,
  },
  {
    id: '2',
    name: 'Amy',
    avatar: 'https://i.pravatar.cc/150?u=amy',
    lastMessage: 'Can you help me with a leaky faucet?',
    timestamp: '9:30 AM',
    unreadCount: 0,
  },
  {
    id: '3',
    name: 'Ravi',
    avatar: 'https://i.pravatar.cc/150?u=ravi',
    lastMessage: 'Check out this cool woodworking project I made.',
    timestamp: 'Yesterday',
    unreadCount: 5,
  },
  {
    id: '4',
    name: 'Builder Bob',
    avatar: 'https://i.pravatar.cc/150?u=bob',
    lastMessage: 'Got the permits for the new construction.',
    timestamp: 'Yesterday',
    unreadCount: 0,
  },
    {
    id: '5',
    name: 'Electrician Eric',
    avatar: 'https://i.pravatar.cc/150?u=eric',
    lastMessage: 'Rewiring is complete.',
    timestamp: '2 days ago',
    unreadCount: 1,
  },
    {
    id: '6',
    name: 'Painter Pam',
    avatar: 'https://i.pravatar.cc/150?u=pam',
    lastMessage: 'Just finished the first coat.',
    timestamp: '2 days ago',
    unreadCount: 0,
  },
];

export const DUMMY_MESSAGES = {
  '1': [
    { id: 'm1', text: 'Just finished the plumbing job, came out great!', sender: 'Logan', timestamp: '10:45 AM' },
    { id: 'm2', text: 'Awesome! Send a pic!', sender: 'Me', timestamp: '10:46 AM' },
  ],
  '2': [
    { id: 'm3', text: 'Can you help me with a leaky faucet?', sender: 'Amy', timestamp: '9:30 AM' },
  ],
  '3': [
     { id: 'm4', text: 'Check out this cool woodworking project I made.', sender: 'Ravi', timestamp: 'Yesterday' },
  ]
};

export const DUMMY_STORIES = {
  '1': [ // Logan
    { id: 's1', type: 'image', url: 'https://picsum.photos/seed/s1/1080/1920', duration: 5000, timestamp: '2h ago' },
    { id: 's2', type: 'image', url: 'https://picsum.photos/seed/s2/1080/1920', duration: 7000, timestamp: '1h ago' },
  ],
  '2': [ // Amy
    { id: 's3', type: 'image', url: 'https://picsum.photos/seed/s3/1080/1920', duration: 5000, timestamp: '45m ago' },
  ],
  '3': [ // Ravi
    { id: 's4', type: 'image', url: 'https://picsum.photos/seed/s4/1080/1920', duration: 6000, timestamp: '3h ago' },
    { id: 's5', type: 'image', url: 'https://picsum.photos/seed/s5/1080/1920', duration: 5000, timestamp: '2h ago' },
    { id: 's6', type: 'image', url: 'https://picsum.photos/seed/s6/1080/1920', duration: 8000, timestamp: '1h ago' },
  ],
  '4': [ // Builder Bob
    { id: 's7', type: 'image', url: 'https://picsum.photos/seed/s7/1080/1920', duration: 5000, timestamp: '5h ago' },
  ],
}; 