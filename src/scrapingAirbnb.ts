const puppeteer = require('puppeteer');

interface ListingData {
    title: string;
    address: string;
    price: string;
    image: string[];
}

async function webScraping(city: string, country: string): Promise<ListingData[]> {
    let browser;
    try {
        browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        await page.goto(`https://www.airbnb.co.in/s/${city}--${country}/homes`);
        await page.waitForSelector("div.c4mnd7m.atm_9s_11p5wf0.atm_dz_1osqo2v.dir.dir-ltr");

        const [divImages, titles, addresses, prices] = await Promise.all([
            extractImages(page),
            extractTexts(page, 'div.t1jojoys'),
            extractTexts(page, 'span[data-testid="listing-card-name"]'),
            extractPrices(page)
        ]);

        console.log({ prices, addresses, titles, images: divImages.flat() });
        console.log({ 
            pricesLength: prices.length,
            addressesLength: addresses.length,
            titlesLength: titles.length,
            imagesLength: divImages.length
        });

        return createDataObjects(titles, addresses, prices, divImages);
    } catch (error) {
        console.error('Error during web scraping:', error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}

async function extractImages(page: Page): Promise<string[][]> {
    return page.$$eval('div.c4mnd7m.atm_9s_11p5wf0.atm_dz_1osqo2v.dir.dir-ltr', 
        (elements: Element[]) => elements.map(el => Array.from(el.getElementsByTagName('img')).map(img => img.src))
    );
}

async function extractTexts(page: Page, selector: string): Promise<string[]> {
    return page.$$eval(selector, (elements: Element[]) => elements.map(el => el.textContent?.trim() || ''));
}

async function extractPrices(page: Page): Promise<string[]> {
    return page.evaluate(() => {
        const priceElements = document.querySelectorAll('div[data-testid="price-availability-row"] ._1jo4hgw ._11jcbg2');
        return Array.from(priceElements).map(el => (el as HTMLElement).innerText.trim());
    });
}

function createDataObjects(titles: string[], addresses: string[], prices: string[], divImages: string[][]): ListingData[] {
    return prices.map((price, i) => ({
        title: titles[i],
        address: addresses[i],
        price,
        image: divImages[i]
    }));
}

export default webScraping;
