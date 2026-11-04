export interface HospitalNotifications {
  email: boolean;
  sms: boolean;
  newBooking: boolean;
  cancellation: boolean;
  daily: boolean;
}

export interface HospitalSettings {
  hospitalName: string;
  shortName: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  region: string;
  country: string;
  about: string;
  opdOpen: string;
  opdClose: string;
  slotLength: string;
  departments: string[];
  notifications: HospitalNotifications;
}

export const SETTINGS_FIELDS = `
  hospitalName
  shortName
  phone
  email
  website
  address
  region
  country
  about
  opdOpen
  opdClose
  slotLength
  departments
  notifications { email sms newBooking cancellation daily }
`;

export const EMPTY_SETTINGS: HospitalSettings = {
  hospitalName: "",
  shortName: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  region: "",
  country: "",
  about: "",
  opdOpen: "",
  opdClose: "",
  slotLength: "",
  departments: [],
  notifications: {
    email: true,
    sms: false,
    newBooking: true,
    cancellation: true,
    daily: false,
  },
};

export const HOSPITAL_FIELDS: { key: keyof HospitalSettings; label: string }[] = [
  { key: "hospitalName", label: "Hospital name" },
  { key: "shortName", label: "Short name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
  { key: "address", label: "Address" },
  { key: "region", label: "Region" },
  { key: "country", label: "Country" },
];
