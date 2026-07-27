import { useState } from 'react';
import { Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import FormScroll, { FormInput } from '@/components/FormScroll';
import { colors, spacing, radius } from '@/constants/theme';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function signUp() {
    if (password.length < 8) {
      Alert.alert('Weak password', 'Use at least 8 characters.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) Alert.alert('Sign up failed', error.message);
    else Alert.alert('Account created', 'You can sign in now.');
  }

  return (
    <FormScroll centered>
      <Text style={styles.title}>Create your garage</Text>

      <FormInput
        label=""
        placeholder="Email"
        value={email}
        onChange={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <FormInput
        label=""
        placeholder="Password (8+ characters)"
        value={password}
        onChange={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={signUp} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Creating…' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" style={styles.link}>
        Already have an account? Sign in
      </Link>
    </FormScroll>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: spacing.xl },
  button: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
});
