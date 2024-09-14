const puppeteer = require('puppeteer');

// Helper function to convert URL to reviews page URL
function convertUrlToReview(url) {
  const regex = /rooms\/(\d+)/;
  return url.replace(regex, 'rooms/$1/reviews');
}

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // Set to false for debugging
  const page = await browser.newPage();

  await page.goto('https://www.airbnb.co.in/s/New-Delhi--India/homes?flexible_trip_lengths%5B%5D=one_week&monthly_start_date=2024-10-01&monthly_length=3&monthly_end_date=2025-01-01&query=New%20Delhi&place_id=ChIJLbZ-NFv9DDkRzk0gTkm3wlI&refinement_paths%5B%5D=%2Fhomes&tab_id=home_tab&date_picker_type=calendar&checkin=2024-09-24&checkout=2024-09-28&source=structured_search_input_header&search_type=user_map_move&search_mode=regular_search&price_filter_input_type=0&price_filter_num_nights=4&channel=EXPLORE&ne_lat=28.58867622074593&ne_lng=77.79144078018521&sw_lat=27.750076188347915&sw_lng=76.42459293159038&zoom=10.774712291355238&zoom_level=9.39679201245678&search_by_map=true&drawer_open=false&map_toggle=true');

  await page.waitForSelector("div.gsgwcjk");

  // Scrape all hrefs from <a> tags inside the div
  const hrefs = await page.evaluate(() => {
    const div = document.querySelector('div.gsgwcjk');
    if (div) {
      const links = div.querySelectorAll('a.l1ovpqvx');
      return Array.from(links).map(link => link.href);
    }
    return [];
  });

  const reviewPage = [];

  // Process each href, convert to reviews URL, and scrape reviews
  for (const href of hrefs) {
    const reviewUrl = convertUrlToReview(href);
    console.log('Navigating to:', reviewUrl);
    await page.goto(reviewUrl, { waitUntil: 'networkidle0' });

    await page.waitForSelector("div._17itzz4"); // Updated selector for the scrollable div
    const reviews = [];
    let previousHeight = 0;

    while (true) {
      const newReviews = await page.evaluate(() => {
        const reviewDivs = document.querySelectorAll("div.r1are2x1");
        return Array.from(reviewDivs).flatMap(reviewDiv => {
          // Get the div where the spans are located
          const bctolvDiv = reviewDiv.querySelector("div.r1bctolv");
          if (bctolvDiv) {
            // Collect all spans inside the div.r1bctolv
            const reviewSpans = bctolvDiv.querySelectorAll("span.lrl13de");
            return Array.from(reviewSpans).map(span => span.innerText); // Extract text from each review span
          }
          return []; // Return an empty array if no bctolvDiv found
        });
      });

      console.log('New Reviews:', newReviews); // Log new reviews found
      reviews.push(...newReviews);

      // Scroll inside the reviews container
      await page.evaluate(() => {
        const reviewDiv = document.querySelector("div._17itzz4");
        reviewDiv.scrollBy(0, reviewDiv.scrollHeight); // Scroll to the bottom
      });

      // Wait for new content to load
      await new Promise(resolve => setTimeout(resolve, 1000)); // Adjust wait time if needed

      const newHeight = await page.evaluate(() => {
        const reviewDiv = document.querySelector("div._17itzz4");
        return reviewDiv.scrollHeight;
      });

      // Break the loop if no new reviews are found
      if (newHeight === previousHeight) {
        break;
      }
      previousHeight = newHeight; // Update the previous height
    }

    console.log('Finished scraping for:', href);

    reviewPage.push({
      href: reviewUrl,
      reviews: reviews
    });
  }

  // Output the scraped reviews in JSON format
  console.log(JSON.stringify(reviewPage, null, 2));
  await browser.close();
})();
