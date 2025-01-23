const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env

class FacebookPageScraper {
  constructor(accessToken, pageId) {
    this.accessToken = accessToken;
    this.pageId = pageId;
    this.baseUrl = 'https://graph.facebook.com/v22.0';
  }

  /*
    Fetch basic page information (followers count and name).
   */
  async fetchPageInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/${this.pageId}`, {
        params: {
          access_token: this.accessToken, // Ensure the access token is sent here
          fields: 'name,followers_count', // Request the page name and followers count
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch posts from the page with details and handle pagination.
   */
  async fetchPosts() {
    let allPosts = [];
    let nextPage = `${this.baseUrl}/${this.pageId}/posts`;
    
    try {
      while (nextPage) {
        const response = await axios.get(nextPage, {
          params: {
            fields: 'message,likes.summary(true),comments.summary(true),shares,created_time',
            access_token: this.accessToken,
            limit: 100,
          },
        });

        allPosts = [...allPosts, ...response.data.data];

        // Check if there's a next page for pagination
        nextPage = response.data.paging ? response.data.paging.next : null;
      }
      
      return allPosts;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Scrape data from the Facebook page and return structured data.
   */
  async scrapePageData() {
    try {
      // Fetch page information, including followers count and name
      const pageInfo = await this.fetchPageInfo();

      // Fetch posts
      const posts = await this.fetchPosts();

      // Process posts data
      const postsContent = posts.map(post => ({
        postContent: post.message || '',
        likes: post.likes ? post.likes.summary.total_count : 0,
        comments: post.comments ? post.comments.summary.total_count : 0,
        shares: post.shares ? post.shares.count : 0,
        createdAt: post.created_time,  // Adding created time
      }));

      // Calculate total likes, comments, and shares
      const totalLikes = postsContent.reduce((sum, post) => sum + post.likes, 0);
      const totalComments = postsContent.reduce((sum, post) => sum + post.comments, 0);
      const totalShares = postsContent.reduce((sum, post) => sum + post.shares, 0);

      // Compile and return results
      return {
        pageName: pageInfo.name || '',  // Include the page's name
        followersCount: pageInfo.followers_count || 0,  // Include followers count
        totalPosts: postsContent.length,
        totalLikes,
        totalComments,
        totalShares,
        postsContent,
      };
    } catch (error) {
      throw error;
    }
  }
}

// Main function to use the scraper
async function main() {
  const accessToken = process.env.ACCESS_TOKEN;
  const pageId = process.env.PAGE_ID;

  if (!accessToken || !pageId) {
    return console.log('Please provide an access token and page ID.');
  }

  const scraper = new FacebookPageScraper(accessToken, pageId);

  try {
    const pageData = await scraper.scrapePageData();
    console.log('Scraped Facebook Page Data:', JSON.stringify(pageData, null, 2)); 
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

main();
