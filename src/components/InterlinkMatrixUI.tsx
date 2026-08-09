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
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  Terminal,
  Activity,
  Cpu,
  Send,
  Zap,
  Radio,
  RadioReceiver,
  Code2,
  Paperclip,
  LogOut,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { 
  transmitPulse, 
  subscribeToFrequency, 
  uploadMatrixMedia, 
  logoutOperator, 
  MatrixLog, 
  OperatorProfile 
} from '../services/matrixService';

const FREQUENCIES = [
  { id: 'FREQ-01', name: 'CORE_MAIN', clearance: 'ALPHA' },
  { id: 'FREQ-02', name: 'CYBER_OPS', clearance: 'SECRET' },
  { id: 'FREQ-03', name: 'NEURAL_LINK', clearance: 'TOP_SECRET' },
];

interface Props {
  operator: OperatorProfile;
}

export const InterlinkMatrixUI: React.FC<Props> = ({ operator }) => {
  const [activeFreq, setActiveFreq] = useState('FREQ-01');
  const [logs, setLogs] = useState<MatrixLog[]>([]);
  const [commandInput, setCommandInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ping, setPing] = useState(18);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToFrequency(activeFreq, (incomingLogs) => {
      setLogs(incomingLogs);
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => unsubscribe();
  }, [activeFreq]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    const interval = setInterval(() => {
      setPing(Math.floor(12 + Math.random() * 10));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handlePickAndUploadImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      setUploading(true);
      try {
        const mediaUrl = await uploadMatrixMedia(result.assets[0].uri);
        await transmitPulse(
          activeFreq,
          '[MEDIA_ATTACHMENT_TRANSMITTED]',
          operator.alias,
          operator.uid,
          'enc_data',
          mediaUrl
        );
      } catch (err) {
        console.error('Media upload failed:', err);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleTransmit = async () => {
    if (!commandInput.trim()) return;

    const raw = commandInput.trim();
    let type: MatrixLog['type'] = 'broadcast';

    if (raw.startsWith('/')) {
      type = 'command';
    }

    setCommandInput('');
    try {
      await transmitPulse(activeFreq, raw, operator.alias, operator.uid, type);
    } catch (error) {
      console.error('Firestore Transmission Error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020804" />

      {/* TOP CYBER HUD BAR */}
      <View style={styles.hudHeader}>
        <View style={styles.hudHeaderLeft}>
          <Terminal size={18} color="#22c55e" />
          <Text style={styles.hudTitle}>INTERLINK // {operator.alias}</Text>
        </View>

        <View style={styles.hudHeaderRight}>
          <View style={styles.metricBadge}>
            <Activity size={14} color="#22c55e" />
            <Text style={styles.metricText}>{ping}ms</Text>
          </View>
          <TouchableOpacity onPress={() => logoutOperator()} style={styles.logoutBtn}>
            <LogOut size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* FREQUENCY MATRIX SELECTOR */}
      <View style={styles.freqBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.freqScroll}>
          {FREQUENCIES.map(freq => {
            const isActive = activeFreq === freq.id;
            return (
              <TouchableOpacity
                key={freq.id}
                style={[styles.freqChip, isActive && styles.activeFreqChip]}
                onPress={() => setActiveFreq(freq.id)}
              >
                {isActive ? <Radio size={14} color="#020804" /> : <RadioReceiver size={14} color="#15803d" />}
                <Text style={[styles.freqText, isActive && styles.activeFreqText]}>
                  {freq.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* TERMINAL MONITOR */}
      <View style={styles.terminalContainer}>
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loaderText}>CONNECTING TO FIRESTORE STREAM...</Text>
          </View>
        ) : (
          <ScrollView ref={scrollViewRef} style={styles.logScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.terminalBanner}>
              <Code2 size={32} color="#15803d" />
              <Text style={styles.bannerTitle}>FIRESTORE TELEMETRY FEED</Text>
              <Text style={styles.bannerSubtitle}>OPERATOR: {operator.alias} // UID: {operator.uid.substring(0, 8)}</Text>
              <View style={styles.bannerDivider} />
            </View>

            {logs.map(log => (
              <View key={log.id} style={styles.logRow}>
                <View style={styles.logMeta}>
                  <Text style={styles.logTimestamp}>[{log.timestamp}]</Text>
                  <Text style={[styles.logSender, log.type === 'command' && styles.senderCmd]}>
                    {log.sender}:
                  </Text>
                </View>
                <Text style={[styles.logBody, log.type === 'command' && styles.bodyCmd]}>
                  {log.body}
                </Text>
                {log.mediaUrl && (
                  <Image source={{ uri: log.mediaUrl }} style={styles.mediaPreview} resizeMode="cover" />
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* COMMAND TRANSMITTER DOCK */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.commandDock}>
          <TouchableOpacity onPress={handlePickAndUploadImage} disabled={uploading}>
            {uploading ? <ActivityIndicator size="small" color="#22c55e" /> : <Paperclip size={18} color="#22c55e" />}
          </TouchableOpacity>

          <TextInput
            style={styles.terminalInput}
            placeholder="Transmit pulse..."
            placeholderTextColor="#15803d"
            value={commandInput}
            onChangeText={setCommandInput}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.transmitBtn, !commandInput.trim() && styles.transmitBtnDisabled]}
            onPress={handleTransmit}
            disabled={!commandInput.trim()}
          >
            <Send size={16} color="#020804" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020804' },
  hudHeader: {
    height: 48,
    backgroundColor: '#051409',
    borderBottomWidth: 1,
    borderBottomColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  hudHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hudTitle: { color: '#22c55e', fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },
  hudHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#020804',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#15803d',
  },
  metricText: { color: '#22c55e', fontSize: 11, fontWeight: 'bold' },
  logoutBtn: { padding: 4 },
  freqBar: { backgroundColor: '#020804', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0e3a1a' },
  freqScroll: { paddingHorizontal: 12, gap: 8 },
  freqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#051409',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#15803d',
    gap: 8,
  },
  activeFreqChip: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  freqText: { color: '#15803d', fontSize: 12, fontWeight: 'bold' },
  activeFreqText: { color: '#020804' },
  terminalContainer: { flex: 1, backgroundColor: '#020804' },
  loaderBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loaderText: { color: '#22c55e', fontSize: 12, letterSpacing: 1 },
  logScrollView: { flex: 1, paddingHorizontal: 16 },
  terminalBanner: { alignItems: 'center', marginVertical: 16 },
  bannerTitle: { color: '#22c55e', fontSize: 14, fontWeight: '900', letterSpacing: 2, marginTop: 8 },
  bannerSubtitle: { color: '#15803d', fontSize: 10, marginTop: 4, letterSpacing: 1 },
  bannerDivider: { width: '60%', height: 1, backgroundColor: '#0e3a1a', marginTop: 12 },
  logRow: { marginBottom: 12 },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  logTimestamp: { color: '#15803d', fontSize: 11 },
  logSender: { color: '#22c55e', fontWeight: 'bold', fontSize: 12 },
  senderCmd: { color: '#38bdf8' },
  logBody: { color: '#4ade80', fontSize: 13, lineHeight: 18 },
  bodyCmd: { color: '#bae6fd' },
  mediaPreview: { width: 220, height: 140, borderRadius: 6, marginTop: 8, borderWidth: 1, borderColor: '#15803d' },
  commandDock: {
    margin: 12,
    backgroundColor: '#051409',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#22c55e',
    gap: 10,
  },
  terminalInput: { flex: 1, color: '#22c55e', paddingVertical: 12, fontSize: 13 },
  transmitBtn: { backgroundColor: '#22c55e', padding: 8, borderRadius: 6 },
  transmitBtnDisabled: { backgroundColor: '#0e3a1a' },
});
