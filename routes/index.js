var express = require("express");
var router = express.Router();
const fs = require("fs");
const chalk = require("chalk");
router.get("/", async function (req, res, next) {
  res.render("index", { title: "Data Extraction" });
});
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const zlib = require("zlib");

async function process_archive() {
  return new Promise((resolve, reject) => {
    try {
      const fileContents = fs.createReadStream(`./zippedfile.json.gz`);
      const writeStream = fs.createWriteStream("unzipped.json");
      const unzip = zlib.createGunzip();

      fileContents
        .pipe(unzip)
        .on("end", (res) => {
          console.log(chalk.green("====> UNZIPPING FINISHED !"));
          JsonToCSVConverter("unzipped.json");
        })
        .pipe(writeStream);

      resolve({
        success: true,
      });
    } catch (error) {
      console.log(error);
      reject({
        success: false,
      });
    }
  });
}

router.post("/process", async function (req, res, next) {
  try {
    download(req.body.url, function name(staged) {
      console.log(staged);
    });
    return res.end();
  } catch (error) {
    console.log(error);
  }
});

function download(fileUrl, callback) {
  let prot = fileUrl.includes("https");
  let https
  if (prot) {
    https = require("https");
  } else {
    https = require("http");
  }
  var url = require("url"),
    p = url.parse(fileUrl),
    timeout = 1000000000;

  var file = fs.createWriteStream("zippedfile.json.gz");

  var timeout_wrapper = function (req) {
    return function () {
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
        clearTimeout(timeoutId);
        timeoutId = setTimeout(fn, timeout);
      })
      .on("end", function () {
        clearTimeout(timeoutId);
        file.end();
        console.log(" DOWNLOAD COMPLETED STORED: ");
        process_archive();
        callback(null);
      })
      .on("error", function (err) {
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
  let data = require(`../${file}`);
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
      { id: "service_code", title: "service_code" },
      // { id: "service_code_group", title: "service_code_group" },
    ],
  });
  let rates_records = [];
  for (let x in data.in_network) {
    let rates_record = {};
    for (let y in data.in_network[x].negotiated_rates) {
      rates_record.billing_code = data.in_network[x].billing_code;
      rates_record.billing_code_modifier = data.in_network[x].negotiated_rates[
        y
      ].billing_code_modifier
        ? data.in_network[x].negotiated_rates[y].billing_code_modifier[0]
        : null;
      rates_record.billing_code_type_version =
        data.in_network[x].billing_code_type_version;
      rates_record.provider_references =
        data.in_network[x].negotiated_rates[y].provider_references;
      rates_record.negotiated_rate =
        data.in_network[x].negotiated_rates[
          y
        ].negotiated_prices[0].negotiated_rate;
      rates_record.billing_class =
        data.in_network[x].negotiated_rates[
          y
        ].negotiated_prices[0].billing_class;
      rates_record.expiration_date =
        data.in_network[x].negotiated_rates[
          y
        ].negotiated_prices[0].expiration_date;
      rates_record.negotiated_type =
        data.in_network[x].negotiated_rates[
          y
        ].negotiated_prices[0].negotiated_type;
      let service_codes = "";
      
      data.in_network[x].negotiated_rates[y].negotiated_prices[0].service_code.map((x) => {
        service_codes += `${x},`;
      });
      rates_record.service_code = service_codes;
      rates_records.push(rates_record);
      rates_record = {};
    }
  }
  csvWriter3
    .writeRecords(rates_records) // returns a promise
    .then(() => {
      console.log("Rates.csv created");
    });
};

module.exports = router;
