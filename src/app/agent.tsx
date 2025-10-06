
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {streamRunnableUI, exposeEndpoints} from "@/ai/server";
import nodegraph from "@/ai/graph";

const convertChatHistoryToMessages = (
  chat_history: [role: string, content: string][],
) => {
  return chat_history.map(([role, content]) => {
    switch (role) {
      case "human":
        return new HumanMessage(content);
      case "assistant":
      case "ai":
        return new AIMessage(content);
      default:
        return new HumanMessage(content);
    }
  });
};
  
  async function agent(inputs: {
  chat_history: [role: string, content: string][],
  input: string;
  walletAddress?: string | null;
}) {
  "use server"; 

  const result = await streamRunnableUI({
    input: inputs.input,
    chat_history: convertChatHistoryToMessages(inputs.chat_history),
    walletAddress: inputs.walletAddress
  });

  // Return both UI and state information
  return {
    ui: result.ui,
    responseContent: result.responseContent,
    graphState: result.graphState
  };
}
  
  export const EndpointsContext = exposeEndpoints({ agent });