import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "https://silatsense-be.vercel.app/openapi.json",
  output: "src/api",
  plugins: [
    "@hey-api/client-fetch",
    "zod",
    { name: "@hey-api/sdk", validator: true }, // validates requests/responses with Zod
    "@tanstack/react-query",
  ],
});
