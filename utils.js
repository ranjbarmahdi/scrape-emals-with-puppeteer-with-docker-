const reader = require('xlsx');
const fs = require('fs')
const puppeteer = require("puppeteer");
const fetch = require('node-fetch');
const path = require('path')

//============================================ Writing Json File As Excel
function writeExcel(jsonFile, excelDir) {
    let workBook = reader.utils.book_new();
    const workSheet = reader.utils.json_to_sheet(jsonFile);
    reader.utils.book_append_sheet(workBook, workSheet, `response`);
    reader.writeFile(workBook, excelDir);
}


//============================================ suitable Json Format For Farboddddddddd
function suitableJsonOutput(oldJson){
    const suitableOutput = oldJson.map((item, index) => {
        const productExcelDataObject = {
            URL: item.URL,
            xpath: item.xpath,
            'خصوصیات / ویژگی‌ها': item.specifications,
            'توضیحات': item.description,
            offPrice: item.offPrice,
            'قیمت (تومان)': item.price ,
            'واحد اندازه‌گیری': 'عدد' ,
            'دسته‌بندی': item.category ,
            'برند': item.brand ,
            SKU: item.SKU,
            name: item.name ,
            'ردیف': index + 1 
        };
        if (!productExcelDataObject['قیمت (تومان)'] && !productExcelDataObject['offPrice']) {
            productExcelDataObject['xpath'] = '';
        }
        return productExcelDataObject;
    })
    return suitableOutput;
}


//============================================ delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));


//============================================ choose a random element from an array
const getRandomElement = (array) => {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}


//============================================ scroll to end
async function scrollToEnd() {
    await page.evaluate(async () => {
    await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const maxScrolls = 50; // You can adjust the number of scrolls

        const scrollInterval = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        // Stop scrolling after reaching the bottom or a certain limit
        if (totalHeight >= scrollHeight || totalHeight >= distance * maxScrolls) {
            clearInterval(scrollInterval);
            resolve();
        }
        }, 500); // You can adjust the scroll interval
    });
    });
}


//============================================ find seller
const findSeller = (sellersDbPath, sellerName) => {
    try {
        const sellers = require(sellersDbPath);
        return sellers.find(seller => seller.sellerName == sellerName );
    }
    catch (error) {
        console.log("Error selerExists function", error);
    }
}


//============================================ Download Images
async function downloadImages(imagesUrls, imagesDIR, uuid) {
    for (let i = 0; i < imagesUrls.length; i++) {
        try {
            
            const imageUrl = imagesUrls[i];
            const response = await fetch(imageUrl);
            if (response.status == 200) {

                const buffer = await response.buffer();
                const imageType = path.extname(imageUrl);
                const localFileName = `${uuid}-${i + 1}${imageType}`;
                const imageDir = path.normalize(
                        imagesDIR + "/" + localFileName
                );
                fs.writeFileSync(imageDir, buffer);
            }
        } catch (error) {
            console.log("Error In Download Images", error);
        }
    }
}


//============================================ Login
async function login(page, url ,userOrPhone, pass) {
     try {
          await page.goto(url, { timeout: 360000 });

          let u = "09376993135";
          let p = "hd6730mrm";
          // sleep 5 second
          console.log("-------sleep 5 second");
          await delay(5000);

          // load cheerio
          const html = await page.content();
          const $ = cheerio.load(html);

          const usernameInputElem = await page.$$('input#username');
          await page.evaluate((e) => e.value = "09376993135" ,usernameInputElem[0]);
          await delay(3000);

          const continueElem = await page.$$('.register_page__inner > button[type=submit]');
          await continueElem[0].click();
          await delay(3000);

          const passwordInputElem = await page.$$('input#myPassword');
          await passwordInputElem[0].type("hd6730mrm");
          // await page.evaluate((e) => e.value = "hd6730mrm" ,passwordInputElem[0]);
          await delay(3000);

          const enterElem = await page.$$('.register_page__inner > button[type=submit]');
          await enterElem[0].click();
          await delay(3000);
          
     } catch (error) {
          console.log("Error In login function", error);
     }
}


//============================================ convert To English Number
function convertToEnglishNumber(inputNumber) {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  // Check if the input contains Persian numbers
  const containsPersianNumber = new RegExp(`[${persianNumbers.join('')}]`).test(inputNumber);

  if (containsPersianNumber) {
    // Convert Persian numbers to English numbers
    for (let i = 0; i < 10; i++) {
      const persianDigit = new RegExp(persianNumbers[i], 'g');
      inputNumber = inputNumber.replace(persianDigit, i.toString());
    }
    return inputNumber;
  } else {
    // Input is already an English number, return as is
    return inputNumber;
  }
}


// ============================================ getBrowser
const getBrowser = async (proxyServer, headless = true, withProxy = true) => {
    try {
        const args = (withProxy) => {
            if (withProxy == true) {
                console.log("terue");
                return ["--no-sandbox", "--disable-setuid-sandbox", `--proxy-server=${proxyServer}`]
            }
            else {
                return ["--no-sandbox", "--disable-setuid-sandbox"]
            }
        }
        // Lunch Browser
        const browser = await puppeteer.launch({
            headless: headless, // Set to true for headless mode, false for non-headless
            executablePath:
                process.env.NODE_ENV === "production"
                        ? process.env.PUPPETEER_EXECUTABLE_PATH
                    : puppeteer.executablePath(),
            args: args(withProxy)
        });     

        return browser;
    }
    catch (error) {
        console.log("Error in getBrowserWithProxy function", error);
    }
}


module.exports = {
    writeExcel,
    suitableJsonOutput,
    delay,
    getRandomElement,
    downloadImages,
    findSeller,
    getBrowser,
    convertToEnglishNumber
}



