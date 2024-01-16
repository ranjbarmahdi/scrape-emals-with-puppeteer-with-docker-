const puppeteer = require('puppeteer');
const cheerio = require('cheerio')
const { delay, extractValidProxies } = require('./utils.js')
const fs = require('fs')

async function getProxyFromFreeProxy(browser) {
    let proxyList = [];
    try {
        const URL = 'https://www.freeproxy.world/?type=http&anonymity=&country=IR&speed=&port=&page=1';
        console.log(URL);
        const page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080,
        });
        await page.goto(URL, {timeout:180000})
    
        await delay(5000)
        const html = await page.content();
        const $ = cheerio.load(html);
    
        proxyList = $('table > tbody > tr')
            .map((i, tr) => {
                const ip = $(tr).find('td:first-child').text().trim();
                const port = $(tr).find('td:nth-child(2)').text().trim();
                return `${ip}:${port}`
            }).get()
        await page.close();
    }
    catch (error) {
        console.log("Error in getProxyFromFreeProxy", error);goto
    }
    return proxyList;
};


async function getProxyFromFreeProxyCZ(browser) {
    let proxyList = [];
    try {
        const URL = 'http://free-proxy.cz/en/proxylist/country/IR/http/ping/all';
        console.log(URL);
        const page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080,
        });
        await page.goto(URL, {timeout:180000})
    
        await delay(5000)
        const html = await page.content();
        const $ = cheerio.load(html);
    
        proxyList = $('table#proxy_list > tbody > tr')
            .map((i, tr) => {
                const ip = $(tr).find('td:first-child').text().trim();
                const port = $(tr).find('td:nth-child(2)').text().trim();
                return `${ip}:${port}`
            })
            .get()
            await page.close();
    }
    catch (error) {
        console.log("Error in getProxyFromFreeProxyCZ", error);    
    }
    return proxyList;
};


async function getProxyFromFreeProxySpider(browser) {
    let proxyList = [];
    try {
        const URL = 'https://proxy-spider.com/proxies/locations/ir-iran-islamic-republic-of';
        console.log(URL);
        const page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080,
        });
        await page.goto(URL, {timeout:180000})
    
        await delay(5000)
        const html = await page.content();
        const $ = cheerio.load(html);
    
        proxyList = $('table> tbody > tr')
            .map((i, tr) => {
                const ip = $(tr).find('td:first-child').text().trim();
                const port = $(tr).find('td:nth-child(2)').text().trim();
                return `${ip}:${port}`
            }).get()
            await page.close();
    }
    catch (error) {
        console.log("Error in getProxyFromFreeProxySpider");
    }
    return proxyList;
};


async function getProxyFromFreeProxyList(browser) {
    let proxyList = [];
    try {
        const URL = 'https://freeproxylist.cc/online/Iran/';
        console.log(URL);
        const page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080,
        });
        await page.goto(URL, {timeout:180000})
    
        await delay(5000)
        const html = await page.content();
        const $ = cheerio.load(html);
    
        proxyList = $('table > tbody > tr')
            .map((i, tr) => {
                const ip = $(tr).find('td:first-child').text().trim();
                const port = $(tr).find('td:nth-child(2)').text().trim();
                return `${ip}:${port}`
            }).get()
            await page.close();
    }
    catch (error) {
        console.log("Error in getProxyFromFreeProxy", error);
    }
    return proxyList;
};


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

async function getAllProxy() {
    let allProxies = [];
    try {
        const browser = await getBrowser();

        allProxies.push(...await getProxyFromFreeProxy(browser));
        allProxies.push(...await getProxyFromFreeProxyCZ(browser));
        allProxies.push(...await getProxyFromFreeProxySpider(browser));
        allProxies.push(...await getProxyFromFreeProxyList(browser));

        // extract valid proxies
        allProxies = await extractValidProxies(allProxies);
        allProxies = Array.from(new Set(allProxies));
        
        await browser.close();
    }
    catch (error) {
        console.log("Error in getAllProxy", error);
    }
    fs.writeFileSync('./proxyList.text', allProxies.join('\n'));

    return allProxies;
}

module.exports = {
    getAllProxy
}