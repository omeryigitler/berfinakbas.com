const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
const fallbackSiteUrl = vercelProductionUrl
  ? `https://${vercelProductionUrl}`
  : "https://berfinakbas-com.vercel.app";

export const publicSiteUrl = new URL(configuredSiteUrl || fallbackSiteUrl);
