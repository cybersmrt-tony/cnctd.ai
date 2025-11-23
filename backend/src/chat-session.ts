/**
 * Durable Object for managing WebSocket chat sessions
 * Handles real-time messaging, AI responses, and image matching
 */

import { DurableObject } from 'cloudflare:workers';
import { nanoid } from 'nanoid';
import type { Env, Avatar, AvatarImage, Message, ImageMatch, WebSocketMessage } from './lib/types';
import { checkMessageLimit, checkImageLimit, incrementMessageCount, incrementImageCount } from './lib/rate-limit';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ChatSession extends DurableObject<Env> {
  private sessions: Map<WebSocket, { userId: string; conversationId: string; avatarId: string }> = new Map();

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const conversationId = url.searchParams.get('conversationId');
    const avatarId = url.searchParams.get('avatarId');

    if (!userId || !conversationId || !avatarId) {
      return new Response('Missing required parameters', { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);
    this.sessions.set(server, { userId, conversationId, avatarId });

    server.addEventListener('message', async (event) => {
      await this.handleMessage(server, event);
    });

    server.addEventListener('close', () => {
      this.sessions.delete(server);
    });

    server.addEventListener('error', () => {
      this.sessions.delete(server);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleMessage(ws: WebSocket, event: MessageEvent): Promise<void> {
    const session = this.sessions.get(ws);
    if (!session) return;

    try {
      const data = JSON.parse(event.data as string);
      const { type, message } = data;

      if (type === 'message') {
        await this.handleChatMessage(ws, session, message);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendError(ws, 'Failed to process message');
    }
  }

  /**
   * Handle chat messages and generate AI responses
   */
  private async handleChatMessage(
    ws: WebSocket,
    session: { userId: string; conversationId: string; avatarId: string },
    userMessage: string
  ): Promise<void> {
    // Check rate limits
    const canSendMessage = await checkMessageLimit(session.userId, this.env);
    if (!canSendMessage) {
      this.sendMessage(ws, {
        type: 'rate_limit',
        error: 'Daily message limit reached. Please upgrade your subscription.'
      });
      return;
    }

    // Save user message
    await this.saveMessage(session.conversationId, 'user', userMessage);
    await incrementMessageCount(session.userId, this.env);

    // Get avatar personality
    const avatar = await this.getAvatar(session.avatarId);
    if (!avatar) {
      this.sendError(ws, 'Avatar not found');
      return;
    }

    // Detect photo request
    const photoRequest = await this.detectPhotoRequest(userMessage);

    // Send typing indicator
    this.sendMessage(ws, { type: 'typing' });

    // Get conversation history
    const history = await this.getConversationHistory(session.conversationId);

    // Generate AI response
    const aiResponse = await this.generateAIResponse(avatar, history, userMessage, photoRequest);

    // Handle photo request if detected
    let imageUrl: string | null = null;
    if (photoRequest && photoRequest.shouldSendImage) {
      const canSendImage = await checkImageLimit(session.userId, this.env);

      if (canSendImage) {
        const matchedImage = await this.findMatchingImage(
          session.avatarId,
          session.userId,
          session.conversationId,
          photoRequest.category,
          photoRequest.tags
        );

        if (matchedImage) {
          imageUrl = `/api/images/${matchedImage.avatar_id}/${matchedImage.category}/${matchedImage.file_path.split('/').pop()}`;
          await incrementImageCount(session.userId, this.env);

          // Track that user received this image
          await this.trackReceivedImage(session.userId, session.avatarId, matchedImage.id, session.conversationId);
        }
      } else {
        // Inform user about image limit
        const limitMessage = "I'd love to share a photo, but you've reached your daily image limit. Upgrade to get more!";
        await this.saveMessage(session.conversationId, 'assistant', limitMessage);
        this.sendMessage(ws, {
          type: 'message',
          data: {
            role: 'assistant',
            content: limitMessage,
            imageUrl: null
          }
        });
        return;
      }
    }

    // Save AI response
    await this.saveMessage(session.conversationId, 'assistant', aiResponse, imageUrl);

    // Send response to client
    this.sendMessage(ws, {
      type: 'message',
      data: {
        role: 'assistant',
        content: aiResponse,
        imageUrl
      }
    });

    // Update conversation last message
    await this.updateConversationLastMessage(session.conversationId, aiResponse);
  }

  /**
   * Generate AI response using Workers AI
   */
  private async generateAIResponse(
    avatar: Avatar,
    history: ChatMessage[],
    userMessage: string,
    photoRequest: { shouldSendImage: boolean; category: string; tags: string[] } | null
  ): Promise<string> {
    const systemPrompt = avatar.personality_prompt;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // Last 10 messages for context
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages,
        max_tokens: 256,
        temperature: 0.8
      });

      return response.response || "I'm here, just gathering my thoughts...";
    } catch (error) {
      console.error('AI generation error:', error);
      return "Sorry, I'm having trouble connecting right now. Can you try again?";
    }
  }

  /**
   * Detect if user is requesting a photo
   */
  private async detectPhotoRequest(message: string): Promise<{ shouldSendImage: boolean; category: string; tags: string[] } | null> {
    const lowerMessage = message.toLowerCase();

    // Photo request triggers
    const photoKeywords = [
      'photo', 'picture', 'pic', 'image', 'show me', 'send me',
      'what do you look like', 'see you', 'selfie', 'outfit'
    ];

    const hasPhotoKeyword = photoKeywords.some(keyword => lowerMessage.includes(keyword));

    if (!hasPhotoKeyword) {
      return null;
    }

    // Categorize request
    let category = 'casual';
    const tags: string[] = [];

    if (lowerMessage.includes('workout') || lowerMessage.includes('gym') || lowerMessage.includes('exercise')) {
      category = 'fitness';
      tags.push('workout', 'active');
    } else if (lowerMessage.includes('beach') || lowerMessage.includes('swim') || lowerMessage.includes('bikini')) {
      category = 'beach';
      tags.push('beach', 'summer', 'outdoor');
    } else if (lowerMessage.includes('dress') || lowerMessage.includes('fancy') || lowerMessage.includes('formal')) {
      category = 'formal';
      tags.push('dress', 'elegant');
    } else if (lowerMessage.includes('selfie') || lowerMessage.includes('face')) {
      category = 'selfie';
      tags.push('closeup', 'portrait');
    } else {
      tags.push('casual', 'everyday');
    }

    return {
      shouldSendImage: true,
      category,
      tags
    };
  }

  /**
   * Find matching image from library
   */
  private async findMatchingImage(
    avatarId: string,
    userId: string,
    conversationId: string,
    category: string,
    tags: string[]
  ): Promise<AvatarImage | null> {
    // Get images in category that haven't been sent to this user recently
    const result = await this.env.DB.prepare(
      `SELECT ai.* FROM avatar_images ai
       WHERE ai.avatar_id = ? AND ai.category = ?
       AND ai.id NOT IN (
         SELECT image_id FROM user_received_images
         WHERE user_id = ? AND avatar_id = ?
       )
       ORDER BY ai.send_count ASC
       LIMIT 20`
    )
      .bind(avatarId, category, userId, avatarId)
      .all<AvatarImage>();

    const candidates = result.results || [];

    if (candidates.length === 0) {
      // If no unsent images, get least recently sent
      const fallbackResult = await this.env.DB.prepare(
        `SELECT ai.* FROM avatar_images ai
         WHERE ai.avatar_id = ? AND ai.category = ?
         ORDER BY ai.send_count ASC
         LIMIT 20`
      )
        .bind(avatarId, category)
        .all<AvatarImage>();

      if (!fallbackResult.results || fallbackResult.results.length === 0) {
        return null;
      }

      // Return random from top candidates
      const randomIndex = Math.floor(Math.random() * fallbackResult.results.length);
      const selected = fallbackResult.results[randomIndex];

      // Increment send count
      await this.env.DB.prepare(
        'UPDATE avatar_images SET send_count = send_count + 1 WHERE id = ?'
      )
        .bind(selected.id)
        .run();

      return selected;
    }

    // Score candidates by tag matching
    const scored: ImageMatch[] = candidates.map(image => {
      const imageTags = image.tags.toLowerCase().split(',').map(t => t.trim());
      let score = 0;

      tags.forEach(tag => {
        if (imageTags.some(it => it.includes(tag.toLowerCase()))) {
          score += 2;
        }
      });

      // Prefer less-sent images
      score -= image.send_count * 0.1;

      return { image, score };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Pick from top 5 with some randomness
    const topCandidates = scored.slice(0, Math.min(5, scored.length));
    const randomIndex = Math.floor(Math.random() * topCandidates.length);
    const selected = topCandidates[randomIndex].image;

    // Increment send count
    await this.env.DB.prepare(
      'UPDATE avatar_images SET send_count = send_count + 1 WHERE id = ?'
    )
      .bind(selected.id)
      .run();

    return selected;
  }

  /**
   * Helper methods
   */
  private async saveMessage(conversationId: string, role: 'user' | 'assistant', content: string, imageUrl: string | null = null): Promise<void> {
    const messageId = nanoid();
    await this.env.DB.prepare(
      'INSERT INTO messages (id, conversation_id, role, content, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(messageId, conversationId, role, content, imageUrl, new Date().toISOString())
      .run();
  }

  private async getConversationHistory(conversationId: string): Promise<ChatMessage[]> {
    const result = await this.env.DB.prepare(
      'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 50'
    )
      .bind(conversationId)
      .all<Message>();

    return (result.results || []).map(m => ({
      role: m.role,
      content: m.content
    }));
  }

  private async getAvatar(avatarId: string): Promise<Avatar | null> {
    return await this.env.DB.prepare(
      'SELECT * FROM avatars WHERE id = ?'
    )
      .bind(avatarId)
      .first<Avatar>();
  }

  private async updateConversationLastMessage(conversationId: string, message: string): Promise<void> {
    await this.env.DB.prepare(
      'UPDATE conversations SET last_message = ?, last_message_at = ? WHERE id = ?'
    )
      .bind(message.substring(0, 100), new Date().toISOString(), conversationId)
      .run();
  }

  private async trackReceivedImage(userId: string, avatarId: string, imageId: string, conversationId: string): Promise<void> {
    const id = nanoid();
    await this.env.DB.prepare(
      'INSERT INTO user_received_images (id, user_id, avatar_id, image_id, conversation_id) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(id, userId, avatarId, imageId, conversationId)
      .run();
  }

  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, { type: 'error', error });
  }
}
