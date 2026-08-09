import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Send,
  Radio,
  Paperclip,
  LogOut,
  Hash,
  Lock,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import {
  OperatorProfile,
  MatrixLog,
  subscribeToChannel,
  transmitPulse,
  editPulse,
  deletePulse,
  logoutOperator,
  getDmChannelIdByAlias,
} from '../services/matrixService';
import { DirectMessageModal } from './DirectMessageModal';
import { MatrixSettingsModal } from './MatrixSettingsModal';

interface Props {
  operator: OperatorProfile;
  onOperatorUpdated: (updated: OperatorProfile) => void;
}

interface ChannelItem {
  id: string;
  name: string;
  isDm?: boolean;
}

const DEFAULT_CHANNELS: ChannelItem[] = [
  { id: 'global_broadcast', name: 'GLOBAL_BROADCAST' },
  { id: 'tactical_ops', name: 'TACTICAL_OPS' },
  { id: 'encrypted_feed', name: 'ENCRYPTED_FEED' },
];

export const InterlinkMatrixUI: React.FC<Props> = ({ operator, onOperatorUpdated }) => {
  const [activeChannel, setActiveChannel] = useState('global_broadcast');
  const [channels, setChannels] = useState<ChannelItem[]>(DEFAULT_CHANNELS);
  const [logs, setLogs] = useState<MatrixLog[]>([]);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  // Message Edit State
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editBodyText, setEditBodyText] = useState('');

  // Modals & Navigation
  const [isDmModalOpen, setIsDmModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);

  const isLightMode = operator?.preferences?.theme === 'cyber_light';
  const isDataSaver = operator?.preferences?.dataSaver ?? false;

  // Real-time channel listener
  useEffect(() => {
    const unsubscribe = subscribeToChannel(activeChannel, (newLogs) => {
      setLogs(newLogs);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => unsubscribe();
  }, [activeChannel]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const uploadImageAttachment = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `transmissions/${Date.now()}_${operator.alias}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  // TRANSMIT MESSAGE FUNCTION
  const handleTransmit = async () => {
    if (!inputText.trim() && !selectedImageUri) return;

    const messageText = inputText.trim();
    setInputText(''); // Clear input immediately for smooth UX
    setUploading(true);

    try {
      let mediaUrl: string | undefined;
      if (selectedImageUri) {
        mediaUrl = await uploadImageAttachment(selectedImageUri);
        setSelectedImageUri(null);
      }

      const activeChan = channels.find((c) => c.id === activeChannel);
      const isDm = activeChan?.isDm;

      await transmitPulse(
        activeChannel,
        messageText,
        operator.alias,
        operator.uid,
        isDm ? 'dm' : 'broadcast',
        mediaUrl
      );
    } catch (err) {
      console.error('Failed to transmit:', err);
    } finally {
      setUploading(false);
    }
  };

  // Keyboard handler to trigger send on Enter key
  const handleKeyPress = (e: any) => {
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleTransmit();
    }
  };

  // Start DM channel strictly by username
  const handleStartDm = (targetAlias: string) => {
    const cleanTarget = targetAlias.trim().toUpperCase();
    if (cleanTarget === operator.alias.toUpperCase()) return;

    const dmChannelId = getDmChannelIdByAlias(operator.alias, cleanTarget);
    const channelName = `@${cleanTarget}`;

    if (!channels.some((c) => c.id === dmChannelId)) {
      setChannels((prev) => [...prev, { id: dmChannelId, name: channelName, isDm: true }]);
    }
    setActiveChannel(dmChannelId);
  };

  // SAVE EDITED MESSAGE
  const handleSaveEdit = async (logId: string) => {
    if (!editBodyText.trim()) return;
    try {
      await editPulse(activeChannel, logId, editBodyText.trim());
      setEditingLogId(null);
      setEditBodyText('');
    } catch (err) {
      console.error('Failed to save edit:', err);
    }
  };

  // DELETE MESSAGE
  const handleDeleteLog = async (logId: string) => {
    try {
      await deletePulse(activeChannel, logId);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const currentChannelObj = channels.find((c) => c.id === activeChannel);

  return (
    <View style={[styles.container, isLightMode && styles.lightContainer]}>
      {/* SIDEBAR TOGGLE BUTTON */}
      <TouchableOpacity
        style={styles.sidebarToggleBtn}
        onPress={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <ChevronLeft size={20} color="#22c55e" /> : <ChevronRight size={20} color="#22c55e" />}
      </TouchableOpacity>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <View style={[styles.sidebar, isLightMode && styles.lightSidebar]}>
          <View style={styles.sidebarHeader}>
            <Radio size={18} color="#22c55e" />
            <Text style={[styles.sidebarTitle, isLightMode && styles.lightText]}>MATRIX_NODES</Text>
          </View>

          <ScrollView style={styles.channelList}>
            <Text style={styles.sectionHeader}>// PUBLIC FREQUENCIES</Text>
            {channels
              .filter((c) => !c.isDm)
              .map((chan) => (
                <TouchableOpacity
                  key={chan.id}
                  style={[
                    styles.channelBtn,
                    activeChannel === chan.id && styles.activeChannelBtn,
                  ]}
                  onPress={() => setActiveChannel(chan.id)}
                >
                  <Hash size={14} color={activeChannel === chan.id ? '#020804' : '#22c55e'} />
                  <Text
                    style={[
                      styles.channelBtnText,
                      activeChannel === chan.id && styles.activeChannelBtnText,
                      isLightMode && styles.lightText,
                    ]}
                  >
                    {chan.name}
                  </Text>
                </TouchableOpacity>
              ))}

            <View style={styles.dmHeaderRow}>
              <Text style={styles.sectionHeader}>// DIRECT LINKS</Text>
              <TouchableOpacity onPress={() => setIsDmModalOpen(true)}>
                <Plus size={14} color="#22c55e" />
              </TouchableOpacity>
            </View>

            {channels
              .filter((c) => c.isDm)
              .map((chan) => (
                <TouchableOpacity
                  key={chan.id}
                  style={[
                    styles.channelBtn,
                    activeChannel === chan.id && styles.activeChannelBtn,
                  ]}
                  onPress={() => setActiveChannel(chan.id)}
                >
                  <Lock size={14} color={activeChannel === chan.id ? '#020804' : '#22c55e'} />
                  <Text
                    style={[
                      styles.channelBtnText,
                      activeChannel === chan.id && styles.activeChannelBtnText,
                      isLightMode && styles.lightText,
                    ]}
                  >
                    {chan.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>

          {/* USER FOOTER */}
          <View style={styles.userBar}>
            <TouchableOpacity
              style={styles.userInfoRow}
              onPress={() => setIsSettingsOpen(true)}
            >
              {operator.photoURL ? (
                <Image source={{ uri: operator.photoURL }} style={styles.userAvatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{operator.alias[0]}</Text>
                </View>
              )}
              <View>
                <Text style={[styles.userAlias, isLightMode && styles.lightText]}>
                  {operator.alias}
                </Text>
                <Text style={styles.userStatus}>STATUS: {operator.status}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsSettingsOpen(true)}>
              <Settings size={18} color="#22c55e" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => logoutOperator()}>
              <LogOut size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MAIN LOG FEED & TRANSMITTER */}
      <View style={styles.mainFeed}>
        {/* TOP HUD BAR */}
        <View style={[styles.topBar, isLightMode && styles.lightTopBar]}>
          <Text style={[styles.topBarTitle, isLightMode && styles.lightText]}>
            // SIGNAL_FREQ: {currentChannelObj?.name || 'UNKNOWN'}
          </Text>
        </View>

        {/* LOG MESSAGES FEED */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.feedScroll}
          contentContainerStyle={{ padding: 16 }}
        >
          {logs.map((log) => {
            const isSelf = log.senderUid === operator.uid;
            const isEditing = editingLogId === log.id;

            return (
              <View
                key={log.id}
                style={[
                  styles.logCard,
                  isSelf && styles.selfLogCard,
                  isLightMode && styles.lightLogCard,
                ]}
              >
                <View style={styles.logHeader}>
                  <Text style={styles.logSender}>[{log.sender}]</Text>
                  <Text style={styles.logTime}>{log.timestamp}</Text>
                  {log.isEdited && <Text style={styles.editedTag}>(EDITED)</Text>}

                  {/* EDIT & DELETE ACTION BUTTONS FOR OWN MESSAGES */}
                  {isSelf && !isEditing && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingLogId(log.id);
                          setEditBodyText(log.body);
                        }}
                      >
                        <Edit2 size={12} color="#22c55e" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteLog(log.id)}>
                        <Trash2 size={12} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* EDIT MODE INPUT OR NORMAL TEXT */}
                {isEditing ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.editInput}
                      value={editBodyText}
                      onChangeText={setEditBodyText}
                      onSubmitEditing={() => handleSaveEdit(log.id)}
                      multiline={false}
                      autoFocus
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity onPress={() => handleSaveEdit(log.id)}>
                        <Check size={16} color="#22c55e" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setEditingLogId(null)}>
                        <X size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.logBody, isLightMode && styles.lightLogBody]}>
                    {log.body}
                  </Text>
                )}

                {/* MEDIA PREVIEWS */}
                {log.mediaUrl && !isDataSaver && (
                  <Image source={{ uri: log.mediaUrl }} style={styles.attachedImage} />
                )}
                {log.mediaUrl && isDataSaver && (
                  <Text style={styles.dataSaverText}>[ATTACHMENT HIDDEN - DATA SAVER ON]</Text>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* ATTACHMENT PREVIEW BAR */}
        {selectedImageUri && (
          <View style={styles.previewBar}>
            <Image source={{ uri: selectedImageUri }} style={styles.previewThumbnail} />
            <Text style={styles.previewText}>IMAGE_ATTACHED.RAW</Text>
            <TouchableOpacity onPress={() => setSelectedImageUri(null)}>
              <X size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* TRANSMITTER BAR (WITH ENTER KEY FIX) */}
        <View style={[styles.transmitterBar, isLightMode && styles.lightTransmitterBar]}>
          <TouchableOpacity onPress={handlePickImage} style={styles.attachBtn}>
            <Paperclip size={18} color="#22c55e" />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, isLightMode && styles.lightInput]}
            placeholder="TRANSMIT PULSE TO MATRIX..."
            placeholderTextColor="#15803d"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleTransmit} // For Native Enter Key
            onKeyPress={handleKeyPress}       // For Web Enter Key
            blurOnSubmit={false}
            returnKeyType="send"
          />

          <TouchableOpacity style={styles.sendBtn} onPress={handleTransmit} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color="#020804" />
            ) : (
              <Send size={16} color="#020804" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* MODALS */}
      <DirectMessageModal
        visible={isDmModalOpen}
        onClose={() => setIsDmModalOpen(false)}
        onStartDm={handleStartDm}
      />

      <MatrixSettingsModal
        visible={isSettingsOpen}
        operator={operator}
        onClose={() => setIsSettingsOpen(false)}
        onProfileUpdated={onOperatorUpdated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#020804' },
  lightContainer: { backgroundColor: '#f0fdf4' },
  sidebarToggleBtn: { position: 'absolute', top: 12, left: 12, zIndex: 10, padding: 6, backgroundColor: '#051409', borderRadius: 4, borderWidth: 1, borderColor: '#22c55e' },
  sidebar: { width: 240, backgroundColor: '#051409', borderRightWidth: 1, borderRightColor: '#22c55e', padding: 12, justifyContent: 'space-between' },
  lightSidebar: { backgroundColor: '#e2e8f0', borderRightColor: '#16a34a' },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 24 },
  sidebarTitle: { color: '#22c55e', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  sectionHeader: { color: '#15803d', fontSize: 9, fontWeight: 'bold', marginVertical: 8 },
  dmHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  channelList: { flex: 1 },
  channelBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 4, marginBottom: 4 },
  activeChannelBtn: { backgroundColor: '#22c55e' },
  channelBtnText: { color: '#22c55e', fontSize: 12, fontWeight: 'bold' },
  activeChannelBtnText: { color: '#020804' },
  userBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#0e3a1a' },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#22c55e' },
  avatarPlaceholder: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#15803d', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#020804', fontWeight: 'bold', fontSize: 12 },
  userAlias: { color: '#22c55e', fontSize: 11, fontWeight: 'bold' },
  userStatus: { color: '#15803d', fontSize: 8 },
  mainFeed: { flex: 1, display: 'flex' },
  topBar: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#0e3a1a', backgroundColor: '#051409' },
  lightTopBar: { backgroundColor: '#dcfce7', borderBottomColor: '#16a34a' },
  topBarTitle: { color: '#22c55e', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  feedScroll: { flex: 1 },
  logCard: { backgroundColor: '#051409', borderWidth: 1, borderColor: '#0e3a1a', padding: 10, borderRadius: 6, marginBottom: 10 },
  selfLogCard: { borderColor: '#22c55e' },
  lightLogCard: { backgroundColor: '#ffffff', borderColor: '#cbd5e1' },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  logSender: { color: '#22c55e', fontWeight: 'bold', fontSize: 11 },
  logTime: { color: '#15803d', fontSize: 9 },
  editedTag: { color: '#f59e0b', fontSize: 8, fontStyle: 'italic' },
  actionRow: { marginLeft: 'auto', flexDirection: 'row', gap: 10 },
  logBody: { color: '#22c55e', fontSize: 13, lineHeight: 18 },
  lightLogBody: { color: '#0f172a' },
  editContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editInput: { flex: 1, backgroundColor: '#020804', color: '#22c55e', padding: 6, borderRadius: 4, borderWidth: 1, borderColor: '#22c55e', fontSize: 12 },
  editActions: { flexDirection: 'row', gap: 8 },
  attachedImage: { width: '100%', height: 200, borderRadius: 4, marginTop: 8 },
  dataSaverText: { color: '#f59e0b', fontSize: 9, fontStyle: 'italic', marginTop: 4 },
  previewBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, backgroundColor: '#051409', borderTopWidth: 1, borderTopColor: '#22c55e' },
  previewThumbnail: { width: 24, height: 24, borderRadius: 4 },
  previewText: { color: '#22c55e', fontSize: 10, flex: 1 },
  transmitterBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: '#0e3a1a', backgroundColor: '#051409' },
  lightTransmitterBar: { backgroundColor: '#ffffff', borderTopColor: '#cbd5e1' },
  attachBtn: { padding: 8 },
  input: { flex: 1, color: '#22c55e', fontSize: 12, paddingVertical: 6 },
  lightInput: { color: '#0f172a' },
  sendBtn: { backgroundColor: '#22c55e', padding: 8, borderRadius: 4 },
  lightText: { color: '#0f172a' },
});