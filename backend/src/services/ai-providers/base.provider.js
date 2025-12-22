/**
 * Base AI Provider Interface
 * All AI providers must implement these methods
 */
class BaseAIProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.providerName = 'base';
  }

  /**
   * Generate recommendations
   * @param {string} prompt - The recommendation prompt
   * @returns {Promise<Object>} - AI response with recommendations
   */
  async generateRecommendations(prompt) {
    throw new Error('generateRecommendations must be implemented by provider');
  }

  /**
   * Check if provider is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey && this.apiKey !== 'your_openai_key_here' && this.apiKey !== 'your_anthropic_key_here';
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getName() {
    return this.providerName;
  }
}

module.exports = BaseAIProvider;
