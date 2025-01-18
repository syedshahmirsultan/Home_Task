const puppeteer = require('puppeteer');


const scrapeFacebookPage = async (pageUrl, companyName) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();


  await page.goto(pageUrl, { waitUntil: 'networkidle2' });

  // Wait for posts to load
  await page.waitForSelector('div[data-ad-preview="message"]');

  


  // Extracting posts and their data
  const posts = await page.evaluate(() => {
    const postElements = document.querySelectorAll('div[data-ad-preview="message"]');
    const extractedPosts = [];

    postElements.forEach((post) => {
      // Find the parent container for the post
      const postContainer = post.closest('[role="article"]');
      const likesElement = postContainer?.querySelector('[aria-label*="like"]');
      const commentsElement = postContainer?.querySelector('[aria-label*="comment"]');

      extractedPosts.push({
        postContent: post.innerText.trim(), // Extracted post content
        likes: likesElement ? likesElement.getAttribute('aria-label') : '0',
        comments: commentsElement ? commentsElement.getAttribute('aria-label') : '0',
      });
    });

    return extractedPosts;
  });

  await browser.close();

  const result = {
    companyName: companyName,
    posts: posts,
  };

  console.log(result);
  return result;
};

scrapeFacebookPage('https://www.facebook.com/rabbitosocial/', "Rabbito Social");

