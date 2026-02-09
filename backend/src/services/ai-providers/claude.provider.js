//backend/src/services/ai-providers/claude.provider.js
const Anthropic = require('@anthropic-ai/sdk');
const BaseAIProvider = require('./base.provider');

class ClaudeProvider extends BaseAIProvider {
  constructor(apiKey) {
    super(apiKey);
    this.providerName = 'claude';
    
    if (this.isConfigured()) {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
  }

  async generateRecommendations(prompt) {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        temperature: 0.7,
        system: `You are an expert movie and TV show recommendation engine. You analyze user preferences and provide personalized recommendations with detailed explanations. Always respond in valid JSON format.`,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const textContent = message.content.find(block => block.type === 'text');
      if (!textContent) {
        throw new Error('No text content in Claude response');
      }

      let jsonText = textContent.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').trim();
      }

      const response = JSON.parse(jsonText);
      
      return {
        success: true,
        provider: this.providerName,
        recommendations: response.recommendations || [],
        summary: response.summary || '',
        tokens_used: message.usage.input_tokens + message.usage.output_tokens,
        cost_estimate: this.calculateCost(message.usage.input_tokens, message.usage.output_tokens),
        model: 'claude-3-5-haiku-20241022'
      };

    } catch (error) {
      console.error('Claude provider error:', error);
      throw new Error(`Claude failed: ${error.message}`);
    }
  }

  calculateCost(inputTokens, outputTokens) {
    const inputCost = (inputTokens / 1000000) * 0.25;
    const outputCost = (outputTokens / 1000000) * 1.25;
    return (inputCost + outputCost).toFixed(6);
  }
}

module.exports = ClaudeProvider;
