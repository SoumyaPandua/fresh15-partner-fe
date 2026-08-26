import { apiRequest } from "./api-client";

export type AgentAction = {
  tool: string;
  success: boolean;
  result?: unknown;
  error?: string;
  code?: string;
};

export type AgentConfirmation = {
  confirmationId: string;
  action: string;
  summary?: unknown;
};

export type AgentResponse = {
  conversationId: string;
  reply: string;
  actions: AgentAction[];
  blocked: boolean;
  confirmation?: AgentConfirmation | null;
};

export type AgentConfirmResponse = {
  reply: string;
  action: string;
  result?: unknown;
  blocked: boolean;
};

export async function sendAiAgent(
  token: string,
  message: string,
  conversationId?: string,
): Promise<AgentResponse> {
  const response = await apiRequest<AgentResponse>(
    "/api/ai/agent",
    {
      method: "POST",
      body: JSON.stringify({
        message,
        conversationId,
      }),
    },
    token,
  );

  return response.data;
}

export async function confirmAiAgent(
  token: string,
  conversationId: string,
  confirmationId: string,
): Promise<AgentConfirmResponse> {
  const response = await apiRequest<AgentConfirmResponse>(
    "/api/ai/agent/confirm",
    {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        confirmationId,
      }),
    },
    token,
  );

  return response.data;
}

export async function declineAiAgent(
  token: string,
  conversationId: string,
  confirmationId: string,
) {
  const response = await apiRequest<{ reply: string; blocked: boolean }>(
    "/api/ai/agent/decline",
    {
      method: "POST",
      body: JSON.stringify({ conversationId, confirmationId }),
    },
    token,
  );
  return response.data;
}
