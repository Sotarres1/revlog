import { useState } from 'react';
import { Image, Text } from 'react-native';

// Free car-logo dataset hosted on GitHub (no API key).
// Make name -> URL slug: "Alfa Romeo" -> "alfa-romeo"
function makeToSlug(make: string): string {
  return make
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function logoUrl(make: string): string {
  return `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/${makeToSlug(make)}.png`;
}

export default function MakeLogo({ make, size = 64 }: { make: string; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (!make || failed) {
    return <Text style={{ fontSize: size * 0.6 }}>🚗</Text>;
  }
  return (
    <Image
      source={{ uri: logoUrl(make) }}
      style={{ width: size, height: size }}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
}
