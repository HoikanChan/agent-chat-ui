// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useCallback, useMemo } from "react";
import { cn } from "~/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ScrollContainer } from "~/components/deer-flow/scroll-container";
import { Tooltip } from "~/components/deer-flow/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Markdown } from "~/components/deer-flow/markdown";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { ChevronRight, BookOpen, Activity, CheckCircle, FileText, Copy, X, Check } from "lucide-react";
import { motion } from "framer-motion";
import React, { useState } from "react";

import type { Message } from '~/core/store/agent-store';
import { useUIStore } from '~/core/store/ui-store';

interface BotResearchBlockProps {
  className?: string;
  messages: Message[];
}

// Tab configuration for research block
const RESEARCH_TABS = {
  knowledge: {
    label: "知识卡片",
    icon: BookOpen,
    description: "相关知识和背景信息",
    color: "text-blue-500"
  },
  api: {
    label: "api结果", 
    icon: Activity,
    description: "网络状态检查API结果",
    color: "text-green-500"
  },
  analysis: {
    label: "分析过程",
    icon: FileText,
    description: "根因分析过程",
    color: "text-purple-500"
  }
};

// Map data labels to research tabs
function getResearchTab(label: string): keyof typeof RESEARCH_TABS | null {
  switch (label) {
    case "planning_agent_knowledge":
      return "knowledge";
    case "summarizing_agent_result": 
      return "analysis";
    case "troubleshooting_agent_mock_status_done":
      return "api";
    default:
      return null;
  }
}

function getBotName(label: string): string {
  switch (label) {
    case "planning_agent_knowledge":
      return "知识查询机器人";
    case "summarizing_agent_result":
      return "根因分析机器人";
    case "troubleshooting_agent_mock_status_done":
      return "网络状态感知机器人";
    default:
      return "AI机器人";
  }
}

// New render function for tool calls
function renderToolCalls(tabType: keyof typeof RESEARCH_TABS, toolCalls: Array<{label: string, content: string}>) {
  if (toolCalls.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          {React.createElement(RESEARCH_TABS[tabType].icon, { 
            className: "w-12 h-12 mx-auto mb-3 opacity-50",
            style: { color: RESEARCH_TABS[tabType].color }
          })}
          <p className="text-sm">{RESEARCH_TABS[tabType].label}</p>
          <p className="text-xs mt-1">暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {toolCalls.map((toolCall, index) => {
        let content;
        try {
          content = JSON.parse(toolCall.content);
        } catch {
          content = toolCall.content;
        }

        return (
          <motion.div
            key={`${toolCall.label}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="prose prose-sm max-w-none text-base">
              {renderContent(content, "normal")}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function renderContent(content: any, returnType: string) {
  if (returnType === "stream" && Array.isArray(content)) {
    return (
      <div className="space-y-2">
        {content.map((item, index) => (
          <div key={index} className="text-sm">
            {typeof item === "string" ? (
              <Markdown>{item}</Markdown>
            ) : (
              <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">
                {JSON.stringify(item, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (typeof content === "string") {
    return <Markdown>{content}</Markdown>;
  }

  if (typeof content === "object" && content !== null) {
    // Handle structured content like knowledge sections
    if (content.title && content.sections) {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold">{content.title}</h3>
          {content.sections.map((section: any, index: number) => (
            <div key={index} className="space-y-2">
              {section.subtitle && (
                <h4 className="font-medium text-sm">{section.subtitle}</h4>
              )}
              {Array.isArray(section.content) ? (
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {section.content.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <Markdown>{section.content}</Markdown>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Handle root cause analysis
    if (content.root_cause_analysis) {
      const analysis = content.root_cause_analysis;
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs px-2 py-1">
              置信度: {analysis.confidence}
            </Badge>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />主要原因
              </h4>
              <p className="text-sm">{analysis.primary_cause}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />支撑证据
              </h4>
              <div className="space-y-2">
                {analysis.evidence.map((evidence: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/20 rounded">
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 mt-0.5">
                      {index + 1}
                    </Badge>
                    <span className="text-sm">{evidence}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />建议措施
              </h4>
              <div className="space-y-3">
                {analysis.recommendations.map((rec: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg border border-border">
                    <div className="flex items-start gap-3">
                      <Badge 
                        variant={rec.priority === "HIGH" ? "destructive" : 
                                rec.priority === "MEDIUM" ? "default" : "secondary"}
                        className="text-xs px-2 py-1"
                      >
                        {rec.priority}
                      </Badge>
                      <span className="text-sm flex-1">{rec.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle final summary
    if (content.summary && content.problem) {
      return (
        <div className="space-y-6">
          <div className="grid gap-6">
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-sm mb-2 text-red-700 dark:text-red-300">问题描述</h4>
              <p className="text-sm">{content.problem}</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-sm mb-2 text-purple-700 dark:text-purple-300">根本原因</h4>
              <p className="text-sm">{content.root_cause}</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-sm mb-2 text-green-700 dark:text-green-300">解决方案</h4>
              <div className="text-sm">
                <Markdown>{content.solution}</Markdown>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2">预计修复时间</h4>
                <p className="text-lg font-mono text-primary">{content.estimated_fix_time}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2">影响范围</h4>
                <p className="text-lg font-mono text-orange-600">{content.impact}</p>
              </CardContent>
            </Card>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-sm mb-2 text-blue-700 dark:text-blue-300">预防措施</h4>
            <p className="text-sm">{content.prevention}</p>
          </div>
        </div>
      );
    }

    // Handle API execution results
    if (content.optical_power || content.port_status) {
      return (
        <div className="space-y-4">
          {Object.entries(content).map(([key, value]) => (
            <Collapsible key={key}>
              <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left">
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-sm capitalize">{key.replace(/_/g, ' ')}</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 ml-6">
                <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      );
    }

    // Fallback to JSON display
    return (
      <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  }

  return <div className="text-sm text-muted-foreground">无内容</div>;
}

export function BotResearchBlock({ 
  className, 
  messages
}: BotResearchBlockProps) {
  const [copied, setCopied] = useState(false);
  const { activeTab, setActiveTab } = useUIStore();
  
  // Extract tool calls from messages for research tabs
  const allToolCalls = useMemo(() => {
    return messages.flatMap(message => message.toolCalls || [])
  }, [messages]);
  
  // Group tool calls by research tab type
  const groupedToolCalls = allToolCalls.reduce((acc, toolCall) => {
    const tabType = getResearchTab(toolCall.label);
    if (tabType) {
      if (!acc[tabType]) acc[tabType] = [];
      acc[tabType].push(toolCall);
    }
    return acc;
  }, {} as Record<keyof typeof RESEARCH_TABS, typeof allToolCalls>);


  // Copy function for research data
  const handleCopy = useCallback(() => {
    const currentTabData = groupedToolCalls[activeTab] || [];
    if (currentTabData.length === 0) return;
    
    const content = currentTabData.map(toolCall => {
      try {
        const parsed = JSON.parse(toolCall.content);
        return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
      } catch {
        return toolCall.content;
      }
    }).join('\n\n');
    
    void navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  }, [activeTab, groupedToolCalls]);

  const hasData = allToolCalls.length > 0;

  return (
    <div className={cn("h-full w-full", className)}>
      <Card className={cn("relative h-full w-full pt-4", className)}>
        {/* Action buttons - following research-block pattern */}
        <div className="absolute right-4 flex h-9 items-center justify-center">
          {hasData && (
            <>
              <Tooltip title="复制当前标签页内容">
                <Button
                  className="text-gray-400"
                  size="icon"
                  variant="ghost"
                  onClick={handleCopy}
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
              </Tooltip>
            </>
          )}
          <Tooltip title="关闭">
            <Button
              className="text-gray-400"
              size="sm"
              variant="ghost"
              onClick={() => {
                // Add close handler if needed
              }}
            >
              <X />
            </Button>
          </Tooltip>
        </div>

        {/* Tabs structure - following research-block pattern */}
        <Tabs
          className="flex h-full w-full flex-col"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as keyof typeof RESEARCH_TABS)}
        >
          {/* Centered TabsList */}
          <div className="flex w-full justify-center">
            <TabsList className="">
              {(Object.keys(RESEARCH_TABS) as (keyof typeof RESEARCH_TABS)[]).map((tab) => {
                const tabData = groupedToolCalls[tab] || [];
                const hasTabData = tabData.length > 0;
                
                return (
                  <TabsTrigger
                    key={tab}
                    className="px-8 flex items-center gap-2"
                    value={tab}
                    disabled={!hasTabData}
                  >
                    {React.createElement(RESEARCH_TABS[tab].icon, { size: 16 })}
                    {RESEARCH_TABS[tab].label}
                    {hasTabData && (
                      <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-xs rounded-full">
                        {tabData.length}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab Contents */}
          {(Object.keys(RESEARCH_TABS) as (keyof typeof RESEARCH_TABS)[]).map((tab) => (
            <TabsContent
              key={tab}
              className="h-full min-h-0 flex-grow px-8"
              value={tab}
              forceMount
              hidden={activeTab !== tab}
            >
              <ScrollContainer
                className="h-full"
                scrollShadowColor="var(--card)"
                autoScrollToBottom={false}
              >
                <div className="mt-4">
                  {renderToolCalls(tab, groupedToolCalls[tab] || [])}
                </div>
              </ScrollContainer>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}