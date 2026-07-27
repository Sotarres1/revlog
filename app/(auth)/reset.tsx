import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius } from '@/constants/theme';

export default function ResetPassword() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Enter the email you signed up with.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setBusy(false);
    if (error) Alert.alert('Error', error.message);
    else {
      setStep('code');
      Alert.alert('Check your email', 'We sent you a 6-digit reset code.');
    }
  }

  async function confirmReset() {
    if (code.length < 6 || newPassword.length < 8) {
      Alert.alert('Missing info', 'Enter the 6-digit code and a new password (8+ characters).');
      return;
    }
    setBusy(true);
    // Verify the code — this signs you in
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'recovery',
    });
    if (otpError) {
      setBusy(false);
      Alert.alert('Invalid code', otpError.message);
      return;
    }
    // Now set the new password
    const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (pwError) Alert.alert('Error', pwError.message);
    else Alert.alert('Password updated', 'You are now signed in.');
    // Root layout redirects to the garage automatically
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset password</Text>

      {step === 'email' ? (
        <>
          <Text style={styles.hint}>
            Enter your email and we'll send you a 6-digit reset code.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TouchableOpacity style={styles.button} onPress={sendCode} disabled={busy}>
            <Text style={styles.buttonText}>{busy ? 'Sending…' : 'Send Code'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.hint}>
            Enter the code from your email and choose a new password.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit code"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
          <TextInput
            style={styles.input}
            placeholder="New password (8+ characters)"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity style={styles.button} onPress={confirmReset} disabled={busy}>
            <Text style={styles.buttonText}>{busy ? 'Updating…' : 'Set New Password'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={sendCode} disabled={busy}>
            <Text style={styles.link}>Resend code</Text>
          </TouchableOpacity>
        </>
      )}

      <Link href="/(auth)/login" style={styles.link}>
        Back to sign in
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.lg },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: spacing.md },
  hint: { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.card, color: colors.text, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.cardBorder,
  },
  button: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
});
