import {
  createContext, useCallback, useContext, useRef, ReactNode,
} from 'react';
import {
  Dimensions, Keyboard, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { colors, spacing, radius } from '@/constants/theme';

type Ctx = { ensureVisible: (input: TextInput | null) => void };
const FormScrollContext = createContext<Ctx>({ ensureVisible: () => {} });

export const useFormScroll = () => useContext(FormScrollContext);

/**
 * Scrollable form container that guarantees the field you're typing in stays
 * above the keyboard.
 *
 * When an input gains focus we measure where it sits on screen, compare that
 * against the top of the keyboard, and scroll by exactly the overlap.
 */
export default function FormScroll({ children }: { children: ReactNode }) {
  const scrollRef = useRef<ScrollView>(null);
  const offsetY = useRef(0);
  const focused = useRef<TextInput | null>(null);

  const scrollFocusedIntoView = useCallback(() => {
    const input = focused.current;
    if (!input) return;

    const metrics = Keyboard.metrics();
    const screenHeight = Dimensions.get('window').height;
    // If the keyboard hasn't reported yet, assume a typical iPhone keyboard
    const keyboardTop = metrics ? metrics.screenY : screenHeight - 336;

    input.measureInWindow((_x, y, _w, h) => {
      const inputBottom = y + h;
      const overlap = inputBottom - keyboardTop + 24; // 24px breathing room
      if (overlap > 0) {
        scrollRef.current?.scrollTo({
          y: offsetY.current + overlap,
          animated: true,
        });
      }
    });
  }, []);

  const ensureVisible = useCallback(
    (input: TextInput | null) => {
      focused.current = input;
      // Wait for the keyboard animation to report its position
      setTimeout(scrollFocusedIntoView, 60);
      setTimeout(scrollFocusedIntoView, 350);
    },
    [scrollFocusedIntoView]
  );

  return (
    <FormScrollContext.Provider value={{ ensureVisible }}>
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => { offsetY.current = e.nativeEvent.contentOffset.y; }}
      >
        {children}
      </ScrollView>
    </FormScrollContext.Provider>
  );
}

/** Labelled text input that scrolls itself into view when focused. */
export function FormInput(props: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'email-address';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'characters' | 'words';
  maxLength?: number;
}) {
  const { ensureVisible } = useFormScroll();
  const ref = useRef<TextInput>(null);

  return (
    <View style={{ marginBottom: spacing.md }}>
      {props.label ? <Text style={styles.label}>{props.label}</Text> : null}
      <TextInput
        ref={ref}
        style={[styles.input, props.multiline && styles.multiline]}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textMuted}
        value={props.value}
        onChangeText={props.onChange}
        keyboardType={props.keyboardType ?? 'default'}
        multiline={props.multiline}
        autoCapitalize={props.autoCapitalize}
        maxLength={props.maxLength}
        onFocus={() => ensureVisible(ref.current)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  // Big bottom pad so even the last field can scroll clear of the keyboard
  content: { padding: spacing.lg, paddingBottom: 380 },
  label: { color: colors.textMuted, marginBottom: spacing.xs, fontSize: 13 },
  input: {
    backgroundColor: colors.card, color: colors.text, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder,
  },
  multiline: { height: 90, textAlignVertical: 'top' },
});
