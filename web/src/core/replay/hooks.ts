// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";

import { env } from "~/env";

import { extractReplayIdFromSearchParams } from "./get-replay-id";

export function useReplay() {
  const [searchParams] = useSearchParams();
  const replayId = useMemo(
    () => extractReplayIdFromSearchParams(searchParams.toString()),
    [searchParams],
  );
  return {
    isReplay: replayId != null || env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY,
    replayId,
  };
}
