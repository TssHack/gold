
const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

async function fetch(type) {
    const response = await axios.post(`https://admin.alanchand.com/api/${type}?lang=fa`, {}, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    return response.data;
}

app.get('/data', async (req, res) => {
    const type = req.query.type || 'arz';

    try {
        const data = await fetch(type);
        const result = [];

        if (type === 'arz') {
            data.arz.forEach(item => {
                const latest = item.price[item.price.length - 1];
                result.push({
                    name: item.name,
                    price: latest.price,
                    low: latest.low,
                    high: latest.hi
                });
            });
        } else if (type === 'gold') {
            data.gold.forEach(item => {
                const latest = item.price[item.price.length - 1];
                result.push({
                    name: item.name,
                    price: latest.price,
                    low: latest.low,
                    high: latest.hi
                });
            });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
