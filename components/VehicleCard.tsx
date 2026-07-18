import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Vehicle } from '@/lib/types';
import MakeLogo from '@/components/MakeLogo';
import { colors, spacing, radius } from '@/constants/theme';

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const displayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/vehicle/${vehicle.id}`)}
    >
      {vehicle.photo_url ? (
        <Image source={{ uri: vehicle.photo_url }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <MakeLogo make={vehicle.make} size={112} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.sub}>
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.trim ? ` ${vehicle.trim}` : ''}
        </Text>
        <Text style={styles.mileage}>{vehicle.current_mileage.toLocaleString()} mi</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden',
  },
  photo: { width: '100%', height: 160 },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardBorder },
  info: { padding: spacing.md },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.textMuted, marginTop: 2 },
  mileage: { color: colors.accent, marginTop: spacing.sm, fontWeight: '600' },
});
