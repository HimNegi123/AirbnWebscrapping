const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://www.airbnb.co.in/s/New-Delhi--India/homes?flexible_trip_lengths%5B%5D=one_week&monthly_start_date=2024-10-01&monthly_length=3&monthly_end_date=2025-01-01&query=New%20Delhi&place_id=ChIJLbZ-NFv9DDkRzk0gTkm3wlI&refinement_paths%5B%5D=%2Fhomes&tab_id=home_tab&date_picker_type=calendar&checkin=2024-09-24&checkout=2024-09-28&source=structured_search_input_header&search_type=user_map_move&search_mode=regular_search&price_filter_input_type=0&price_filter_num_nights=4&channel=EXPLORE&ne_lat=28.58867622074593&ne_lng=77.79144078018521&sw_lat=27.750076188347915&sw_lng=76.42459293159038&zoom=10.774712291355238&zoom_level=9.39679201245678&search_by_map=true&drawer_open=false&map_toggle=true');
  
  await page.waitForSelector("div.c4mnd7m.atm_9s_11p5wf0.atm_dz_1osqo2v.dir.dir-ltr");
  
  const hrefs = await page.evaluate(() => {
    const div = document.querySelector("div.c4mnd7m.atm_9s_11p5wf0.atm_dz_1osqo2v.dir.dir-ltr");
    return Array.from(div.querySelectorAll('a')).map(a => a.href);
  });

  const reviewPage = [];

  for (const href of hrefs) {
    await page.goto(href, { waitUntil: 'networkidle0' });
    
    // Wait for the reviews section to load
    await page.waitForSelector("span.lrl13de"); // Update this selector if needed

    const reviews = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("span.lrl13de")).map(reviewSpan => {
        return reviewSpan.innerText; // Extract text from the review span
      });
    });

    reviewPage.push({
      href: href,
      reviews: reviews
    });
  }

  console.log(JSON.stringify(reviewPage, null, 2));
  await browser.close();
})();
