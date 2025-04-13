const express = require("express");
const axios = require("axios");

const app = express();
const port = 3000;

app.get("/gold", async (req, res) => {
  try {
    const response = await axios.get("https://api.talasea.ir/api/market/getGoldPrice");
    const data = response.data;

    const price = data.price * 1000; // قیمت طلا به تومان
    const formatted_price = price.toLocaleString(); // فرمت قیمت با کاما
    const change_24h_percent = data.change24h;
    const developer = "Ehsan Fazli";

    // ایجاد پاسخ JSON
    const result = {
      developer,
      price_toman: price,
      formatted_price,
      change_24h_percent,
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
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
