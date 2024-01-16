const puppeteer = require('puppeteer');
const cheerio = require('cheerio')
const { delay, extractValidProxies } = require('./utils.js');



async function getBrowser() {
    // lunch headless browser
    const browser = await puppeteer.launch({
                headless: false, 
                executablePath:
                    process.env.NODE_ENV === "production"
                            ? process.env.PUPPETEER_EXECUTABLE_PATH
                            : puppeteer.executablePath(),
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });

    return browser;
}

async function getCheckedProxies(proxyList) {
    let allCheckedProxy = [];
    try {
        const URL = 'https://hidemy.io/en/proxy-checker/';
        const proxyString = proxyList.join('\n');
        const browser = await getBrowser();
        const page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080,
        });
        await page.goto(URL, {timeout:180000});
        await delay(3000)

        // find text area elem then fill it with peoxy list
        const textAreaElem = await page.$('.input_text_field');
        await textAreaElem.type(proxyString);
        await delay(3000)
    

        // find start check button then click on it
        const startCheckBtnElem = await page.$('#chkb1');
        await startCheckBtnElem.click();

        console.log("Start Checking Proxies");
        await delay(60000)
        console.log("End Checking Proxies");

        // cheerio
        let html = await page.content();
        let $ = cheerio.load(html);

        // get useable proxies
        allCheckedProxy = $('table> tbody > tr.n-good-work')
            .map((i, tr) => {
                const ip = $(tr).find('td:first-child').text().trim();
                const port = $(tr).find('td:nth-child(2)').text().trim();
                return `${ip}:${port}`
            }).get()

        console.log(allCheckedProxy);
        allCheckedProxy = extractValidProxies(allCheckedProxy);
        
        // close browser and page
        await page.close();
        await browser.close();
    }
    catch (error) {
        console.log("Error in getAllProxy", error);
    }
    return allCheckedProxy;
}

module.exports = {
    getCheckedProxies
}