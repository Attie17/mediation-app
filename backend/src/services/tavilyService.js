// Tavily Web Search Service
// Provides factual web search with citations for AI assistant

import { tavily } from '@tavily/core';
import dotenv from 'dotenv';

dotenv.config();

class TavilyService {
  constructor() {
    this.client = tavily({ apiKey: process.env.TAVILY_API_KEY });
    this.enabled = !!process.env.TAVILY_API_KEY;
  }

  /**
   * Search the web for factual information
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<object>} Search results with citations
   */
  async search(query, options = {}) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Tavily API key not configured',
        results: []
      };
    }

    try {
      const response = await this.client.search(query, {
        searchDepth: options.depth || 'basic', // 'basic' or 'advanced'
        maxResults: options.maxResults || 5,
        includeAnswer: true, // Get direct answer
        includeRawContent: false,
        includeDomains: options.includeDomains || [],
        excludeDomains: options.excludeDomains || []
      });

      return {
        success: true,
        query: query,
        answer: response.answer, // Direct answer from Tavily
        results: response.results.map(result => ({
          title: result.title,
          url: result.url,
          content: result.content,
          score: result.score,
          publishedDate: result.publishedDate || null
        })),
        citations: response.results.map(result => ({
          source: result.title,
          url: result.url,
          snippet: result.content.substring(0, 200) + '...'
        }))
      };
    } catch (error) {
      console.error('Tavily search error:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Search for legal information with citations
   * @param {string} question - Legal question
   * @param {string} jurisdiction - e.g., 'California', 'New York'
   * @returns {Promise<object>} Legal information with sources
   */
  async searchLegal(question, jurisdiction = null) {
    const query = jurisdiction 
      ? `${question} ${jurisdiction} law`
      : question;

    return await this.search(query, {
      depth: 'advanced', // More thorough search for legal info
      maxResults: 5,
      includeDomains: [
        'law.cornell.edu',
        'justia.com',
        'findlaw.com',
        'nolo.com',
        'courts.ca.gov' // California courts (example)
      ]
    });
  }

  /**
   * Search for divorce/mediation statistics
   * @param {string} topic - e.g., 'child support averages'
   * @param {string} location - State or region
   * @returns {Promise<object>} Statistical information with sources
   */
  async searchStatistics(topic, location = null) {
    const query = location
      ? `${topic} statistics ${location}`
      : `${topic} statistics`;

    return await this.search(query, {
      depth: 'advanced',
      maxResults: 3,
      includeDomains: [
        'census.gov',
        'bls.gov',
        'pewresearch.org',
        'ncbi.nlm.nih.gov'
      ]
    });
  }

  /**
   * Check if Tavily is configured and working
   * @returns {Promise<object>} Health status
   */
  async healthCheck() {
    if (!this.enabled) {
      return {
        healthy: false,
        message: 'Tavily API key not configured'
      };
    }

    try {
      const result = await this.search('test query', { maxResults: 1 });
      return {
        healthy: result.success,
        message: result.success ? 'Tavily is operational' : result.error
      };
    } catch (error) {
      return {
        healthy: false,
        message: error.message
      };
    }
  }
}

// Singleton instance
const tavilyService = new TavilyService();

export { tavilyService, TavilyService };
