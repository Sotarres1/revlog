import { useState } from 'react';
import { Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Link, type Href } from 'expo-router';
import { supabase } from '@/lib/supabase';
import FormScroll, { FormInput } from '@/components/FormScroll';
import { colors, spacing, radius } from '@/constants/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) Alert.alert('Sign in failed', error.message);
  }

  return (
    <FormScroll centered>
      <Text style={styles.logo}>Rev<Text style={{ color: colors.accent }}>Log</Text></Text>
      <Text style={styles.tagline}>Every mile. Every wrench. Logged.</Text>

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
        placeholder="Password"
        value={password}
        onChange={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={signIn} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Signing in…' : 'Sign In'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/signup" style={styles.link}>
        New here? Create an account
      </Link>
      <Link href={'/(auth)/reset' as Href} style={styles.link}>
        Forgot password?
      </Link>
    </FormScroll>
  );
}

const styles = StyleSheet.create({
  logo: { fontSize: 42, fontWeight: '800', color: colors.text, textAlign: 'center' },
  tagline: { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  button: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
});
