export interface NetworkUser {
  id: string;
  alias: string;
  handle: string;
  avatar: string;
  presence: 'active' | 'away' | 'busy' | 'offline';
  customStatus?: string;
}

export interface Node {
  id: string;
  title: string;
  type: 'signal' | 'frequency';
  hasUnread?: boolean;
}

export interface NodeGroup {
  id: string;
  label: string;
  nodes: Node[];
}

export interface Hub {
  id: string;
  name: string;
  icon: string;
  hasUnread?: boolean;
}

export interface Transmission {
  id: string;
  sender: NetworkUser;
  payload: string;
  timestamp: string;
}
