// 直接测试 sendMessage 函数调用后端
import { sendMessage, useStore } from '../src/core/store/agent-store.js';

async function testSendMessage() {
  console.log('开始测试 sendMessage...');
  
  // 监听 store 变化
  const unsubscribe = useStore.subscribe((state) => {
    console.log('🔄 Store 状态变化:');
    console.log('  - 消息数量:', state.messageIds.length);
    console.log('  - 响应状态:', state.isResponding);
    
    // 打印最新的消息
    if (state.messageIds.length > 0) {
      const latestId = state.messageIds[state.messageIds.length - 1];
      const latestMessage = state.messages.get(latestId);
      if (latestMessage) {
        console.log('  - 最新消息:');
        console.log('    Agent类型:', latestMessage.agentType);
        console.log('    流状态:', latestMessage.isStreaming);
        console.log('    内容长度:', latestMessage.content?.length || 0);
        console.log('    推理内容数量:', latestMessage.reasoningContent?.length || 0);
        console.log('    工具调用数量:', latestMessage.toolCalls?.length || 0);
        
        // 详细打印每个reasoning的streaming状态
        if (latestMessage.reasoningContent && latestMessage.reasoningContent.length > 0) {
          console.log('    📝 推理内容详情:');
          latestMessage.reasoningContent.forEach((reasoning, idx) => {
            console.log(`      推理 ${idx + 1}:`);
            console.log(`        Label: ${reasoning.label}`);
            console.log(`        IsStreaming: ${reasoning.isStreaming}`);
            console.log(`        Content长度: ${reasoning.content?.length || 0}`);
          });
        }
      }
    }
    console.log('---');
  });
  
  try {
    const testMessage = "PTN830设备1/0/1端口产生ETH_LOS告警，请帮我分析问题";
    console.log('发送消息:', testMessage);
    
    await sendMessage(testMessage);
    
    console.log('✅ sendMessage 调用成功！');
    
    // 打印最终的 store 数据
    const finalState = useStore.getState();
    console.log('\n📊 最终 Store 数据:');
    console.log('消息总数:', finalState.messageIds.length);
    console.log('响应状态:', finalState.isResponding);
    
    // 详细打印每个消息
    finalState.messageIds.forEach((id, index) => {
      const message = finalState.messages.get(id);
      if (message) {
        console.log(`\n消息 ${index + 1} (${message.agentType}):`);
        console.log('  ID:', message.id);
        console.log('  ThreadID:', message.threadId);
        console.log('  AgentType:', message.agentType);
        console.log('  Role:', message.role);
        console.log('  IsStreaming:', message.isStreaming);
        console.log('  FinishReason:', message.finishReason);
        console.log('  Content:', message.content?.substring(0, 100) + (message.content?.length > 100 ? '...' : ''));
        console.log('  ContentChunks:', message.contentChunks?.length || 0);
        console.log('  ReasoningContent数量:', message.reasoningContent?.length || 0);
        
        // 详细打印每个reasoning
        if (message.reasoningContent && message.reasoningContent.length > 0) {
          message.reasoningContent.forEach((reasoning, idx) => {
            console.log(`    📝 推理 ${idx + 1}:`);
            console.log(`      Label: ${reasoning.label}`);
            console.log(`      IsStreaming: ${reasoning.isStreaming}`);
            console.log(`      Content: ${reasoning.content?.substring(0, 50) + (reasoning.content?.length > 50 ? '...' : '')}`);
          });
        }
        
        console.log('  ReasoningChunks:', message.reasoningContentChunks?.length || 0);
        console.log('  ToolCalls:', message.toolCalls?.length || 0);
        if (message.toolCalls && message.toolCalls.length > 0) {
          message.toolCalls.forEach((tool, i) => {
            console.log(`    Tool ${i + 1}: ${tool.content}`);
          });
        }
        console.log('  CreatedAt:', message.createdAt);
        console.log('  UpdatedAt:', message.updatedAt);
      }
    });
    
  } catch (error) {
    console.error('❌ sendMessage 调用失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    unsubscribe();
  }
}

// 运行测试
testSendMessage();