// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { create } from "zustand";

// Research panel tab types
export type ResearchTabType = "knowledge" | "api" | "analysis";

// UI state store for managing active tabs and replay mode
export interface UIState {
  // Research panel active tab
  activeTab: ResearchTabType;
  
  // Replay mode for chat
  isReplayMode: boolean;
  
  // Actions
  setActiveTab: (tab: ResearchTabType) => void;
  setReplayMode: (isReplay: boolean) => void;
  
  // Utility function to map tool call tabId to research tab
  switchToToolCallTab: (toolCallTabId: string) => void;
}

// Map tool call tabIds to research panel tabs
const TOOL_CALL_TAB_MAPPING: Record<string, ResearchTabType> = {
  knowledge: "knowledge",
  troubleshooting: "api", 
  tools: "knowledge" // Default fallback
};

export const useUIStore = create<UIState>((set) => ({
  activeTab: "knowledge",
  isReplayMode: false,
  
  setActiveTab: (tab: ResearchTabType) => set({ activeTab: tab }),
  
  setReplayMode: (isReplay: boolean) => set({ isReplayMode: isReplay }),
  
  switchToToolCallTab: (toolCallTabId: string) => {
    const mappedTab = TOOL_CALL_TAB_MAPPING[toolCallTabId];
    if (mappedTab) {
      set({ activeTab: mappedTab });
    }
  }
}));