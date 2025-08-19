// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useState, useEffect } from "react";
import { cn } from "~/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ScrollContainer } from "~/components/deer-flow/scroll-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Markdown } from "~/components/deer-flow/markdown";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface BotData {
  label: string;
  content: any;
  return_type: "normal" | "stream";
  timestamp?: Date;
}

interface BotResearchBlockProps {
  className?: string;
  botData: BotData[];
}

const BOT_LABELS = {
  planning_agent_knowledge: {
    name: "知识查询机器人",
    description: "相关知识",
    type: "knowledge"
  },
  planning_agent_troubleshooting_text: {
    name: "知识查询机器人", 
    description: "诊断分析",
    type: "analysis"
  },
  troubleshooting_agent_model_thinking: {
    name: "网络状态感知机器人",
    description: "思考过程",
    type: "thinking"
  },
  troubleshooting_agent_refined_apis: {
    name: "网络状态感知机器人",
    description: "API选择结果",
    type: "apis"
  },
  troubleshooting_agent_code_thinking: {
    name: "网络状态感知机器人",
    description: "代码生成思考",
    type: "code_thinking"
  },
  troubleshooting_agent_mock_status_done: {
    name: "网络状态感知机器人",
    description: "执行结果",
    type: "execution"
  },
  summarizing_agent_result: {
    name: "根因分析机器人",
    description: "分析结果", 
    type: "summary"
  },
  final_summarizerr: {
    name: "系统总结",
    description: "最终总结",
    type: "final"
  }
};

function renderContent(content: any, returnType: string) {
  if (returnType === "stream" && Array.isArray(content)) {
    return (
      <div className="space-y-2">
        {content.map((item, index) => (
          <div key={index} className="text-sm">
            {typeof item === "string" ? (
              <Markdown content={item} />
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
    return <Markdown content={content} />;
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
                <Markdown content={section.content} />
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
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">置信度: {analysis.confidence}</Badge>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-2">主要原因</h4>
            <p className="text-sm">{analysis.primary_cause}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-2">证据</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {analysis.evidence.map((evidence: string, index: number) => (
                <li key={index}>{evidence}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-2">建议措施</h4>
            <div className="space-y-2">
              {analysis.recommendations.map((rec: any, index: number) => (
                <div key={index} className="flex items-start space-x-2">
                  <Badge 
                    variant={rec.priority === "HIGH" ? "destructive" : 
                            rec.priority === "MEDIUM" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {rec.priority}
                  </Badge>
                  <span className="text-sm">{rec.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Handle final summary
    if (content.summary && content.problem) {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-1">问题</h4>
            <p className="text-sm">{content.problem}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">根因</h4>
            <p className="text-sm">{content.root_cause}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">解决方案</h4>
            <Markdown content={content.solution} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-1">预计修复时间</h4>
              <p>{content.estimated_fix_time}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">影响范围</h4>
              <p>{content.impact}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">预防措施</h4>
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

export function BotResearchBlock({ className, botData }: BotResearchBlockProps) {
  const [activeTab, setActiveTab] = useState("knowledge");
  
  // Group data by bot type
  const groupedData = botData.reduce((acc, data) => {
    const labelInfo = BOT_LABELS[data.label as keyof typeof BOT_LABELS];
    if (labelInfo) {
      const type = labelInfo.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push({ ...data, labelInfo });
    }
    return acc;
  }, {} as Record<string, (BotData & { labelInfo: any })[]>);

  // Auto-switch to latest tab when new data arrives
  useEffect(() => {
    if (botData.length > 0) {
      const latestData = botData[botData.length - 1];
      const labelInfo = BOT_LABELS[latestData.label as keyof typeof BOT_LABELS];
      if (labelInfo) {
        setActiveTab(labelInfo.type);
      }
    }
  }, [botData]);

  if (botData.length === 0) {
    return (
      <div className={cn("h-full w-full flex items-center justify-center", className)}>
        <Card className="w-full h-full">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-2">🤖</div>
              <p>AI机器人分析结果将在这里显示</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("h-full w-full", className)}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">AI机器人分析</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0">
          <Tabs
            className="flex h-full flex-col"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <div className="px-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="knowledge" className="text-xs">
                  知识卡片
                </TabsTrigger>
                <TabsTrigger value="thinking" className="text-xs">
                  分析过程
                </TabsTrigger>
                <TabsTrigger value="execution" className="text-xs">
                  执行结果
                </TabsTrigger>
                <TabsTrigger value="final" className="text-xs">
                  最终总结
                </TabsTrigger>
              </TabsList>
            </div>
            
            {Object.entries(groupedData).map(([type, dataList]) => (
              <TabsContent
                key={type}
                value={type}
                className="flex-1 min-h-0 mt-2 px-4"
              >
                <ScrollContainer className="h-full" scrollShadowColor="var(--card)">
                  <div className="space-y-4 pb-4">
                    {dataList.map((data, index) => (
                      <Card key={`${data.label}-${index}`} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">
                              {data.labelInfo.name}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {data.labelInfo.description}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {renderContent(data.content, data.return_type)}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollContainer>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}