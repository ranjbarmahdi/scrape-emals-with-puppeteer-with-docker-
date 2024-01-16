const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { suitableJsonOutput, writeExcel, delay } = require("./utils");

const { scrapProduct } = require("./scrape/scrapeProduct");
const { findProductsLinks } = require("./scrape/productsLinks");

async function main() {
  try {
    const INITIAL_PAGE_URL = `https://emalls.ir/%D9%84%DB%8C%D8%B3%D8%AA-%D9%82%DB%8C%D9%85%D8%AA_%D8%A7%D8%A8%D8%B2%D8%A7%D8%B1-%D9%85%DA%A9%D8%A7%D9%86%DB%8C%DA%A9%DB%8C-%D9%88-%D8%A8%D9%86%D8%B2%DB%8C%D9%86%DB%8C~Category~27570`;
    const DATA_DIR = path.normalize(__dirname + "/emals");
    const IMAGES_DIR = path.normalize(DATA_DIR + "/productsImages");
    const SELLERS_IMAGES_DIR = path.normalize(DATA_DIR + "/sellerImages");
    const DOCUMENTS_DIR = path.normalize(DATA_DIR + "/documents");
    const PRODUCTS_DB_DIR = path.normalize(DATA_DIR + "/products.json");
    const SELLERS_DB_DIR = path.normalize(DATA_DIR + "/sellersDb.json");
    const PRODUCTS_EXCEL_DIR = path.normalize(DATA_DIR + "/products.xls");
    const UNVISITED_LINKS_DIR = path.normalize(DATA_DIR + "/unvisited.json");
    const VISITED_LINKS_DIR = path.normalize(DATA_DIR + "/visited.json");
    const PROBLEM_LINKS_DIR = path.normalize(DATA_DIR + "/problem.json");

    // Create SteelAlborz Directory If Not Exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR);
    }
    if (!fs.existsSync(DOCUMENTS_DIR)) {
      fs.mkdirSync(DOCUMENTS_DIR);
    }
    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR);
    }
    if (!fs.existsSync(SELLERS_IMAGES_DIR)) {
      fs.mkdirSync(SELLERS_IMAGES_DIR);
    }

    // Create Visited, Unvisited, Products Json Database If Not Exist
    if (!fs.existsSync(UNVISITED_LINKS_DIR)) {
      fs.writeFileSync(UNVISITED_LINKS_DIR, JSON.stringify([]));
    }
    if (!fs.existsSync(VISITED_LINKS_DIR)) {
      fs.writeFileSync(VISITED_LINKS_DIR, JSON.stringify([]));
    }
    if (!fs.existsSync(PROBLEM_LINKS_DIR)) {
      fs.writeFileSync(PROBLEM_LINKS_DIR, JSON.stringify([]));
    }
    if (!fs.existsSync(PRODUCTS_DB_DIR)) {
      fs.writeFileSync(PRODUCTS_DB_DIR, JSON.stringify([]));
    }
    if (!fs.existsSync(SELLERS_DB_DIR)) {
      fs.writeFileSync(SELLERS_DB_DIR, JSON.stringify([]));
    }

    // Load Json Databases
    let unVisitedLinks = require(UNVISITED_LINKS_DIR);
    let visitedLinks = require(VISITED_LINKS_DIR);
    let productsDB = require(PRODUCTS_DB_DIR);
    let problemLinks = require(PROBLEM_LINKS_DIR);

    // checked proxy list
    // if you want to use another proxy, you can use proxy module
    const checkedProxies = [
      "vless://cae431ca-3a03-4432-be78-f3544faeafeb@tst.fastwin1.xyz:2086?type=ws&security=none&path=/&host=#eqger-1839030-62647",
      "ss://YWVzLTI1Ni1nY206d0DVaGt6WGpjRA==@38.54.13.15:31214#main",
    ];

    // find products links
    // if you want to see chromium you can set headless=false in findProductsLinks
    // if you want to dont use proxy or proxy not work you can set withProxy=false in findProductsLinks
    if (unVisitedLinks.length == 0) {
      const allProductsUrls = await findProductsLinks(checkedProxies, INITIAL_PAGE_URL, true, true);
      fs.writeFileSync(UNVISITED_LINKS_DIR, JSON.stringify(allProductsUrls, null, 4));
    }

    // scrap unvisited links
    while (unVisitedLinks.length > 0) {
      let productURL;
      try {
        // product url
        productURL = unVisitedLinks[0];
        console.log(visitedLinks?.length, "- start scrap :", productURL);

        // remove url from unVisitedLinks
        unVisitedLinks.splice(0, 1);
        fs.writeFileSync(
          UNVISITED_LINKS_DIR,
          JSON.stringify(unVisitedLinks, null, 4)
        );

        // find and write product info
        const product = await scrapProduct(
          productURL,
          checkedProxies,
          IMAGES_DIR,
          DOCUMENTS_DIR,
          SELLERS_IMAGES_DIR,
          SELLERS_DB_DIR,
          true,
          true
        );
        productsDB.push(product);
        fs.writeFileSync(PRODUCTS_DB_DIR, JSON.stringify(productsDB, null, 4));

        // add visited url to visitedLinks
        visitedLinks.push(productURL);
        fs.writeFileSync(
          VISITED_LINKS_DIR,
          JSON.stringify(visitedLinks, null, 4)
        );
      } catch (error) {
        console.log("Error in whike loop in main function", error);

        // add error url to problemLinks
        problemLinks.push(productURL);
        fs.writeFileSync(
          PROBLEM_LINKS_DIR,
          JSON.stringify(problemLinks, null, 4)
        );
      } finally {
        await delay(5000);
      }
    }
  } catch (error) {
    console.log("Error in main function", error);
  } finally {
    console.log("Scrapping Finish");
  }
}

main();
