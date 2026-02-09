//backend/src/services/ai.service.js
const OpenAIProvider = require('./ai-providers/openai.provider');
const ClaudeProvider = require('./ai-providers/claude.provider');

// Initialize providers
const openaiProvider = new OpenAIProvider(process.env.OPENAI_API_KEY);
const claudeProvider = new ClaudeProvider(process.env.ANTHROPIC_API_KEY);

/**
 * Get available AI providers based on configuration
 */
const getAvailableProviders = () => {
  const providers = [];
  const aiProvider = process.env.AI_PROVIDER || 'both';
  const primaryProvider = process.env.AI_PRIMARY_PROVIDER || 'openai';

  if (aiProvider === 'openai' && openaiProvider.isConfigured()) {
    providers.push(openaiProvider);
  } else if (aiProvider === 'claude' && claudeProvider.isConfigured()) {
    providers.push(claudeProvider);
  } else if (aiProvider === 'both') {
    if (primaryProvider === 'openai') {
      if (openaiProvider.isConfigured()) providers.push(openaiProvider);
      if (claudeProvider.isConfigured()) providers.push(claudeProvider);
    } else {
      if (claudeProvider.isConfigured()) providers.push(claudeProvider);
      if (openaiProvider.isConfigured()) providers.push(openaiProvider);
    }
  }

  return providers;
};

/**
 * Generate personalized movie/TV recommendations using AI with fallback
 */
const generateRecommendations = async (userData) => {
  const providers = getAvailableProviders();

  if (providers.length === 0) {
    throw new Error('No AI providers configured. Please add OpenAI or Anthropic API key.');
  }

  const { favorites, watchlist, ratings, reviews } = userData;
  const userProfile = buildUserProfile(favorites, watchlist, ratings, reviews);
  const prompt = createRecommendationPrompt(userProfile);

  const errors = [];
  
  for (const provider of providers) {
    try {
      console.log(`Attempting AI recommendations with ${provider.getName()}...`);
      const result = await provider.generateRecommendations(prompt);
      console.log(`✅ Success with ${provider.getName()}! Tokens: ${result.tokens_used}, Cost: $${result.cost_estimate}`);
      return result;
    } catch (error) {
      console.error(`❌ ${provider.getName()} failed:`, error.message);
      errors.push({
        provider: provider.getName(),
        error: error.message
      });
      
      if (providers.indexOf(provider) < providers.length - 1) {
        console.log(`Falling back to next provider...`);
      }
    }
  }

  throw new Error(`All AI providers failed. Errors: ${JSON.stringify(errors)}`);
};

/**
 * Build user profile from viewing data
 */
const buildUserProfile = (favorites, watchlist, ratings, reviews) => {
  const profile = {
    totalInteractions: 0,
    favoriteGenres: [],
    favoriteDirectors: [],
    averageRating: 0,
    contentTypes: { movies: 0, tv: 0 },
    recentActivity: []
  };

  if (favorites && favorites.length > 0) {
    profile.totalInteractions += favorites.length;
    favorites.forEach(f => {
      profile.contentTypes[f.content_type === 'movie' ? 'movies' : 'tv']++;
    });
    profile.recentActivity.push(...favorites.slice(0, 5).map(f => ({
      type: 'favorite',
      contentType: f.content_type,
      contentId: f.content_id
    })));
  }

  if (ratings && ratings.length > 0) {
    profile.totalInteractions += ratings.length;
    const totalRating = ratings.reduce((sum, r) => sum + parseFloat(r.rating), 0);
    profile.averageRating = (totalRating / ratings.length).toFixed(1);
    
    profile.recentActivity.push(...ratings.slice(0, 5).map(r => ({
      type: 'rating',
      contentType: r.content_type,
      contentId: r.content_id,
      rating: r.rating
    })));
  }

  if (reviews && reviews.length > 0) {
    profile.totalInteractions += reviews.length;
    profile.recentActivity.push(...reviews.slice(0, 3).map(r => ({
      type: 'review',
      contentType: r.content_type,
      contentId: r.content_id,
      title: r.title,
      content: r.content.substring(0, 200)
    })));
  }

  return profile;
};

/**
 * Create AI prompt for recommendations
 */
const createRecommendationPrompt = (userProfile) => {
  return `
Analyze this user's viewing preferences and generate 10 personalized movie/TV show recommendations.

USER PROFILE:
- Total interactions: ${userProfile.totalInteractions}
- Average rating: ${userProfile.averageRating}/10
- Content preference: ${userProfile.contentTypes.movies} movies, ${userProfile.contentTypes.tv} TV shows
- Recent activity: ${JSON.stringify(userProfile.recentActivity, null, 2)}

INSTRUCTIONS:
1. Analyze the user's viewing patterns and preferences
2. Recommend exactly 10 movies or TV shows they would love
3. Provide real TMDB IDs for each recommendation (use popular movies/shows)
4. Explain WHY each recommendation matches their taste (be specific and personal)
5. Diversify recommendations (different genres, eras, styles)
6. Include both popular titles and hidden gems
7. Consider their rating patterns and favorite content types

OUTPUT FORMAT (strict JSON, no markdown):
{
  "summary": "A 2-3 sentence analysis of the user's viewing preferences",
  "recommendations": [
    {
      "tmdb_id": 550,
      "content_type": "movie",
      "title": "Fight Club",
      "reason": "Based on your high ratings for psychological thrillers like Inception, you'll appreciate Fight Club's mind-bending narrative and social commentary.",
      "confidence": 95,
      "tags": ["psychological", "thriller", "mind-bending"]
    }
  ]
}

CRITICAL: Return exactly 10 recommendations. Use only real TMDB IDs. Be specific in explanations.
`;
};

/**
 * Get AI provider status
 */
const getProviderStatus = () => {
  return {
    openai: {
      configured: openaiProvider.isConfigured(),
      name: openaiProvider.getName()
    },
    claude: {
      configured: claudeProvider.isConfigured(),
      name: claudeProvider.getName()
    },
    active_provider: process.env.AI_PROVIDER || 'both',
    primary_provider: process.env.AI_PRIMARY_PROVIDER || 'openai',
    available_count: getAvailableProviders().length
  };
};

module.exports = {
  generateRecommendations,
  getProviderStatus
};
