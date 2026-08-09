import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Send, X, Lock } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onStartDm: (targetUid: string, targetAlias: string) => void;
}

export const DirectMessageModal: React.FC<Props> = ({ visible, onClose, onStartDm }) => {
  const [targetUid, setTargetUid] = useState('');
  const [targetAlias, setTargetAlias] = useState('');

  const handleConnect = () => {
    if (!targetUid.trim() || !targetAlias.trim()) return;
    onStartDm(targetUid.trim(), targetAlias.trim().toUpperCase());
    setTargetUid('');
    setTargetAlias('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Lock size={16} color="#22c55e" />
              <Text style={styles.headerTitle}>// DIRECT_FREQUENCY_LINK</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color="#22c55e" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subText}>Enter the Operator UID and Alias to open a 1-on-1 encrypted channel.</Text>

          <TextInput
            style={styles.input}
            placeholder="Target Operator UID..."
            placeholderTextColor="#15803d"
            value={targetUid}
            onChangeText={setTargetUid}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Target Operator Alias (e.g. CYPHER)..."
            placeholderTextColor="#15803d"
            value={targetAlias}
            onChangeText={setTargetAlias}
            autoCapitalize="characters"
          />

          <TouchableOpacity style={styles.connectBtn} onPress={handleConnect}>
            <Send size={14} color="#020804" />
            <Text style={styles.connectBtnText}>ESTABLISH DIRECT LINK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(2, 8, 4, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalBox: { width: '100%', maxWidth: 380, backgroundColor: '#051409', borderRadius: 8, borderWidth: 1, borderColor: '#22c55e', padding: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#22c55e', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  subText: { color: '#15803d', fontSize: 11, marginBottom: 14 },
  input: { backgroundColor: '#020804', borderBottomWidth: 1, borderBottomColor: '#22c55e', color: '#22c55e', paddingVertical: 10, paddingHorizontal: 8, fontSize: 13, marginBottom: 12 },
  connectBtn: { backgroundColor: '#22c55e', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 4, marginTop: 6 },
  connectBtnText: { color: '#020804', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
});
