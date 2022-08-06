var express = require("express");
var router = express.Router();
const StreamZip = require("node-stream-zip");
const https = require("https"); // or 'https' for https:// URLs
const fs = require("fs");
const chalk = require("chalk");
/* GET home page. */
let filename = "file.gz";
const file = fs.createWriteStream(filename);
router.get("/", async function (req, res, next) {
  res.render("index", { title: "Data Extraction" });
});

function bytesToSize(bytes) {
  var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "0 Byte";
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, 2), 2) + " " + sizes[2];
}
const exampleURL =
  "https://uhc-tic-mrf.azureedge.net/public-mrf/2022-08-01/2022-08-01_United-HealthCare-Services_Third-Party-Administrator_PS1-50_C2_in-network-rates.json.gz";

router.post("/process", async function (req, res, next) {
  try {
    download(req.body.url,filename, function name(staged) {
        console.log(staged);
    });
    // const request = https.get(req.body.url, function (response) {
    //   var len = parseInt(response.headers["content-length"], 10);
    //   len = bytesToSize(len);
    //   console.log(chalk.yellow("====> DOWNLOAD STARTING !"));
    //   console.log(response);
    //   const interval = setInterval(function () {
    //     // method to be executed;
    //     console.log(chalk.yellow("====> FILE SIZE IS :" + len));
    //   }, 5000);
    //   response.pipe(file);
    //   file.on("open", function (fd) {
    //     console.log(chalk.green("====> DOWNLOAD STARTED !"));
    //   });
    //   file.on("response", function (data) {
    //     console.log(data);
    //   });
    //   file.on("data", function (data) {
    //     console.log("data");
    //   });
    //   file.on("pipe", function () {
    //     console.log(chalk.green("====> DOWNLOADING !"));
    //   });
    //   file.on("finish", () => {
    //     clearInterval(interval);
    //     file.close();
    //     console.log(chalk.green("====> DOWNLOAD COMPLETED !"));
    //   });
    //   file.on("error", (err) => {
    //     clearInterval(interval);
    //     fs.unlink(filename);
    //     console.log(chalk.red("====> DOWNLOAD FAILED !"));
    //     console.log(err);
    //   });
    // });

    // const zip = new StreamZip.async({ file: req.body.url });
    // const stm = await zip.stream("zip.txt");
    // stm.pipe(process.stdout);
    // stm.on("end", () => zip.close());
    // console.log(zip);
    // res.send("OKAY");
  } catch (error) {
    console.log(error);
  }
  // res.render('index', { title: 'Data Extraction' });
});

function download(fileUrl, apiPath, callback) {
  var url = require("url"),
    https = require("https"),
    p = url.parse(fileUrl),
    timeout = 1000000000;

  var file = fs.createWriteStream(apiPath);

  var timeout_wrapper = function (req) {
    return function () {
      console.log("abort");
      req.abort();
      callback("File transfer timeout!");
    };
  };

  var request = https.get(fileUrl).on("response", function (res) {
    var len = parseInt(res.headers["content-length"], 10);
    var downloaded = 0;

    res
      .on("data", function (chunk) {
        file.write(chunk);
        downloaded += chunk.length;
        process.stdout.write(" DOWNLOADING : " + ((100.0 * downloaded) / len).toFixed(2) + "% " +  "\033[0G \r");
        // process.stdout.write(" DOWNLOADING : " + ((100.0 * downloaded) / len).toFixed(2) + "% " + downloaded + " bytes" +  "\033[0G \r");
        // reset timeout
        clearTimeout(timeoutId);
        timeoutId = setTimeout(fn, timeout);
      })
      .on("end", function () {
        // clear timeout
        clearTimeout(timeoutId);
        file.end();
        console.log(" DOWNLOAD COMPLETED STORED: " + apiPath);
        callback(null);
      })
      .on("error", function (err) {
        // clear timeout
        clearTimeout(timeoutId);
        callback(err.message);
      });
  });

  // generate timeout handler
  var fn = timeout_wrapper(request);

  // set initial timeout
  var timeoutId = setTimeout(fn, timeout);
}

module.exports = router;
