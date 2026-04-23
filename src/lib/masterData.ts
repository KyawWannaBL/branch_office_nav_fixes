export type PartyProfile = {
  id: string;
  type: 'merchant' | 'customer';
  businessName: string;
  contactName: string;
  phone: string;
  address: string;
  township: string;
  city: string;
};

export const PARTY_MASTER: PartyProfile[] = [
  { id: 'MER-001', type: 'merchant', businessName: 'Baby Kyaw', contactName: 'Baby Kyaw', phone: '09 421 000 111', address: 'No. 12, Pyay Road', township: 'Kamayut', city: 'Yangon' },
  { id: 'MER-002', type: 'merchant', businessName: 'HAIM', contactName: 'Zaw Min Htun', phone: '09 421 000 222', address: 'Bo Yar Nyunt Road', township: 'Mingalar Taung Nyunt', city: 'Yangon' },
  { id: 'MER-003', type: 'merchant', businessName: 'Best Buy in Rangoon', contactName: 'Shwe Zin', phone: '09 421 000 333', address: 'Yuzana Plaza', township: 'Mingalar Taung Nyunt', city: 'Yangon' },
  { id: 'MER-004', type: 'merchant', businessName: 'Mee Lay', contactName: 'Mee Lay', phone: '09 421 000 444', address: 'Mahar Myaing Street', township: 'Sanchaung', city: 'Yangon' },
  { id: 'CUS-001', type: 'customer', businessName: 'Daw Hla', contactName: 'Daw Hla', phone: '09 445 778 112', address: 'No. 8, Lanmadaw', township: 'Lanmadaw', city: 'Yangon' },
  { id: 'CUS-002', type: 'customer', businessName: 'Ko Min Thu', contactName: 'Ko Min Thu', phone: '09 773 990 008', address: 'Chan Aye Tharzan', township: 'Chan Aye Tharzan', city: 'Mandalay' },
  { id: 'CUS-003', type: 'customer', businessName: 'Ma Ei Ei', contactName: 'Ma Ei Ei', phone: '09 550 222 116', address: 'Thuwunna Main Road', township: 'Thingangyun', city: 'Yangon' }
];

export const CITY_TOWNSHIP_MASTER = {
  Yangon: ['Lanmadaw', 'Latha', 'Pabedan', 'Mingalar Taung Nyunt', 'Kamayut', 'Mayangone', 'Sanchaung', 'Thingangyun', 'Bahan', 'Tamwe'],
  Mandalay: ['Chan Aye Tharzan', 'Maha Aung Myay', 'Aung Myay Tharzan', 'Pyigyidagun'],
  Naypyidaw: ['Zabuthiri', 'Dekkhinathiri']
} as const;

export const CITY_OPTIONS = Object.keys(CITY_TOWNSHIP_MASTER);

export function getTownshipsByCity(city: string): string[] {
  return [...((CITY_TOWNSHIP_MASTER as Record<string, readonly string[]>)[city] || [])];
}

export function searchPartyProfiles(query: string, type?: PartyProfile['type']): PartyProfile[] {
  const q = query.trim().toLowerCase();
  return PARTY_MASTER.filter((row) => {
    if (type && row.type !== type) return false;
    if (!q) return true;
    return [row.businessName, row.contactName, row.phone, row.address, row.township, row.city]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
}

export function findPartyByBusinessName(name: string): PartyProfile | null {
  const q = name.trim().toLowerCase();
  return PARTY_MASTER.find((row) => row.businessName.trim().toLowerCase() === q) || null;
}
