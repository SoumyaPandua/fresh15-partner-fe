import { apiRequest } from "./api-client";

export type AiMessage = {
  role: "user" | "assistant";
  content: string;
  blocked?: boolean;
  createdAt?: string;
};

export type AiConversation = {
  _id: string;
  title: string;
  messages: AiMessage[];
  messageCount: number;
  lastActivityAt: string;
  createdAt: string;
};

export type AiChatResponse = {
  conversationId: string;
  reply: string;
  blocked: boolean;
};

export async function sendAiMessage(
  token: string,
  message: string,
  conversationId?: string,
): Promise<AiChatResponse> {
  const response = await apiRequest<AiChatResponse>(
    "/api/ai/chat",
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

export async function getAiConversations(token: string) {
  const response = await apiRequest<
    Array<
      Pick<
        AiConversation,
        "_id" | "title" | "messageCount" | "lastActivityAt" | "createdAt"
      >
    >
  >(
    "/api/ai/conversations",
    {
      method: "GET",
    },
    token,
  );

  return response.data;
}

export async function getAiConversation(
  token: string,
  id: string,
): Promise<AiConversation> {
  const response = await apiRequest<AiConversation>(
    `/api/ai/conversations/${encodeURIComponent(id)}`,
    {
      method: "GET",
    },
    token,
  );

  return response.data;
}