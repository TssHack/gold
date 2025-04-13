const express = require('express');
const axios = require('axios');
const app = express();

app.get('/gold', async (req, res) => {
  try {
    const response = await axios.get('https://api.talasea.ir/api/market/getGoldPrice');
    const data = response.data;

    const pricePerSoot = parseInt(data.price);      // e.g., 6539
    const pricePerGram = pricePerSoot * 100;        // e.g., 6539000
    const change = parseFloat(data.change24h).toFixed(2); // e.g., -12.19

    const result = {
      developer: "Ehsan Fazli",
      price_toman: pricePerGram,
      formatted_price: pricePerGram.toLocaleString('en-US'),
      change_24h_percent: change,
      min_order_value: data.minOrderValue,
      min_sell_order_value: data.minSellOrderValue,
      fee_table: data.feeTable,
      total_order_30day_values: data.totalOrder30dayValues,
      min_deposit: data.minDeposit,
      max_deposit: data.maxDeposit,
      max_order_value: data.maxOrderValue,
      fee: data.fee
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gold price data' });
  }
});

app.listen(3000, () => {
  console.log('Server is running at http://localhost:3000/gold-price');
});
