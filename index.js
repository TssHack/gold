const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

// آبجکت نگاشت نام‌ها به اسلاگ‌های سایت tgju.org
const names = {
  price: {
    dollar: 'price_dollar_rl',
    tala: 'geram18', // توجه: این به نظر اشتباه میاد، معمولا طلا ۱۸ عیار است نه تالا
    emami: 'sekee',
    azadi: 'sekeb',
    eur: 'price_eur',
    bourse: 'bourse',
    // tgju_gold_irg18: 'tgju_gold_irg18', // این نام کلید معتبر جاوااسکریپت نیست
    gold_irg18: 'tgju_gold_irg18', // نام کلید را اصلاح کردم
    mesghal: 'mesghal',
    geram24: 'geram24',
    geram18: 'geram18' // این با tala تکراری است، شاید منظور انس طلا بوده؟
  }
};

// تابع آسنکرون برای دریافت قیمت از سایت tgju.org
const fetchPrice = async (slug) => {
  const url = `https://www.tgju.org/profile/${slug}`;
  try {
    // console.log(`Workspaceing: ${url}`); // برای دیباگ کردن می‌توانید این خط را فعال کنید
    const response = await axios.get(url, {
        // اضافه کردن هدرهای مرورگر برای جلوگیری از بلاک شدن احتمالی
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000 // اضافه کردن تایم‌اوت ۱۰ ثانیه برای جلوگیری از انتظار بی‌نهایت
    });
    const html = response.data;

    // استفاده از regex برای پیدا کردن قیمت در تگ span مشخص
    // نکته: استفاده از regex برای پارس کردن HTML شکننده است و ممکن است با تغییر سایت از کار بیفتد.
    // کتابخانه‌هایی مثل Cheerio برای این کار مناسب‌تر هستند.
    const match = html.match(/<span data-col="info\.last_trade\.PDrCotVal">(.*?)<\/span>/);

    if (match && match[1]) {
      // حذف کاماها، تبدیل به عدد و تقسیم بر ۱۰ (احتمالا برای تبدیل ریال به تومان)
      const priceString = match[1].replace(/,/g, '');
      const priceNumber = Number(priceString);

      // بررسی اینکه آیا تبدیل به عدد موفقیت آمیز بوده
      if (!isNaN(priceNumber)) {
          const price = priceNumber / 10;
          return price.toLocaleString('fa-IR'); // فرمت کردن عدد با کاما به سبک فارسی
      } else {
          console.warn(`Could not parse price string "${priceString}" for slug: ${slug}`);
          return null; // اگر مقدار داخل تگ عدد نبود
      }
    }
    console.warn(`Price pattern not found for slug: ${slug}`);
    return null; // اگر الگوی قیمت پیدا نشد
  } catch (error) {
    // لاگ کردن خطا برای دیباگ
    console.error(`Error fetching price for slug ${slug}: ${error.message}`);
    // پرتاب مجدد خطا برای اینکه Promise.allSettled آن را به عنوان 'rejected' شناسایی کند
    throw error;
  }
};

// روت اصلی برای دریافت قیمت‌ها
app.get('/', async (req, res) => {
  const requestedName = req.query.name; // نام درخواستی از کوئری استرینگ

  // --- مدیریت درخواست برای همه‌ی قیمت‌ها ---
  if (requestedName === 'all') {
    const results = {};
    // تبدیل آبجکت names.price به آرایه‌ای از پراسس‌ها برای fetchPrice
    const pricePromises = Object.entries(names.price).map(async ([key, slug]) => {
      // هر پراسس یک آبجکت با کلید و قیمت برمی‌گرداند یا خطا می‌دهد
      const price = await fetchPrice(slug);
      // فقط در صورتی که قیمت null نباشد، آن را برگردان
      if (price !== null) {
        return { key, price };
      }
      // اگر قیمت null بود (یعنی پیدا نشد یا پارس نشد)، چیزی برنگردان که در نتیجه نیاید
      // خطاها توسط catch در fetchPrice مدیریت شده و باعث reject شدن پراسس می‌شوند
      return null;
    });

    // اجرای همزمان تمام پراسس‌ها و انتظار برای تکمیل همه آن‌ها
    const settledResults = await Promise.allSettled(pricePromises);

    // پردازش نتایج Promise.allSettled
    settledResults.forEach(result => {
      // فقط اگر پراسس موفقیت‌آمیز بود (fulfilled) و مقدار null نبود، آن را به نتایج اضافه کن
      if (result.status === 'fulfilled' && result.value !== null) {
        results[result.value.key] = result.value.price;
      }
      // اگر پراسس رد شده بود (rejected) یا مقدار null بود، کاری انجام نده (یعنی به نتایج اضافه نشود)
      // می‌توانید در اینجا لاگ کنید:
      // else if (result.status === 'rejected') {
      //   console.warn(`Promise rejected for one of the prices: ${result.reason.message}`);
      // } else {
      //   console.warn(`Promise fulfilled but value was null.`);
      // }
    });

    // ارسال پاسخ JSON با نتایج فیلتر شده
    return res.status(200).json({
      status: 200,
      by: '@abj0o',
      result: results // فقط شامل کلیدهایی است که با موفقیت دریافت و پردازش شده‌اند
    });
  }

  // --- مدیریت درخواست برای یک آیتم خاص ---
  const slug = names.price[requestedName]; // پیدا کردن اسلاگ مربوط به نام درخواستی

  // اگر نام درخواستی در لیست نام‌های ما وجود نداشت
  if (!slug) {
    return res.status(400).json({
      status: 400,
      by: '@abj0o',
      result: {
        message: `نماد '${requestedName || ''}' معتبر نیست.` // پیام خطای واضح‌تر
      }
    });
  }

  // تلاش برای دریافت قیمت آیتم مشخص شده
  try {
    const price = await fetchPrice(slug);
    if (price !== null) { // بررسی دقیق که قیمت null نباشد
      // اگر قیمت با موفقیت دریافت شد
      res.status(200).json({
        status: 200,
        by: '@abj0o',
        result: {
          price: price
        }
      });
    } else {
      // اگر قیمت در صفحه پیدا نشد یا قابل پارس کردن نبود (fetchPrice مقدار null برگرداند)
      res.status(404).json({ // استفاده از کد وضعیت 404 Not Found مناسب‌تر است
        status: 404,
        by: '@abj0o',
        result: {
          message: `قیمت برای نماد '${requestedName}' یافت نشد.` // پیام خطای واضح‌تر
        }
      });
    }
  } catch (error) {
    // اگر در هنگام ارتباط با سرور tgju خطایی رخ داد (مثلاً خطای شبکه، تایم‌اوت)
    res.status(502).json({ // استفاده از 502 Bad Gateway مناسب‌تر است چون مشکل از سرور واسط (ما) نیست
      status: 502,
      by: '@abj0o',
      result: {
        message: `خطا در دریافت اطلاعات از منبع برای نماد '${requestedName}'.` // پیام خطای واضح‌تر
        // error: error.message // می‌توانید جزئیات خطا را هم در پاسخ قرار دهید (برای دیباگ)
      }
    });
  }
});

// اجرای سرور اکسپرس
app.listen(PORT, () => {
  console.log(`سرور با موفقیت روی پورت ${PORT} اجرا شد.`);
  console.log(`برای تست به آدرس http://localhost:${PORT}/?name=all یا http://localhost:${PORT}/?name=dollar مراجعه کنید.`);
});
