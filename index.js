const fetch = require("node-fetch");
const cheerio = require("cheerio");
const axios = require("axios");
const Discord = require("discord.js");
const client = new Discord.Client();

var prefix = "!";

async function discord() {
  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

  client.on("message", (msg) => {
    if (!msg.content.startsWith(prefix) || msg.author.bot) return;

    const args = msg.content.slice(prefix.length).split(" ");
    const command = args.shift().toLowerCase();

    if (command === "stockx") {
      msg.channel.send("Searching...");

      let sneakerSearch = args.slice(0).join(" ").split(",");
      let shoe = sneakerSearch[0];
      let size = sneakerSearch[1];
      return stockx(shoe, size, msg);
    }
    return main(msg);
  });

  client.login("DISCORD WEBHOOK HERE...");
}

async function stockx(shoe, size, msg) {
  let url = `https://stockx.com/api/browse?productCategory=sneakers&_search=${shoe}&dataType=product`;

  try {
    const dataFetch = await fetch(
      url,
      (headers = {
        method: "GET",
        headers: {
          authority: "stockx.com",
          "x-requested-with": "XMLHttpRequest",
          "x-anonymous-id": "6a9cb494-72d6-4c66-991e-8965ad3618f4",
          authorization: "",
          "user-agent":
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Mobile Safari/537.36",
          appversion: "0.1",
          "sec-fetch-site": "same-origin",
          "accept-language": "en-US,en;q=0.9",
        },
      })
    );

    let data = await dataFetch.json();
    urlKey = data.Products[0].urlKey;
    imgUrl = data.Products[0].media.thumbUrl;

    return productsku(urlKey, size, imgUrl, msg);
  } catch (err) {
    console.log(err);
  }
}

async function productsku(urlKey, size, imgUrl, msg, sizeUrl) {
  try {
    let sizeUrl = `https://stockx.com/${urlKey}?size=${size}`;

    const skuFetch = await axios.get(sizeUrl, headers);

    const $ = cheerio.load(skuFetch.data);
    let sku = $(".product-view").find("script").html();
    let objSku = JSON.parse(sku.toString()).sku;
    return checkPrice(objSku, imgUrl, msg, sizeUrl);
  } catch (err) {
    console.log(err);
  }
}

async function checkPrice(objSku, imgUrl, msg, sizeUrl) {
  try {
    let itemUrl = `https://stockx.com/api/products/${objSku}/market?currency=USD&country=US`;
    const getPrices = await axios.get(itemUrl, headers);
    let size = getPrices.data.Market.lastSaleSize;
    let lowestAsk = getPrices.data.Market.lowestAsk;
    let highestBid = getPrices.data.Market.highestBid;
    return main(imgUrl, msg, size, lowestAsk, highestBid, sizeUrl);
  } catch (err) {
    console.log(err);
  }
}

async function main(imgUrl, msg, size, lowestAsk, highestBid, sizeUrl) {
  stockxEmbed = {
    color: 0x0099ff,
    title: "StockX-Check",
    image: {
      url: imgUrl,
    },
    fields: [
      {
        name: "LowestAsk",
        value: lowestAsk,
        inline: true,
      },
      {
        name: "HighestBid",
        value: highestBid,
        inline: true,
      },
      {
        name: "Size",
        value: size,
        inline: true,
      },
      {
        name: "ProductLink",
        value: sizeUrl,
        inline: true,
      },
    ],

    timestamp: new Date(),


  };
  msg.channel.send({ embed: stockxEmbed });
}

discord();
