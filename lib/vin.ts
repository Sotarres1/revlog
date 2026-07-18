// Free VIN decoding via the US government's NHTSA vPIC API (no key required)

export type VinResult = {
  year: string;
  make: string;
  model: string;
  trim: string;
  specs: Record<string, string>;
  error: string | null;
};

export async function decodeVin(vin: string): Promise<VinResult> {
  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin.trim())}?format=json`
  );
  const json = await res.json();
  const r = json.Results?.[0] ?? {};

  // ErrorCode "0" means a clean decode; anything else has a message in ErrorText
  const hasError = r.ErrorCode && r.ErrorCode !== '0' && !r.Make;

  const specs: Record<string, string> = {};
  const add = (label: string, value?: string) => {
    if (value && value.trim() && value !== 'Not Applicable') specs[label] = value.trim();
  };

  add('Engine', [
    r.DisplacementL ? `${parseFloat(r.DisplacementL).toFixed(1)}L` : '',
    r.EngineConfiguration === 'V-Shaped' ? `V${r.EngineCylinders}` :
      r.EngineCylinders ? `${r.EngineCylinders}-cyl` : '',
    r.EngineModel,
  ].filter(Boolean).join(' '));
  add('Horsepower', r.EngineHP ? `${r.EngineHP} hp` : '');
  add('Fuel', r.FuelTypePrimary);
  add('Transmission', [r.TransmissionSpeeds ? `${r.TransmissionSpeeds}-speed` : '', r.TransmissionStyle].filter(Boolean).join(' '));
  add('Drive', r.DriveType);
  add('Body', [r.BodyClass, r.Doors ? `${r.Doors}-door` : ''].filter(Boolean).join(', '));
  add('Built in', [r.PlantCity, r.PlantCountry].filter(Boolean).join(', '));

  return {
    year: r.ModelYear ?? '',
    make: r.Make ? titleCase(r.Make) : '',
    model: r.Model ?? '',
    trim: r.Trim ?? '',
    specs,
    error: hasError ? (r.ErrorText ?? 'Could not decode this VIN') : null,
  };
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
