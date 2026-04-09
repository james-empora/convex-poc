import type { AuthConfig } from "convex/server";

const domain = process.env.AUTH0_DOMAIN;
const clientId = process.env.AUTH0_CLIENT_ID;

if (!domain || !clientId) {
  throw new Error("Convex auth requires AUTH0_DOMAIN and AUTH0_CLIENT_ID");
}

export default {
  providers: [
    {
      domain,
      applicationID: clientId,
    },
  ],
} satisfies AuthConfig;
