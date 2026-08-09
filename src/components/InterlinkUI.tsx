import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Radio,
  RadioReceiver,
  Plus,
  Zap,
  Send,
  Smile,
  Paperclip,
  Users,
  Bell,
  Pin,
  ChevronDown,
} from 'lucide-react-native';
import { Hub, NodeGroup, Transmission, NetworkUser } from '../types/interlink';

// Mock Interlink Data
const HUBS: Hub[] = [
  { id: '1', name: 'Interlink Prime', icon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100' },
  { id: '2', name: 'Dev Sector', icon: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100', hasUnread: true },
  { id: '3', name: 'Creator Core', icon: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=100' },
];

const NODE_GROUPS: NodeGroup[] = [
  {
    id: 'g1',
    label: 'ESSENTIALS',
    nodes: [
      { id: 'n1', title: 'welcome-info', type: 'signal' },
      { id: 'n2', title: 'announcements', type: 'signal', hasUnread: true },
    ],
  },
  {
    id: 'g2',
    label: 'SIGNALS',
    nodes: [
      { id: 'n3', title: 'main-feed', type: 'signal' },
      { id: 'n4', title: 'tech-discussion', type: 'signal' },
      { id: 'n5', title: 'showcase', type: 'signal' },
    ],
  },
  {
    id: 'g3',
    label: 'FREQUENCIES',
    nodes: [
      { id: 'n6', title: 'Audio Link Alpha', type: 'frequency' },
      { id: 'n7', title: 'Audio Link Beta', type: 'frequency' },
    ],
  },
];

const USERS: NetworkUser[] = [
  { id: 'u1', alias: 'Aster Fox', handle: 'asterfox', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', presence: 'active', customStatus: 'Building Interlink OS' },
  { id: 'u2', alias: 'Ryzen', handle: 'ryzen_dev', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', presence: 'busy', customStatus: 'Debugging Android build' },
  { id: 'u3', alias: 'Alex', handle: 'alex_net', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', presence: 'away' },
  { id: 'u4', alias: 'Ghost', handle: 'ghost_user', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100', presence: 'offline' },
];

const INITIAL_TRANSMISSIONS: Transmission[] = [
  {
    id: 't1',
    sender: USERS[0],
    payload: 'Welcome to Interlink! The network architecture is online and operating on custom protocols.',
    timestamp: 'Today at 10:15 AM',
  },
  {
    id: 't2',
    sender: USERS[1],
    payload: 'UI theme updated: Cyan accenting (#38bdf8), Slate panels (#131b2e), and custom node feeds.',
    timestamp: 'Today at 10:18 AM',
  },
  {
    id: 't3',
    sender: USERS[2],
    payload: 'Type a transmission below to broadcast to this signal node.',
    timestamp: 'Today at 10:20 AM',
  },
];

export const InterlinkUI: React.FC = () => {
  const [activeHub, setActiveHub] = useState('1');
  const [activeNode, setActiveNode] = useState('n3');
  const [transmissions, setTransmissions] = useState<Transmission[]>(INITIAL_TRANSMISSIONS);
  const [inputText, setInputText] = useState('');
  const [showNetworkMembers, setShowNetworkMembers] = useState(false);

  const handleSendTransmission = () => {
    if (!inputText.trim()) return;

    const newTransmission: Transmission = {
      id: Date.now().toString(),
      sender: {
        id: 'me',
        alias: 'You',
        handle: 'currentuser',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        presence: 'active',
      },
      payload: inputText.trim(),
      timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...transmissions, newTransmission]);
    setInputText('');
  };

  const getPresenceColor = (presence: NetworkUser['presence']) => {
    switch (presence) {
      case 'active': return '#10b981';
      case 'away': return '#f59e0b';
      case 'busy': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      <View style={styles.appLayout}>
        {/* 1. HUBS BAR (LEFTMOST) */}
        <View style={styles.hubSidebar}>
          <TouchableOpacity style={[styles.hubIcon, styles.interlinkCore]}>
            <Zap size={22} color="#090d16" />
          </TouchableOpacity>
          <View style={styles.hubDivider} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {HUBS.map(hub => (
              <TouchableOpacity
                key={hub.id}
                style={[
                  styles.hubIconContainer,
                  activeHub === hub.id && styles.activeHubContainer,
                ]}
                onPress={() => setActiveHub(hub.id)}
              >
                {activeHub === hub.id && <View style={styles.activePill} />}
                <Image source={{ uri: hub.icon }} style={styles.hubIcon} />
                {hub.hasUnread && <View style={styles.unreadIndicator} />}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.hubIcon, styles.actionHubBtn]}>
              <Plus size={20} color="#38bdf8" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 2. NODES SIDEBAR */}
        <View style={styles.nodeSidebar}>
          <TouchableOpacity style={styles.hubHeader}>
            <Text style={styles.hubTitle}>Interlink Prime</Text>
            <ChevronDown size={18} color="#94a3b8" />
          </TouchableOpacity>

          <ScrollView style={styles.nodeList} showsVerticalScrollIndicator={false}>
            {NODE_GROUPS.map(group => (
              <View key={group.id} style={styles.groupSection}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                {group.nodes.map(node => {
                  const isActive = activeNode === node.id;
                  return (
                    <TouchableOpacity
                      key={node.id}
                      style={[styles.nodeItem, isActive && styles.activeNodeItem]}
                      onPress={() => setActiveNode(node.id)}
                    >
                      {node.type === 'signal' ? (
                        <Radio size={16} color={isActive ? '#38bdf8' : '#64748b'} />
                      ) : (
                        <RadioReceiver size={16} color={isActive ? '#38bdf8' : '#64748b'} />
                      )}
                      <Text style={[styles.nodeTitle, isActive && styles.activeNodeTitle]}>
                        {node.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* USER PROFILE CARD */}
          <View style={styles.userCard}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }}
                style={styles.userAvatar}
              />
              <View style={[styles.presenceDot, { backgroundColor: getPresenceColor('active') }]} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>You</Text>
              <Text style={styles.userHandle}>@currentuser</Text>
            </View>
          </View>
        </View>

        {/* 3. MAIN SIGNAL FEED */}
        <View style={styles.feedArea}>
          {/* FEED HEADER */}
          <View style={styles.feedHeader}>
            <View style={styles.feedHeaderLeft}>
              <Radio size={20} color="#38bdf8" />
              <Text style={styles.feedNodeTitle}>main-feed</Text>
            </View>
            <View style={styles.feedHeaderRight}>
              <TouchableOpacity style={styles.iconBtn}>
                <Bell size={18} color="#94a3b8" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Pin size={18} color="#94a3b8" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setShowNetworkMembers(!showNetworkMembers)}
              >
                <Users size={18} color={showNetworkMembers ? '#38bdf8' : '#94a3b8'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* TRANSMISSION LIST & MEMBERS SIDEBAR */}
          <View style={styles.feedBody}>
            <ScrollView style={styles.transmissionList} showsVerticalScrollIndicator={false}>
              <View style={styles.nodeWelcome}>
                <View style={styles.welcomeIconCircle}>
                  <Radio size={36} color="#38bdf8" />
                </View>
                <Text style={styles.welcomeTitle}>Signal Node: main-feed</Text>
                <Text style={styles.welcomeSubtitle}>Broadcast messages to all connected members on this node.</Text>
              </View>

              {transmissions.map(item => (
                <View key={item.id} style={styles.transmissionRow}>
                  <Image source={{ uri: item.sender.avatar }} style={styles.senderAvatar} />
                  <View style={styles.transmissionContent}>
                    <View style={styles.transmissionHeader}>
                      <Text style={styles.senderAlias}>{item.sender.alias}</Text>
                      <Text style={styles.senderHandle}>@{item.sender.handle}</Text>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.timestamp}>{item.timestamp}</Text>
                    </View>
                    <Text style={styles.payloadText}>{item.payload}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* NETWORK MEMBERS SIDEBAR */}
            {showNetworkMembers && (
              <View style={styles.networkSidebar}>
                <Text style={styles.networkGroupLabel}>CONNECTED — {USERS.filter(u => u.presence !== 'offline').length}</Text>
                {USERS.filter(u => u.presence !== 'offline').map(user => (
                  <View key={user.id} style={styles.memberRow}>
                    <View style={styles.avatarWrapper}>
                      <Image source={{ uri: user.avatar }} style={styles.memberAvatar} />
                      <View style={[styles.presenceDot, { backgroundColor: getPresenceColor(user.presence) }]} />
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{user.alias}</Text>
                      {user.customStatus && (
                        <Text style={styles.memberStatus} numberOfLines={1}>
                          {user.customStatus}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}

                <Text style={[styles.networkGroupLabel, { marginTop: 16 }]}>
                  DISCONNECTED — {USERS.filter(u => u.presence === 'offline').length}
                </Text>
                {USERS.filter(u => u.presence === 'offline').map(user => (
                  <View key={user.id} style={[styles.memberRow, { opacity: 0.4 }]}>
                    <Image source={{ uri: user.avatar }} style={styles.memberAvatar} />
                    <Text style={styles.memberName}>{user.alias}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* INPUT TRANSMITTER */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          >
            <View style={styles.inputBar}>
              <TouchableOpacity style={styles.attachBtn}>
                <Paperclip size={18} color="#94a3b8" />
              </TouchableOpacity>

              <TextInput
                style={styles.transmissionInput}
                placeholder="Broadcast to #main-feed..."
                placeholderTextColor="#64748b"
                value={inputText}
                onChangeText={setInputText}
              />

              <TouchableOpacity style={styles.attachBtn}>
                <Smile size={18} color="#94a3b8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                onPress={handleSendTransmission}
                disabled={!inputText.trim()}
              >
                <Send size={15} color="#090d16" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  appLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  // HUBS
  hubSidebar: {
    width: 68,
    backgroundColor: '#090d16',
    alignItems: 'center',
    paddingTop: 12,
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
  },
  hubIconContainer: {
    position: 'relative',
    marginBottom: 10,
    alignItems: 'center',
  },
  activeHubContainer: {},
  activePill: {
    position: 'absolute',
    left: -10,
    top: 12,
    width: 4,
    height: 22,
    backgroundColor: '#38bdf8',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  hubIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  interlinkCore: {
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hubDivider: {
    width: 28,
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 8,
  },
  unreadIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38bdf8',
    borderWidth: 2,
    borderColor: '#090d16',
  },
  actionHubBtn: {
    backgroundColor: '#131b2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  // NODES
  nodeSidebar: {
    width: 190,
    backgroundColor: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
  },
  hubHeader: {
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  hubTitle: {
    color: '#f8fafc',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  nodeList: {
    flex: 1,
    paddingTop: 12,
  },
  groupSection: {
    marginBottom: 16,
  },
  groupLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 14,
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  nodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginHorizontal: 8,
    borderRadius: 6,
    gap: 8,
  },
  activeNodeItem: {
    backgroundColor: '#1e293b',
  },
  nodeTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  activeNodeTitle: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  userCard: {
    height: 52,
    backgroundColor: '#131b2e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  avatarWrapper: {
    position: 'relative',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  presenceDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#131b2e',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  userHandle: {
    color: '#64748b',
    fontSize: 11,
  },
  // FEED
  feedArea: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  feedHeader: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  feedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedNodeTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 15,
  },
  feedHeaderRight: {
    flexDirection: 'row',
    gap: 14,
  },
  iconBtn: {
    padding: 4,
  },
  feedBody: {
    flex: 1,
    flexDirection: 'row',
  },
  transmissionList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  nodeWelcome: {
    marginTop: 20,
    marginBottom: 16,
  },
  welcomeIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#131b2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  welcomeTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
  transmissionRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  senderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  transmissionContent: {
    flex: 1,
  },
  transmissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  senderAlias: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 14,
  },
  senderHandle: {
    color: '#64748b',
    fontSize: 12,
  },
  dot: {
    color: '#334155',
  },
  timestamp: {
    color: '#64748b',
    fontSize: 11,
  },
  payloadText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  // NETWORK MEMBERS
  networkSidebar: {
    width: 170,
    backgroundColor: '#0f172a',
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#1e293b',
  },
  networkGroupLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '500',
  },
  memberStatus: {
    color: '#64748b',
    fontSize: 10,
  },
  // INPUT
  inputBar: {
    margin: 12,
    backgroundColor: '#131b2e',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  attachBtn: {
    padding: 4,
  },
  transmissionInput: {
    flex: 1,
    color: '#f8fafc',
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: '#38bdf8',
    padding: 6,
    borderRadius: 14,
  },
  sendBtnDisabled: {
    backgroundColor: '#1e293b',
  },
});
