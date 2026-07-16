const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const publicSiteUrl = new URL(configuredSiteUrl || "https://berfinakbas.com");
