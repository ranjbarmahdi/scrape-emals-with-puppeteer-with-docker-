const delay = (ms) => new Promise((res) => setTimeout(res, ms));


const extractValidProxies = (proxyLines) => {
  // Regular expression to match the ip:port format
  const proxyPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}\b/;

  // Filter valid proxies
  const validProxies = proxyLines
    .map(line => line.match(proxyPattern))
    .filter(match => match !== null)
    .map(match => match[0]); 

  return validProxies;
};


module.exports = {
    delay,
    extractValidProxies
}