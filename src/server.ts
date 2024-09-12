import webScraping from './scrapingAirbnb';
import express, { Express, Request, Response } from 'express';
const app: Express = express();
const port = process.env.PORT || 3000;


app.get('/', async (req: Request, res: Response) => {
    try {
        const { city, country } = req.query;
        
        if (!city || !country || typeof city !== 'string' || typeof country !== 'string') {
            return res.status(400).json({ error: 'City and country are required parameters and must be strings' });
        }

        const data = await webScraping(city, country);
        res.json(data);
    } catch (error) {
        console.error('Error during web scraping:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});