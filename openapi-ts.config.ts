import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: process.env.SILATSENSE_OPENAPI_PATH ?? "../silatsense-be/docs/openapi.json",
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

