var express = require("express");
var router = express.Router();
const StreamZip = require("node-stream-zip");
const https = require("https"); // or 'https' for https:// URLs
const fs = require("fs");
const chalk = require("chalk");
const unzip = require("unzipper");
router.get("/", async function (req, res, next) {
  res.render("index", { title: "Data Extraction" });
});
const { Parser } = require("json2csv");
// var encoding = require('encoding-japanese');
// var fileBuffer = fs.readFileSync('Input_File.json.gz');
// console.log(encoding.detect(fileBuffer))
const { ungzip } = require("node-gzip");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

async function process_archive(filename) {
  try {
    const sitemap = await ungzip(filename).toString();
    // fs.createReadStream(filename)
    //   .pipe(unzip.Parse())
    //   .on("entry", function (entry) {
    //     console.log(entry);
    //     // entry.path is file name
    //     // entry.type is 'Directory' or 'File'
    //     // entry.size is size of file
    //     const chunks = [];
    //     entry.on("data", (data) => {
    //       chunks.push(data);
    //       console.log(data);
    //     });
    //     entry.on("error", (err) => console.log(err));
    //     entry.on("end", () => {
    //       let content = Buffer.concat(chunks).toString("utf8");
    //       // process_my_file(entry.path, content);
    //       entry.autodrain();
    //     });
    //   });
    return;
  } catch (error) {
    console.log(error);
  }
}

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
    JsonToCSVConverter("Input_File.json");
    // download(req.body.url,filename, function name(staged) {
    //     console.log(staged);
    // });
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

    // process_archive("./Input_File.json.gz");

    // const zip = new StreamZip.async({ file: "2022-08-01_United-HealthCare-Services_Third-Party-Administrator_PS1-50_C2_in-network-rates.json.gz" });
    res.send("OKAY");
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
        process.stdout.write(
          " DOWNLOADING : " +
            ((100.0 * downloaded) / len).toFixed(2) +
            "% " +
            "\033[0G \r"
        );
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

const JsonToCSVConverter = (file) => {
  let data = require("../" + file);
  // Data extraction for providers.csv
  let records = [];
  for (let i in data.provider_references) {
    let record = {};
    for (let j in data.provider_references[i].provider_groups) {
      if (data.provider_references[i].provider_groups[j].npi.length > 0) {
        for (let k in data.provider_references[i].provider_groups[j].npi) {
          (record.provider_group_id =
            data.provider_references[i].provider_group_id),
            (record.tin =
              data.provider_references[i].provider_groups[j].tin.value);
          record.tin_type =
            data.provider_references[i].provider_groups[j].tin.type;
          record.npi = data.provider_references[i].provider_groups[j].npi[k];
          records.push(record);
          record = {};
        }
      } else {
        (record.provider_group_id =
          data.provider_references[i].provider_group_id),
          (record.tin =
            data.provider_references[i].provider_groups[j].tin.value);
        record.tin_type =
          data.provider_references[i].provider_groups[j].tin.type;
        record.npi = data.provider_references[i].provider_groups[j].npi[0];
        records.push(record);
        record = {};
      }
    }
  }
  const csvWriter = createCsvWriter({
    path: "Providers.csv",
    header: [
      { id: "provider_group_id", title: "provider_group_id" },
      { id: "tin", title: "tin" },
      { id: "tin_type", title: "tin_type" },
      { id: "npi", title: "npi" },
    ],
  });

  csvWriter
    .writeRecords(records) // returns a promise
    .then(() => {
      console.log("Providers.csv created");
    });
  //Data extraction for codes.csv
  const csvWriter2 = createCsvWriter({
    path: "Codes.csv",
    header: [
      { id: "billing_code", title: "billing_code" },
      { id: "billing_code_type", title: "billing_code_type" },
      { id: "billing_code_type_version", title: "billing_code_type_version" },
      { id: "description", title: "billing_code_description" },
      { id: "name", title: "billing_code_name" },
      { id: "negotiation_arrangement", title: "negotiation_arrangement" },
    ],
  });
  let codes_records = [];
  for (let x in data.in_network) {
    codes_records.push({
      billing_code: data.in_network[x].billing_code,
      billing_code_type: data.in_network[x].billing_code_type,
      billing_code_type_version: data.in_network[x].billing_code_type_version,
      description: data.in_network[x].description,
      name: data.in_network[x].name,
      negotiation_arrangement: data.in_network[x].negotiation_arrangement,
    });
  }
  csvWriter2
    .writeRecords(codes_records) // returns a promise
    .then(() => {
      console.log("Codes.csv created");
    });
  // Data extraction for rates.csv
  const csvWriter3 = createCsvWriter({
    path: "Rates.csv",
    header: [
      { id: "billing_code", title: "billing_code" },
      { id: "billing_code_modifier", title: "billing_code_modifier" },
      { id: "billing_code_type_version", title: "billing_code_type_version" },
      { id: "provider_references", title: "provider_references" },
      { id: "negotiated_rate", title: "negotiated_rate" },
      { id: "billing_class", title: "billing_class" },
      { id: "expiration_date", title: "expiration_date" },
      { id: "negotiated_type", title: "negotiated_type" },
      // { id: "service_code_group", title: "service_code_group" },
    ],
  });
  let rates_records = [];
  for (let x in data.in_network) {
    let rates_record = {};
    for(let y in data.in_network[x].negotiated_rates){
      rates_record.billing_code= data.in_network[x].billing_code;
      rates_record.billing_code_modifier = data.in_network[x].negotiated_rates[y].billing_code_modifier ? data.in_network[x].negotiated_rates[y].billing_code_modifier[0]:null;
      rates_record.billing_code_type_version= data.in_network[x].billing_code_type_version;
      rates_record.provider_references = data.in_network[x].negotiated_rates[y].provider_references;
      rates_record.negotiated_rate = data.in_network[x].negotiated_rates[y].negotiated_prices[0].negotiated_rate;
      rates_record.billing_class = data.in_network[x].negotiated_rates[y].negotiated_prices[0].billing_class;
      rates_record.expiration_date = data.in_network[x].negotiated_rates[y].negotiated_prices[0].expiration_date;
      rates_record.negotiated_type = data.in_network[x].negotiated_rates[y].negotiated_prices[0].negotiated_type;
      rates_records.push(rates_record)
      rates_record = {}
    }
  }
  csvWriter3
    .writeRecords(rates_records) // returns a promise
    .then(() => {
      console.log("Rates.csv created");
    });
};

module.exports = router;
