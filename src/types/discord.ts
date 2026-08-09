export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  unread?: boolean;
}

export interface ChannelCategory {
  id: string;
  name: string;
  channels: Channel[];
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  unread?: boolean;
}

export interface Message {
  id: string;
  author: User;
  content: string;
  timestamp: string;
}
