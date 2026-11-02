import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "https://silatsense-be.vercel.app/openapi.json",
  output: "src/api",
  plugins: [
    {
      name: "@hey-api/client-fetch",
      runtimeConfigPath: "./src/hey-api",
    },
    "zod",
    { name: "@hey-api/sdk", validator: true },
    "@tanstack/react-query",
  ],
});
