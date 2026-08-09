import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
} from 'react-native';
import {
  Terminal,
  Send,
  Paperclip,
  Settings,
  Image as ImageIcon,
  MessageSquarePlus,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { 
  transmitPulse, 
  editPulse,
  deletePulse,
  subscribeToChannel, 
  uploadMatrixMedia, 
  getDmChannelId,
  MatrixLog, 
  OperatorProfile 
} from '../services/matrixService';
import { MatrixSettingsModal } from './MatrixSettingsModal';
import { DirectMessageModal } from './DirectMessageModal';

interface FreqChannel {
  id: string;
  name: string;
  isDm?: boolean;
}

const DEFAULT_CHANNELS: FreqChannel[] = [
  { id: 'FREQ-01', name: 'CORE_MAIN' },
  { id: 'FREQ-02', name: 'CYBER_OPS' },
  { id: 'FREQ-03', name: 'NEURAL_LINK' },
];

interface Props {
  operator: OperatorProfile;
  onOperatorUpdated: (updated: OperatorProfile) => void;
}

export const InterlinkMatrixUI: React.FC<Props> = ({ operator, onOperatorUpdated }) => {
  const [channels, setChannels] = useState<FreqChannel[]>(DEFAULT_CHANNELS);
  const [activeChannel, setActiveChannel] = useState('FREQ-01');
  const [logs, setLogs] = useState<MatrixLog[]>([]);
  const [commandInput, setCommandInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Modals & Action States
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dmModalOpen, setDmModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MatrixLog | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editBodyText, setEditBodyText] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);

  // Replace lines 78 and 79 with safety fallbacks:
const isLightMode = operator?.preferences?.theme === 'cyber_light';
const isDataSaver = operator?.preferences?.dataSaver ?? false;

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToChannel(activeChannel, (incomingLogs) => {
      setLogs(incomingLogs);
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => unsubscribe();
  }, [activeChannel]);

  const handleStartDm = (targetUid: string, targetAlias: string) => {
    const dmChannelId = getDmChannelId(operator.uid, targetUid);
    const channelName = `@${targetAlias}`;

    if (!channels.some(c => c.id === dmChannelId)) {
      setChannels(prev => [...prev, { id: dmChannelId, name: channelName, isDm: true }]);
    }
    setActiveChannel(dmChannelId);
  };

  const handleTransmit = async () => {
    if (!commandInput.trim()) return;

    const raw = commandInput.trim();
    setCommandInput('');

    try {
      if (editingLogId) {
        await editPulse(activeChannel, editingLogId, raw);
        setEditingLogId(null);
      } else {
        await transmitPulse(activeChannel, raw, operator.alias, operator.uid);
      }
    } catch (error) {
      console.error('Transmission Error:', error);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await deletePulse(activeChannel, logId);
      setSelectedLog(null);
    } catch (err) {
      console.error('Delete Pulse Failed:', err);
    }
  };

  const startEditing = (log: MatrixLog) => {
    setEditingLogId(log.id);
    setCommandInput(log.body);
    setSelectedLog(null);
  };

  const cancelEditing = () => {
    setEditingLogId(null);
    setCommandInput('');
  };

  const dynamicStyles = getStyles(isLightMode);

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar barStyle={isLightMode ? 'dark-content' : 'light-content'} />

      {/* TOP HUD BAR */}
      <View style={dynamicStyles.hudHeader}>
        <TouchableOpacity style={dynamicStyles.hudHeaderLeft} onPress={() => setSettingsOpen(true)}>
          {operator.photoURL ? (
            <Image source={{ uri: operator.photoURL }} style={dynamicStyles.headerAvatar} />
          ) : (
            <Terminal size={18} color={isLightMode ? '#0f172a' : '#22c55e'} />
          )}
          <Text style={dynamicStyles.hudTitle}>INTERLINK // {operator.alias}</Text>
        </TouchableOpacity>

        <View style={dynamicStyles.hudHeaderRight}>
          <TouchableOpacity onPress={() => setDmModalOpen(true)} style={dynamicStyles.iconBtn}>
            <MessageSquarePlus size={18} color={isLightMode ? '#0f172a' : '#22c55e'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSettingsOpen(true)} style={dynamicStyles.iconBtn}>
            <Settings size={18} color={isLightMode ? '#0f172a' : '#22c55e'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* FREQUENCY / DM BAR */}
      <View style={dynamicStyles.freqBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={dynamicStyles.freqScroll}>
          {channels.map(channel => {
            const isActive = activeChannel === channel.id;
            return (
              <TouchableOpacity
                key={channel.id}
                style={[dynamicStyles.freqChip, isActive && dynamicStyles.activeFreqChip]}
                onPress={() => setActiveChannel(channel.id)}
              >
                <Text style={[dynamicStyles.freqText, isActive && dynamicStyles.activeFreqText]}>
                  {channel.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* TERMINAL MONITOR */}
      <View style={dynamicStyles.terminalContainer}>
        {loading ? (
          <View style={dynamicStyles.loaderBox}>
            <ActivityIndicator size="large" color={isLightMode ? '#0f172a' : '#22c55e'} />
          </View>
        ) : (
          <ScrollView ref={scrollViewRef} style={dynamicStyles.logScrollView} showsVerticalScrollIndicator={false}>
            {logs.map(log => {
              const isOwner = log.senderUid === operator.uid;
              return (
                <TouchableOpacity
                  key={log.id}
                  style={dynamicStyles.logRow}
                  onLongPress={() => isOwner && setSelectedLog(log)}
                  activeOpacity={0.8}
                >
                  <View style={dynamicStyles.logHeaderRow}>
                    <Text style={dynamicStyles.logSender}>[{log.timestamp}] {log.sender}:</Text>
                    {log.isEdited && <Text style={dynamicStyles.editedTag}>(edited)</Text>}
                  </View>

                  <Text style={dynamicStyles.logBody}>{log.body}</Text>

                  {log.mediaUrl && (
                    isDataSaver ? (
                      <View style={dynamicStyles.dataSaverPlaceholder}>
                        <ImageIcon size={14} color="#64748b" />
                        <Text style={dynamicStyles.dataSaverText}>[MEDIA HIDDEN]</Text>
                      </View>
                    ) : (
                      <Image source={{ uri: log.mediaUrl }} style={dynamicStyles.mediaPreview} resizeMode="cover" />
                    )
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* EDIT MODE INDICATOR */}
      {editingLogId && (
        <View style={dynamicStyles.editBanner}>
          <Text style={dynamicStyles.editBannerText}>// EDITING TRANSMISSION</Text>
          <TouchableOpacity onPress={cancelEditing}>
            <X size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}

      {/* COMMAND DOCK */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={dynamicStyles.commandDock}>
          <TextInput
            style={dynamicStyles.terminalInput}
            placeholder={editingLogId ? "Update pulse..." : "Transmit pulse..."}
            placeholderTextColor={isLightMode ? '#94a3b8' : '#15803d'}
            value={commandInput}
            onChangeText={setCommandInput}
            autoCapitalize="none"
          />

          <TouchableOpacity style={dynamicStyles.transmitBtn} onPress={handleTransmit}>
            <Send size={16} color={isLightMode ? '#ffffff' : '#020804'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* MESSAGE ACTION MODAL */}
      <Modal visible={!!selectedLog} transparent animationType="fade">
        <TouchableOpacity style={dynamicStyles.actionOverlay} onPress={() => setSelectedLog(null)}>
          <View style={dynamicStyles.actionBox}>
            <Text style={dynamicStyles.actionTitle}>PULSE ACTIONS</Text>

            <TouchableOpacity
              style={dynamicStyles.actionBtn}
              onPress={() => selectedLog && startEditing(selectedLog)}
            >
              <Pencil size={16} color="#22c55e" />
              <Text style={dynamicStyles.actionBtnText}>EDIT TRANSMISSION</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[dynamicStyles.actionBtn, { borderColor: '#ef4444' }]}
              onPress={() => selectedLog && handleDeleteLog(selectedLog.id)}
            >
              <Trash2 size={16} color="#ef4444" />
              <Text style={[dynamicStyles.actionBtnText, { color: '#ef4444' }]}>PURGE FROM MATRIX</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <MatrixSettingsModal
        visible={settingsOpen}
        operator={operator}
        onClose={() => setSettingsOpen(false)}
        onProfileUpdated={onOperatorUpdated}
      />

      <DirectMessageModal
        visible={dmModalOpen}
        onClose={() => setDmModalOpen(false)}
        onStartDm={handleStartDm}
      />
    </SafeAreaView>
  );
};

const getStyles = (isLightMode: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: isLightMode ? '#f8fafc' : '#020804' },
    hudHeader: { height: 48, backgroundColor: isLightMode ? '#e2e8f0' : '#051409', borderBottomWidth: 1, borderBottomColor: isLightMode ? '#cbd5e1' : '#15803d', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    hudHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#22c55e' },
    hudTitle: { color: isLightMode ? '#0f172a' : '#22c55e', fontWeight: '900', fontSize: 13 },
    hudHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBtn: { padding: 4 },
    freqBar: { backgroundColor: isLightMode ? '#f1f5f9' : '#020804', paddingVertical: 8 },
    freqScroll: { paddingHorizontal: 12, gap: 8 },
    freqChip: { backgroundColor: isLightMode ? '#e2e8f0' : '#051409', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: isLightMode ? '#cbd5e1' : '#15803d' },
    activeFreqChip: { backgroundColor: isLightMode ? '#0f172a' : '#22c55e' },
    freqText: { color: isLightMode ? '#475569' : '#15803d', fontSize: 12, fontWeight: 'bold' },
    activeFreqText: { color: isLightMode ? '#ffffff' : '#020804' },
    terminalContainer: { flex: 1 },
    loaderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    logScrollView: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
    logRow: { marginBottom: 12 },
    logHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    logSender: { color: isLightMode ? '#0f172a' : '#22c55e', fontWeight: 'bold', fontSize: 12 },
    editedTag: { color: isLightMode ? '#94a3b8' : '#15803d', fontSize: 10, fontStyle: 'italic' },
    logBody: { color: isLightMode ? '#334155' : '#4ade80', fontSize: 13, marginTop: 2 },
    mediaPreview: { width: 220, height: 140, borderRadius: 6, marginTop: 8 },
    dataSaverPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: isLightMode ? '#e2e8f0' : '#051409', padding: 8, borderRadius: 4, marginTop: 6, maxWidth: 240 },
    dataSaverText: { color: isLightMode ? '#64748b' : '#15803d', fontSize: 10, fontWeight: 'bold' },
    editBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#051409', paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: '#f59e0b', marginHorizontal: 12, borderRadius: 4 },
    editBannerText: { color: '#f59e0b', fontSize: 10, fontWeight: 'bold' },
    commandDock: { margin: 12, backgroundColor: isLightMode ? '#ffffff' : '#051409', borderRadius: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: isLightMode ? '#cbd5e1' : '#22c55e', gap: 10 },
    terminalInput: { flex: 1, color: isLightMode ? '#0f172a' : '#22c55e', paddingVertical: 12, fontSize: 13 },
    transmitBtn: { backgroundColor: isLightMode ? '#0f172a' : '#22c55e', padding: 8, borderRadius: 6 },
    actionOverlay: { flex: 1, backgroundColor: 'rgba(2, 8, 4, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    actionBox: { width: '100%', maxWidth: 300, backgroundColor: '#051409', borderBorderWidth: 1, borderColor: '#22c55e', borderWidth: 1, borderRadius: 8, padding: 16, gap: 10 },
    actionTitle: { color: '#22c55e', fontSize: 12, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 4, borderWidth: 1, borderColor: '#22c55e', backgroundColor: '#020804' },
    actionBtnText: { color: '#22c55e', fontSize: 11, fontWeight: 'bold' },
  });
