import { APP_DOMAIN, APP_PROTOCOL } from "./api";

export const metadata = {
  name: "Membrane Bridge",
  shortName: "Membrane",
  description: "Bridge assets to Osmosis via Membrane. Powered by Skip:Go.",
  domain: APP_DOMAIN,
  email: "",
  images: [{ url: `${APP_PROTOCOL}://${APP_DOMAIN}/social-thumbnail.png` }],
  url: `${APP_PROTOCOL}://${APP_DOMAIN}`,
  github: {
    username: "triccs",
    url: "https://github.com/triccs/skip-go-app",
  },
  twitter: {
    username: "@insaborable_",
    url: "https://twitter.com/insaborable_",
  },
  themeColor: "#6943FF",
};
