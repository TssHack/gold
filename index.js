const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

const names = {
  price: {
    dollar: 'price_dollar_rl',
    eur: 'price_eur',
    tala: 'geram18',
    emami: 'sekee',
    azadi: 'sekeb',
    pound: 'price_gbp',
    lira: 'price_try',
    bitcoin: 'bitcoin',
    oil: 'oil_brent',
    gold_global: 'gold_global'
  }
};

const fetchPrice = async (slug) => {
  const url = `https://www.tgju.org/profile/${slug}`;
  const response = await axios.get(url);
  const html = response.data;

  const match = html.match(/<span data-col="info\.last_trade\.PDrCotVal">(.*?)<\/span>/);
  if (match && match[1]) {
    const price = Number(match[1].replace(/,/g, '')) / 10;
    return price.toLocaleString();
  }
  return null;
};

app.get('/', async (req, res) => {
  const text = req.query.name;

  // اگر همه‌ی قیمت‌ها خواسته شده
  if (text === 'all') {
    let results = {};
    for (let key in names.price) {
      try {
        const price = await fetchPrice(names.price[key]);
        results[key] = price ?? 'ناموجود';
      } catch {
        results[key] = 'خطا در دریافت';
      }
    }

    return res.status(200).json({
      status: 200,
      by: '@abj0o',
      result: results
    });
  }

  // فقط یک آیتم خواسته شده
  const type = names.price[text];
  if (!type) {
    return res.status(400).json({
      status: 400,
      by: '@abj0o',
      result: {
        message: 'نماد مورد نظر پیدا نشد'
      }
    });
  }

  try {
    const price = await fetchPrice(type);
    if (price) {
      res.status(200).json({
        status: 200,
        by: '@abj0o',
        result: {
          price
        }
      });
    } else {
      res.status(500).json({
        status: 500,
        by: '@abj0o',
        result: {
          message: 'قیمت یافت نشد'
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      by: '@abj0o',
      result: {
        message: 'خطا در دریافت اطلاعات'
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
