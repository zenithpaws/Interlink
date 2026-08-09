import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Send, X, Lock } from 'lucide-react-native';
import { getOperatorByAlias } from '../services/matrixService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onStartDm: (targetAlias: string) => void;
}

export const DirectMessageModal: React.FC<Props> = ({ visible, onClose, onStartDm }) => {
  const [targetAlias, setTargetAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleConnect = async () => {
    const trimmed = targetAlias.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const targetUser = await getOperatorByAlias(trimmed);
      
      if (!targetUser) {
        setErrorMsg(`OPERATOR '${trimmed}' NOT FOUND IN MATRIX DIRECTORY.`);
        setLoading(false);
        return;
      }

      onStartDm(trimmed);
      setTargetAlias('');
      setErrorMsg('');
      onClose();
    } catch (err) {
      console.error('Lookup failed:', err);
      setErrorMsg('SIGNAL INTERRUPTED. COULD NOT VERIFY ALIAS.');
    } finally {
      setLoading(false);
    }
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

          <Text style={styles.subText}>Enter target Operator Username to open an encrypted channel.</Text>

          <TextInput
            style={styles.input}
            placeholder="Username (e.g. CYPHER)..."
            placeholderTextColor="#15803d"
            value={targetAlias}
            onChangeText={(txt) => {
              setTargetAlias(txt);
              setErrorMsg('');
            }}
            onSubmitEditing={handleConnect}
            returnKeyType="done"
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TouchableOpacity style={styles.connectBtn} onPress={handleConnect} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#020804" />
            ) : (
              <>
                <Send size={14} color="#020804" />
                <Text style={styles.connectBtnText}>ESTABLISH DIRECT LINK</Text>
              </>
            )}
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
  input: { backgroundColor: '#020804', borderBottomWidth: 1, borderBottomColor: '#22c55e', color: '#22c55e', paddingVertical: 10, paddingHorizontal: 8, fontSize: 13, marginBottom: 10 },
  errorText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
  connectBtn: { backgroundColor: '#22c55e', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 4, marginTop: 4 },
  connectBtnText: { color: '#020804', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
});