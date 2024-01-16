const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { suitableJsonOutput, writeExcel, delay, getRandomElement, downloadImages, getBrowser, convertToEnglishNumber } = require('../utils')




const proxyList = ['ss://YWVzLTI1Ni1nY206d0DVaGt6WGpjRA==@38.54.13.15:31214#main']


// ============================================ findAllMainLinks
async function findAllMainLinks(page, initialUrl) {
    const allMainLinks = [];
    console.log("start find main links");

    try {
        // go to url
        const url = initialUrl;
        await page.goto(url, { timeout: 180000 });

        // sleep 5 second 
        await delay(5000);

        // load cheerio
        const html = await page.content();
        const $ = cheerio.load(html);

        // Getting All Main Urls In This Page
        const mainLinks = $('notFound').map((i, e) =>  $(e).attr('href')).get()

    
        // Push This Page Products Urls To allProductsLinks
        allMainLinks.push(...mainLinks);

        // -----
        allMainLinks.push(initialUrl)

    } catch (error) {
        console.log("Error In findAllMainLinks function", error);
    }
     finally {
         return Array.from(new Set(allMainLinks));
    }
}


// ============================================ findAllPagesLinks
async function findAllPagesLinks(page, mainLinks) {
    const allPagesLinks = []
    console.log("start find all pages links");

    // find pagination and pages     
    for (let i = 0; i < mainLinks.length; i++){
        try {
            // go to url
            const url = mainLinks[i];
            await page.goto(url, {timeout: 180000});
            await delay(5000);

            // load cheerio
            const html = await page.content();
            const $ = cheerio.load(html);
            
            // find last page number and preduce other pages urls
            const paginationElement = $('.paging-wrapper');
            if (paginationElement.length) {
                let lsatPageNumber = $(paginationElement).find('>.paging_number:last-child')?.text().trim();
                lsatPageNumber = convertToEnglishNumber(lsatPageNumber);
                for (let j = 1; j <= lsatPageNumber; j++){
                    const newUrl = url + `~page~${j}`
                    allPagesLinks.push(newUrl)
                }
            }
            else {
                allPagesLinks.push(url)
            }
            
        } catch (error) {
            console.log("Error in findAllPagesLinks", error);
        }
    }      

    return Array.from(new Set(allPagesLinks));
}


// ============================================ findAllProductsLinks
async function findAllProductsLinks(page, allPagesLinks) {
    const allProductsLinks = [];
    console.log("start find all products links");
    for (let i = 0; i < allPagesLinks.length; i++){
        try {
            const url = allPagesLinks[i];
            await page.goto(url, { timeout: 180000 });

            // sleep 5 second when switching between pages
            await delay(5000);


            let nextPageBtn;
            do {
                // load cheerio
                const html = await page.content();
                const $ = cheerio.load(html);

                // Getting All Products Urls In This Page
                const productsUrls = $('.prd-info > .item-title > h2 > a').map((i, e) => 'https://emalls.ir' + $(e).attr('href')).get()
                
                // Push This Page Products Urls To allProductsLinks
                allProductsLinks.push(...productsUrls);

                // click to go to next page
                nextPageBtn = await page.$$('NotFound');
                if(nextPageBtn.length){
                        let btn = nextPageBtn[0];
                        await btn.click();
                }
                await delay(3000);
            }
            while(nextPageBtn.length)
        } catch (error) {
            console.log("Error In findAllProductsLinks function", error);
        }
    }

    return Array.from(new Set(allProductsLinks));
}



// ============================================ findProductsLinks
async function findProductsLinks(proxyList, url, headless=true, withProxy=true) {
    let productsLinks = []
    let browser;
    let page;
    try {
        // get random proxy
        const randomProxy = getRandomElement(proxyList);
        
        // lunch browser
        browser = await getBrowser(randomProxy, headless, withProxy);

        // open new page, goto destination url
        page = await browser.newPage();
        await page.setViewport({
               width: 1920,
               height: 1080,
            });     

        
        // find main links
        const mainLinks = await findAllMainLinks(page, url);

        // find all pages links
        const allPagesLinks = await findAllPagesLinks(page, mainLinks);

        // find all products links
        productsLinks = await findAllProductsLinks(page, allPagesLinks)

    } catch (error) {
        console.log("Error in findProductsLinks function", error);
    }
    finally {
        // delay
        await delay(3000);

        // close browser and page
        await page.close();
        await browser.close();

        // return product
        return productsLinks;
    }
}


// ============================================ Export
module.exports = {
    findProductsLinks
}