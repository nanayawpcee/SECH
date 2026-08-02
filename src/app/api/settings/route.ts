import { NextResponse } from "next/server";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { SETTINGS_FIELDS, type HospitalSettings } from "@/lib/wp-settings";

export const dynamic = "force-dynamic";

const GET_SETTINGS = `query HospitalSettingsQuery { hospitalSettings { ${SETTINGS_FIELDS} } }`;

/** Readable without auth — the plugin exposes no private data here. */
export async function GET() {
  try {
    const data = await wpGraphQL<{ hospitalSettings: HospitalSettings }>(GET_SETTINGS);
    return NextResponse.json({ settings: data.hospitalSettings });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const UPDATE_SETTINGS = `
  mutation UpdateHospitalSettingsMutation(
    $hospitalName: String, $shortName: String, $phone: String, $email: String,
    $website: String, $address: String, $region: String, $country: String,
    $about: String, $opdOpen: String, $opdClose: String, $slotLength: String,
    $departments: [String], $notifications: HospitalNotificationSettingsInput
  ) {
    updateHospitalSettings(input: {
      hospitalName: $hospitalName, shortName: $shortName, phone: $phone, email: $email,
      website: $website, address: $address, region: $region, country: $country,
      about: $about, opdOpen: $opdOpen, opdClose: $opdClose, slotLength: $slotLength,
      departments: $departments, notifications: $notifications
    }) {
      settings { ${SETTINGS_FIELDS} }
    }
  }
`;

export async function PUT(request: Request) {
  try {
    const patch = (await request.json()) as Partial<HospitalSettings>;

    const data = await wpGraphQL<{
      updateHospitalSettings: { settings: HospitalSettings };
    }>(
      UPDATE_SETTINGS,
      {
        hospitalName: patch.hospitalName,
        shortName: patch.shortName,
        phone: patch.phone,
        email: patch.email,
        website: patch.website,
        address: patch.address,
        region: patch.region,
        country: patch.country,
        about: patch.about,
        opdOpen: patch.opdOpen,
        opdClose: patch.opdClose,
        slotLength: patch.slotLength,
        departments: patch.departments,
        notifications: patch.notifications,
      },
      { authenticated: true },
    );

    return NextResponse.json({ settings: data.updateHospitalSettings.settings });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
