const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { suitableJsonOutput, writeExcel, delay, getRandomElement, downloadImages, findSeller, getBrowser } = require('../utils')
const axios = require('axios');



// ============================================ getSellerDetail
const getSellerDetail = async (browser, page, sellerRowElement, sellerImagesDir, sellersDbDir) => {
    let sellerDetailPage;
    const sellerInfo = {}
    try {
        // find seller page url
        const sellerPageNameElem = await sellerRowElement.$$('.shop-logo-wrapper > .shopnamespan > .shoplogotitle');
        const sellerPageUrl = await page.evaluate((e) => e.href, sellerPageNameElem[0]);

        // create new page, goto seller detail page
        sellerDetailPage = await browser.newPage();
        await sellerDetailPage.setViewport({
            width: 1920,
            height: 1080,
        });

        await sellerDetailPage.goto(sellerPageUrl, { timeout: 180000 });
        await delay(5000);

        // load cheerio
        const html = await sellerDetailPage.content();
        const $ = cheerio.load(html);

        // get seller data
        sellerInfo['sellerName'] = $('#ContentPlaceHolder1_lblShopTitle').length ? $('#ContentPlaceHolder1_lblShopTitle').text().trim() : "";
        sellerInfo['city'] = $('#ContentPlaceHolder1_lblLocation').length ? $('#ContentPlaceHolder1_lblLocation').text().split('-')[1]?.trim() : ""
        sellerInfo['address'] = $('#ContentPlaceHolder1_lblAddress').length ? $('#ContentPlaceHolder1_lblAddress').text().trim() : "";
        sellerInfo['phone'] = $('#ContentPlaceHolder1_lblTelephone').length ? $('#ContentPlaceHolder1_lblTelephone').text().trim() : "";
        sellerInfo['uuid'] = '';

        // check if seller not exists, generate uuid an download image, add seller
        const seller = findSeller(sellersDbDir, sellerInfo['sellerName']);
        if (!seller) {
            // Generate uuidv4
            const uuid = uuidv4().replace(/-/g, "");
            sellerInfo['uuid'] = uuid;

            // download images
            let imagesUrls = $('#ContentPlaceHolder1_imgLogo').map((i, img) => $(img)?.attr("src")?.replace(/(-[0-9]+x[0-9]+)/g, "")).get();
            imagesUrls = Array.from(new Set(imagesUrls));
            await downloadImages(imagesUrls, sellerImagesDir, sellerInfo['uuid']);

            // add seller and write sellerDB
            const sellersDB = require(sellersDbDir);
            sellersDB.push(sellerInfo);
            fs.writeFileSync(sellersDbDir, JSON.stringify(sellersDB, null, 4));
        }
        else {
            sellerInfo['uuid'] = seller.uuid;
        }
    }
    catch (error) {
        console.log("Error in get getSellerDetail function", error);
    }
    finally {
        // close seller page 
        await sellerDetailPage.close();

        // return sellerInfo
        return sellerInfo;
    }
}


// ============================================ getPrice
const getPrice = async (page, sellerRowElement) => {
    let price = "";
    try {
        const priceElement = await sellerRowElement.$$('.shop-prd-price a.shop-price');
        const deiscountElement = await sellerRowElement.$$('.shop-prd-price .shop-price-discount-box');
        if (priceElement.length) {
            price = await page.evaluate((e) => e.textContent.trim() || "", priceElement[0]);

            if (deiscountElement.length) {
                const discount = await page.evaluate((e) => e.textContent?.trim() || "", deiscountElement[0]);
                price = price.replace(discount, '');
            }
        }
    } catch (error) {
        console.log("Error in getPrice Function");
    }
    return price;
}


// ============================================ getSellerDetail
const getSellerProductDetail = async (browser, sellerRowElement) => {
    let sellerProductPage;
    let sellerProductInfo = {}
    try {
        // find seller a link to click, define newPagePromise bewfore click
        const sellerElementToClick = await sellerRowElement.$$('.shop-prd-info > a.name-info');
        const newPagePromise = new Promise((resolve) => browser.once('targetcreated', resolve));
        await sellerElementToClick[0].click();
        await delay(8000);

        // define a page variable for seller 
        const pageTarget = await newPagePromise;
        sellerProductPage = await pageTarget.page();
        await delay(2000);

        // load cheerio
        const html = await sellerProductPage.content();
        const $ = cheerio.load(html);

        // get seller data
        sellerProductInfo['url'] = await sellerProductPage.url();

    }
    catch (error) {
        console.log("Error in get getSellerProductDetail function", error);
    }
    finally {
        // close sellerProduct page 
        await sellerProductPage.close();

        // return sellerProductInfo
        return sellerProductInfo;
    }
}


// ============================================ getSellersDetail
const getSellersAndProductsDetail = async (browser, page, sellerImagesDir, sellersDbDir) => {
    const productSellers = [];
    try {
        // show more seller
        const showMroeElement = await page.$$('#btnshowhide');
        if (showMroeElement.length) {
            await showMroeElement[0].click();
            await delay(5000);
        }

        // get sellers rows
        const sellersRows = (await page.$$('.shoplist > .shop-row')).slice(0, 5);
        for (let i = 0; i < sellersRows.length; i++) {
            const sellerRow = sellersRows[i];

            // get price
            let price = await getPrice(page, sellerRow);

            // get seller info
            const sellerDetail = await getSellerDetail(browser, page, sellerRow, sellerImagesDir, sellersDbDir);   //get seller detail in emals site
            await delay(5000);

            // get seller product info (product url)
            const sellerProductDettail = await getSellerProductDetail(browser, sellerRow)  //get product detail in seller page
            await delay(5000);

            // merge data objects into seller
            const seller = { ...sellerDetail, ...sellerProductDettail, 'price': price };
            productSellers.push(seller);
        }

    }
    catch (error) {
        console.log("Error in get seller detail", error);
    }
    finally {
        return productSellers;
    }
}

// ============================================ getAveragePriceChartInfo
const myIP = async (browser, ipFounderUrl = "https://whatismyipaddress.com/") => {
    let ipPage;
    let ip = ""
    try {
        // create new page, goto ip founder page
        ipPage = await browser.newPage();
        await ipPage.setViewport({
            width: 1920,
            height: 1080,
        });

        await ipPage.goto(ipFounderUrl, { timeout: 180000 });
        await delay(5000);

        // load cheerio
        const html = await ipPage.content();
        const $ = cheerio.load(html);

        // find ip
        ip = $('#ipv4')?.text() || "";

    }
    catch (error) {
        console.log("Error in get getSellerDetail function", error);
    }
    finally {
        // close ip page 
        await ipPage.close();

        // return sellerInfo
        return ip;
    }
}


// ============================================ getAveragePriceChartInfo
async function getAveragePriceChartInfo(productURL) {
    let historyPrice = {};
    try {
        // find product id from it's url
        const lastTildaIndex = productURL.lastIndexOf('~');
        const productID = productURL.slice(lastTildaIndex + 1)?.trim();

        // generate chart url
        const chartUrl = `https://emalls.ir/chartshow.aspx?id=${productID}`

        // make request to chartUrl
        const req = await axios(chartUrl);

        if (req.status == 200) {
            // get html body, load in cheerio
            const data = req.data;
            const $ = cheerio.load(data);

            // get chart data as text
            const chart = $('script[type="text/javascript"]').text()
            const startIndex = chart.indexOf('(');
            const endIndex = chart.indexOf(']},');

            // extract text we need(date and average)
            const subStr = chart.slice(startIndex + 1, endIndex + 1);

            // extract date part from subStr as text
            const dateStartIndex = subStr.indexOf('[');
            const dateEndIndex = subStr.indexOf(']') + 1;
            const dateString = subStr.slice(dateStartIndex, dateEndIndex).trim();

            // extract average price part from subStr as text
            const averagePriceStartIndex = subStr.indexOf('data:');
            const averagePriceEndIndex = subStr.lastIndexOf(']') + 1;
            const averagePriceString = subStr.slice(averagePriceStartIndex + 5, averagePriceEndIndex).trim();

            // convert dateString and averagePriceString to array
            const dateArray = JSON.parse(dateString);
            const priceArray = JSON.parse(averagePriceString);

            historyPrice = { "date": dateArray, "price": priceArray }
        }
    }
    catch (error) {
        console.log("Error in getAveragePrice function", error);
    }
    finally {
        return historyPrice;
    }
}


// ============================================ scrapSingleProduct
async function scrapProduct(productURL, proxyList, productImagesDir, documentsDir, sellerImagesDir, sellersDbDir, headless, withProxy) {
    const product = {}
    let browser;
    let page;
    try {
        // get random proxy
        const randomProxy = getRandomElement(proxyList)

        // lunch browser
        browser = await getBrowser(randomProxy, headless, withProxy);

        // find ip 
        const ip = await myIP(browser)
        console.log(ip);
        await delay(5000);

        // open new page, goto destination url
        page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080,
        });
        await page.goto(productURL, { timeout: 180000 })
        await delay(5000);


        // load cheerio
        const html = await page.content();
        const $ = cheerio.load(html);


        // get product info
        product['title'] = $('#ContentPlaceHolder1_H1TitleDesktop').length ? $('#ContentPlaceHolder1_H1TitleDesktop').text().trim() : '';
        product['category'] = $('.breadcrumb > li:not(:last-child):gt(1)').length
            ? $('.breadcrumb > li:not(:last-child):gt(1)')
                .map((i, a) => $(a).text().trim()).get().join(" > ")
            : "";


        // Generate uuidv4
        const uuid = uuidv4().replace(/-/g, "");
        product['SKU'] = uuid;


        // find product id from it's url, then get price history
        product['historyPrice'] = {};
        product['historyPrice'] = await getAveragePriceChartInfo(productURL)
        product['URL'] = productURL;

        // download images
        let imagesUrls = $('.my-lightbox').map((i, img) => $(img)?.attr("src")?.replace(/(_thumb[0-9]+)/g, "")).get();
        imagesUrls = Array.from(new Set(imagesUrls));
        await downloadImages(imagesUrls, productImagesDir, product['SKU']);

        // get sellers detail
        const sellers = await getSellersAndProductsDetail(browser, page, sellerImagesDir, sellersDbDir);
        product['sellers'] = sellers.map(seller => {
            return {
                "sellerID": seller.uuid,
                "price": seller.price,
                "url": seller.url
            }
        })



    } catch (error) {
        console.log("Error in scrapProduct function", error);
    }
    finally {
        // close browser and page
        await page.close();
        await delay(2000);
        await browser.close();

        // return product
        return product;
    }
}


// ============================================ Export
module.exports = {
    scrapProduct
}
