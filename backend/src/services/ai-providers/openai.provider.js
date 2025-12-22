const OpenAI = require('openai');
const BaseAIProvider = require('./base.provider');

class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey) {
    super(apiKey);
    this.providerName = 'openai';
    
    if (this.isConfigured()) {
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
  }

  async generateRecommendations(prompt) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert movie and TV show recommendation engine. You analyze user preferences and provide personalized recommendations with detailed explanations. Always respond in valid JSON format.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        provider: this.providerName,
        recommendations: response.recommendations || [],
        summary: response.summary || '',
        tokens_used: completion.usage.total_tokens,
        cost_estimate: this.calculateCost(completion.usage.total_tokens),
        model: 'gpt-4o-mini'
      };

    } catch (error) {
      console.error('OpenAI provider error:', error);
      throw new Error(`OpenAI failed: ${error.message}`);
    }
  }

  calculateCost(tokens) {
    const costPer1MTokens = 0.375;
    return ((tokens / 1000000) * costPer1MTokens).toFixed(6);
  }
}

module.exports = OpenAIProvider;
