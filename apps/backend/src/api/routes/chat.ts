import type { FastifyPluginAsync } from 'fastify';
import type {
  ApiResponse,
  SendMessageRequest,
  SendMessageResponse,
  GetChatHistoryRequest,
  GetChatHistoryResponse,
} from '@cronos-x402/shared-types';
import { sendMessage, getChatHistory, deleteMessage } from '../../services/chat-service';

export const chatRoutes: FastifyPluginAsync = async (server) => {
  // Send a chat message
  server.post<{
    Body: SendMessageRequest;
    Reply: ApiResponse<SendMessageResponse>;
  }>('/chat/messages', async (request, reply) => {
    try {
      const { content } = request.body;

      if (!content || content.trim().length === 0) {
        return reply.code(400).send({
          status: 'error',
          code: 'MISSING_PARAMS',
          message: 'Message content is required',
        });
      }

      // TODO: Get userId from authenticated session
      // For now, use a header or default value
      const userId = (request.headers['x-user-address'] as string) || '0x0000000000000000000000000000000000000000';

      const result = await sendMessage(userId, content);

      const response: ApiResponse<SendMessageResponse> = {
        status: 'success',
        code: 'MESSAGE_SENT',
        message: 'Message sent successfully',
        data: result,
      };

      return reply.code(200).send(response);
    } catch (error) {
      server.log.error({ error }, '[ChatRoutes] Error sending message');

      const response: ApiResponse = {
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to send message',
      };

      return reply.code(500).send(response);
    }
  });

  // Get chat history
  server.get<{
    Querystring: GetChatHistoryRequest;
    Reply: ApiResponse<GetChatHistoryResponse>;
  }>('/chat/messages', async (request, reply) => {
    try {
      const { limit, before } = request.query;

      // TODO: Get userId from authenticated session
      const userId = (request.headers['x-user-address'] as string) || '0x0000000000000000000000000000000000000000';

      const result = await getChatHistory(userId, { limit, before });

      const response: ApiResponse<GetChatHistoryResponse> = {
        status: 'success',
        code: 'CHAT_HISTORY_RETRIEVED',
        message: 'Chat history retrieved successfully',
        data: result,
      };

      return reply.code(200).send(response);
    } catch (error) {
      server.log.error({ error }, '[ChatRoutes] Error getting chat history');

      const response: ApiResponse = {
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get chat history',
      };

      return reply.code(500).send(response);
    }
  });

  // Delete a message
  server.delete<{
    Params: { id: string };
    Reply: ApiResponse;
  }>('/chat/messages/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      // TODO: Get userId from authenticated session
      const userId = (request.headers['x-user-address'] as string) || '0x0000000000000000000000000000000000000000';

      await deleteMessage(userId, id);

      const response: ApiResponse = {
        status: 'success',
        code: 'MESSAGE_DELETED',
        message: 'Message deleted successfully',
      };

      return reply.code(200).send(response);
    } catch (error) {
      server.log.error({ error }, '[ChatRoutes] Error deleting message');

      const response: ApiResponse = {
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete message',
      };

      return reply.code(500).send(response);
    }
  });
};
