import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';


const nextConfig: NextConfig = {
  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
  }
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");


export default withNextIntl(nextConfig);
