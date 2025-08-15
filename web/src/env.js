// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Environment variables for Vite
export const env = {
  NODE_ENV: import.meta.env.MODE,
  NEXT_PUBLIC_API_URL: import.meta.env.VITE_API_URL,
  NEXT_PUBLIC_STATIC_WEBSITE_ONLY: import.meta.env.VITE_STATIC_WEBSITE_ONLY === 'true',
  AMPLITUDE_API_KEY: import.meta.env.VITE_AMPLITUDE_API_KEY,
  GITHUB_OAUTH_TOKEN: import.meta.env.VITE_GITHUB_OAUTH_TOKEN,
};
