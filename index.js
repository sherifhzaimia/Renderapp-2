const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 4000;

// دالة scrapeLogic المدمجة لتسجيل الدخول واستخراج معلومات الجلسة
const scrapeLogic = async (res) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

  try {
    const page = await browser.newPage();

    // الانتقال إلى صفحة تسجيل الدخول
    await page.goto('https://cromur.com/member-login/', { waitUntil: 'networkidle2' });

    // إدخال بيانات تسجيل الدخول
    await page.type('#iump_login_username', 'miannastephens13@gmail.com');
    await page.type('#iump_login_password', 'Rankerfox.com$cromur45');
    await page.click('input[name="Submit"]');
    
    // انتظار التحميل بعد تسجيل الدخول
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // استخراج الكوكيز بعد تسجيل الدخول
    const cookies = await page.cookies();
    const sessionToken = cookies.find(cookie => cookie.name === 'wordpress_logged_in_ff2021aca1979e72ef427c8eb0b0cc4d');

    if (sessionToken) {
      const tokenData = {
        name: sessionToken.name,
        value: sessionToken.value,
        domain: sessionToken.domain,
        path: sessionToken.path,
        expires: sessionToken.expires,
        httpOnly: sessionToken.httpOnly,
        secure: sessionToken.secure
      };

      // حفظ التوكن في ملف
      fs.writeFileSync('sessionToken.json', JSON.stringify(tokenData, null, 2));
      console.log('تم استخراج توكين الجلسة وحفظه بنجاح في ملف sessionToken.json');
      
      // إرسال التوكن في استجابة
      res.json({ success: true, token: tokenData });
    } else {
      console.log('لم يتم العثور على توكين الجلسة.');
      res.json({ success: false, message: 'لم يتم العثور على توكين الجلسة.' });
    }

  } catch (error) {
    console.error('حدث خطأ:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء استخراج التوكين.' });
  } finally {
    await browser.close();
  }
};

// مسار "/scRenderapp-2rape" لتنفيذ دالة scrapeLogic
app.get("/scrape", (req, res) => {
  scrapeLogic(res);
});

// مسار "/" لإرسال رسالة بسيطة
app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

