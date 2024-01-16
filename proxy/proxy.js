const fs = require('fs')
const { getAllProxy } = require('./proxyScrape.js');
const { getCheckedProxies } = require('./proxyChecker.js');


async function getChceckedProxies() {
    let checkedProxy = [];
    try {
        const allProxy = await getAllProxy();
        checkedProxy = await getCheckedProxies(allProxy);
    } catch (error) {
        console.log("Error in main function", error);
    }
    finally {
        return checkedProxy
    }
}


module.exports = {
    getChceckedProxies
}