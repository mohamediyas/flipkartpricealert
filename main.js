const express = require("express");
const AppDAO = require("./dao");
const UrlSchema = require("./UrlSchema");
const puppeteer = require("puppeteer");
const axios = require("axios").default;
const cherrio = require("cheerio");
const Vonage = require("@vonage/server-sdk");

const app = express();

const vonage = new Vonage({
  apiKey: "bcd1cd88",
  apiSecret: "VpCsCfgPruMU20TS",
});

app.use(express.static("public"));

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile("./index.html");
});
const dao = new AppDAO("./url.sqlite3");

app.post("/info", (req, res) => {
  const { url, email, phone, price } = req.body;

  const urlS = new UrlSchema(dao);

  urlS.createTable().then(function () {
    urlS.create(email, url, phone, price).then(function (response) {
      if (response.id) {
        res.send(
          "success, if given product went down your giveb amound ,alert will send to your mobile number"
        );
      }
    });
  });
});

const checkPrice = async () => {
  const allData = new UrlSchema(dao);

  allData.getAll().then(async (data) => {
    for (let value of data) {
      console.log(value.url);

      var validUrl = new RegExp(
        "^(https?:\\/\\/)?" + // protocol
          "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
          "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
          "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
          "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
          "(\\#[-a-z\\d_]*)?$",
        "i"
      ); // fragment locator

      if (validUrl.test(value.url)) {
        // const { data } = await axios.get(`http://${value.url}`);

        let validUrl = value.url.includes("https://")
          ? value.url
          : `https://${value.url}`;

        console.log(validUrl);
        const { data } = await axios.get(validUrl);

        const $ = await cherrio.load(data);

        const items = $(
          "#container > div > div._2c7YLP.UtUXW0._6t1WkM._3HqJxg > div > div._1YokD2._3Mn1Gg.col-8-12"
        );

        let productName = $(items)
          .find("div > div > div:nth-child(1) > h1 > span")
          .first()
          .text();

        let productPrice = $(items)
          .find("div > div > div.dyC4hf > div.CEmiEU > div > div")
          .first()
          .text();

        let url = value.url;

        productPrice = productPrice.split("₹")[1];

        productPrice = productPrice?.includes(",")
          ? productPrice.split(",")[0] + productPrice.split(",")[1]
          : productPrice;

        console.log(productPrice);

        let urlData = {
          productName,
          productPrice,
          url,
        };

        console.log(value.price, productPrice);

        if (value.price >= productPrice) {
          console.log(value.phone);
          const from = "18335784395";
          const to = "12012987481";
          const text =
            "Hi your product is come under your price amound " +
            "product name " +
            productName +
            " product price " +
            productPrice +
            "Here is a buying url " +
            url;

          vonage.message.sendSms(from, to, text, (err, responseData) => {
            if (err) {
              console.log(err);
            } else {
              if (responseData.messages[0]["status"] === "0") {
                console.log("Message sent successfully.");
              } else {
                console.log(
                  `Message failed with error: ${responseData.messages[0]["error-text"]}`
                );
              }
            }
          });

          allData.delete(value.id).then((res) => {
            console.log(
              "This is one is removed because the product is find with user required amound" +
                JSON.stringify(res)
            );
          });
        }

        console.log(productPrice, productName);
      }
    }
  });
};

setInterval(() => {
  checkPrice();
}, 60000);

app.listen(2503, () => {
  console.log("server liaten on port 2503");
});
