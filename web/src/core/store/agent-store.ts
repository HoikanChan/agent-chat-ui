// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { nanoid } from "nanoid";
import { create } from "zustand";

export interface ToolCall {
  content: string;
  label: string;
}

export interface Reasoning{
  content: string;
  label: string;
}

export interface Message {
  id: string;
  threadId: string;
  agentType?: 'planning' | 'troubleshooting' | 'summarizing';
  role: 'user' | 'assistant'; // 支持用户和助手角色
  
  // 消息内容 (content) - for planning and summarizing agents
  content?: string;
  contentChunks?: string[];
  
  // 推理内容数组 (reasoning) - for troubleshooting agent, supports multiple reasoning processes
  reasoningContent?: Reasoning[];
  // 记录当前推理内容的chunk
  reasoningContentChunks?: string[];
  
  // 工具调用 (tool calls)
  toolCalls?: ToolCall[];
  
  isStreaming?: boolean;
  finishReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useStore = create<{
  messageIds: string[];
  messages: Map<string, Message>;
  isResponding: boolean;

  appendMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  updateMessages: (messages: Message[]) => void;
  deleteMessage: (id: string) => void;
  setResponding: (responding: boolean) => void;
}>((set, get) => ({
  messageIds: [],
  messages: new Map<string, Message>(),
  isResponding: false,

  appendMessage(message: Message) {
    set((state) => ({
      messageIds: [...state.messageIds, message.id],
      messages: new Map(state.messages).set(message.id, message),
    }));
  },

  updateMessage(message: Message) {
    set((state) => ({
      messages: new Map(state.messages).set(message.id, { 
        ...message, 
        updatedAt: new Date() 
      }),
    }));
  },

  updateMessages(messages: Message[]) {
    set((state) => {
      const newMessages = new Map(state.messages);
      messages.forEach((m) => newMessages.set(m.id, { 
        ...m, 
        updatedAt: new Date() 
      }));
      return { messages: newMessages };
    });
  },

  deleteMessage(id: string) {
    set((state) => {
      const newMessages = new Map(state.messages);
      newMessages.delete(id);
      const newMessageIds = state.messageIds.filter(msgId => msgId !== id);
      
      return {
        messageIds: newMessageIds,
        messages: newMessages,
      };
    });
  },

  setResponding(responding: boolean) {
    set({ isResponding: responding });
  },
}));

export function appendMessage(message: Message) {
  useStore.getState().appendMessage(message);
}

export function updateMessage(message: Message) {
  useStore.getState().updateMessage(message);
}

export function setResponding(responding: boolean) {
  useStore.getState().setResponding(responding);
}

// 独立的 sendMessage 函数，复用 chatStream 工具
export async function sendMessage(content: string, options: { abortSignal?: AbortSignal } = {}) {
  const store = useStore.getState();
  const threadId = nanoid();
  
  // Add user message first
  const userMessage: Message = {
    id: nanoid(),
    threadId,
    role: 'user', // 用户消息
    content,
    contentChunks: [content],
    reasoningContent: [],
    reasoningContentChunks: [],
    isStreaming: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.appendMessage(userMessage);

  store.setResponding(true);
  let currentMessageId: string | undefined;

  try {
    const response = await fetch("http://localhost:3001/freestyle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: content,
      }),
      signal: options.abortSignal,
    });

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let currentAgent: 'planning' | 'troubleshooting' | 'summarizing' = 'planning';
    let currentMessage: Message | undefined;
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      buffer += chunk;

      // 处理 SSE 格式数据，每个事件以双换行符结束
      while (true) {
        const eventEnd = buffer.indexOf('\n\n');
        if (eventEnd === -1) break;

        const eventData = buffer.slice(0, eventEnd);
        buffer = buffer.slice(eventEnd + 2);

        const lines = eventData.split('\n');
        for (const line of lines) {
          if (line.trim() === '' || line === 'data: [DONE]') continue;

          // 解析 SSE 格式: data: {"label":"...", "content":..., "return_type":"..."}
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(6)); // 移除 "data: " 前缀
              const { label, content, return_type } = jsonData;

              console.log('收到数据:', { label, return_type, contentType: typeof content });

              // 根据 label 确定 agent 类型
              if (label.includes('planning_agent')) {
                currentAgent = 'planning';
              } else if (label.includes('troubleshooting_agent')) {
                currentAgent = 'troubleshooting';
              } else if (label.includes('summarizing') || label.includes('final_summarizer')) {
                currentAgent = 'summarizing';
              }

              // 创建新消息或更新现有消息 - 所有agent响应都是assistant角色
              if (!currentMessage || currentMessage.agentType !== currentAgent) {
                currentMessageId = nanoid();
                currentMessage = {
                  id: currentMessageId,
                  threadId,
                  agentType: currentAgent,
                  role: 'assistant', // 所有agent响应都是assistant角色
                  content: '',
                  contentChunks: [],
                  reasoningContent: [],
                  reasoningContentChunks: [],
                  toolCalls: [],
                  isStreaming: true,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                store.appendMessage(currentMessage);
                console.log('创建新消息:', currentAgent);
              }

              // 根据事件类型和 return_type 处理内容
              const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

              // 辅助函数：添加到消息内容
              const addToContent = () => {
                if (!currentMessage) return;
                if (!currentMessage.content) currentMessage.content = '';
                if (!currentMessage.contentChunks) currentMessage.contentChunks = [];
                currentMessage.content += contentStr + '\n';
                currentMessage.contentChunks.push(contentStr);
              };

              // 辅助函数：添加到推理内容
              const addToReasoning = () => {
                if (!currentMessage) return;
                if (!currentMessage.reasoningContent) currentMessage.reasoningContent = [];
                if (!currentMessage.reasoningContentChunks) currentMessage.reasoningContentChunks = [];
                
                // 过滤掉流式接口的begin和end事件
                if (contentStr.includes('[begin]') || contentStr.includes('[end]') || 
                    contentStr.trim() === 'begin' || contentStr.trim() === 'end') {
                  return;
                }
                
                // 查找是否已存在相同label的reasoning
                const existingReasoning = currentMessage.reasoningContent.find(r => r.label === label);
                if (existingReasoning) {
                  // 合并到现有的reasoning对象中
                  existingReasoning.content += contentStr + '\n';
                } else {
                  // 创建新的reasoning对象
                  const reasoning: Reasoning = {
                    label: label,
                    content: contentStr + '\n',
                  };
                  currentMessage.reasoningContent.push(reasoning);
                }
                currentMessage.reasoningContentChunks.push(contentStr);
              };

              // 辅助函数：添加工具调用
              const addToolCall = () => {
                if (!currentMessage) return;
                const toolCall: ToolCall = {
                  label: label,
                  content: contentStr,
                };
                currentMessage.toolCalls = [...(currentMessage.toolCalls || []), toolCall];
              };

              // 根据label类型处理数据
              switch (label) {
                // Planning Agent
                case 'planning_agent_troubleshooting_text':
                  addToContent();
                  break;
                case 'planning_agent_knowledge':
                  addToolCall();
                  break;

                // Troubleshooting Agent
                case 'troubleshooting_agent_model_thinking':
                  addToReasoning();
                  break;
                case 'troubleshooting_agent_refined_apis':
                  addToReasoning();
                  break;
                case 'troubleshooting_agent_code_thinking':
                  addToReasoning();
                  break;
                case 'troubleshooting_agent_mock_status_done':
                  addToolCall();
                  break;

                // Summarizing Agent
                case 'summarizing_agent_result':
                  addToContent();
                  break;

                // 流式内容处理
                default:
                  if (return_type === 'stream') {
                    // 流式内容也过滤begin/end事件
                    if (!(contentStr.includes('[begin]') || contentStr.includes('[end]') || 
                          contentStr.trim() === 'begin' || contentStr.trim() === 'end')) {
                      addToReasoning();
                    }
                  } else {
                    // 其他未知类型默认添加到内容
                    addToContent();
                  }
                  break;
              }

              if (currentMessage) {
                store.updateMessage(currentMessage);
                console.log('更新消息:', { 
                  agent: currentAgent, 
                  role: currentMessage.role,
                  contentLength: currentMessage.content?.length || 0,
                  reasoningLength: currentMessage.reasoningContent?.length || 0,
                  toolCallsCount: currentMessage.toolCalls?.length || 0
                });
              }

            } catch (error) {
              console.error('解析 SSE 数据失败:', error, 'Line:', line);
            }
          }
        }
      }
    }

    // Mark final message as completed
    if (currentMessage) {
      currentMessage.isStreaming = false;
      currentMessage.finishReason = 'completed';
      store.updateMessage(currentMessage);
    }

  } catch (error) {
    console.error('Error in sendMessage:', error);
    if (currentMessageId) {
      const message = store.messages.get(currentMessageId);
      if (message?.isStreaming) {
        message.isStreaming = false;
        message.finishReason = 'error';
        store.updateMessage(message);
      }
    }
  } finally {
    store.setResponding(false);
  }
}