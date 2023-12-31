const fs = require('fs');
const convert = require('xml-js');
const schedule = require('node-schedule');
const express = require('express');

const app = express();

const port = process.env.PORT || 3000;

// Function to convert JSON to XML
function convertToXml(jsonData) {
  const rssObject = {
    _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } },
    rss: {
      _attributes: {
        'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
        'xmlns:sy': 'http://purl.org/rss/1.0/modules/syndication/',
        'xmlns:admin': 'http://webns.net/mvcb/',
        'xmlns:rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
        'xmlns:media': 'http://search.yahoo.com/mrss/',
        version: '2.0',
      },
      channel: {
        title: 'Neuzmail: Email Marketing Do you know?',
        link: 'https://neuzmail.in',
        description:
          'Don"t miss out on the secrets that successful marketers swear by! Explore the facts now and take your email marketing strategy to the next level.',
        item: jsonData.map((item) => ({
          title: { _text: item.question },
          description: { _text: item.answer },
          pubDate: { _text: item.publishDate },
        })),
      },
    },
  };

  const options = { compact: true, ignoreComment: true, spaces: 4 };
  return convert.json2xml(rssObject, options);
}

// Function to read JSON data from file
function readJsonFile(filename) {
  const data = fs.readFileSync(filename, 'utf-8');
  return JSON.parse(data);
}

// Function to write JSON data to file
function writeJsonFile(filename, jsonData) {
  fs.writeFileSync(filename, JSON.stringify(jsonData, null, 2), 'utf-8');
}


// Function to read XML data from file (unchanged)
function readXmlFile(filename) {
  const data = fs.readFileSync(filename, 'utf-8');
  return data;
}

// Function to write XML data to file (unchanged)
function writeXmlFile(filename, xmlData) {
  fs.writeFileSync(filename, xmlData, 'utf-8');
}

// Function to find the last added object in output.json
function getLastAddedObjectId() {
  const outputData = readJsonFile('./output.json');
  return outputData.length > 0 ? outputData[outputData.length - 1].id : 0;
}

// Function to update output.json and output.xml based on data.json
function updateOutputFiles() {
  const data = readJsonFile('./data.json');
  const lastId = getLastAddedObjectId();
  const nextId = lastId + 1;

  const nextObject = data.find((item) => item.id === nextId);
  if (nextObject) {
    const outputData = readJsonFile('./output.json');
    outputData.unshift(nextObject); // Add the object to the beginning of the array

    // Sort the array in descending order based on id
    outputData.sort((a, b) => b.id - a.id);

    writeJsonFile('./output.json', outputData);

    const xmlData = convertToXml(outputData);
    writeXmlFile('./output.xml', xmlData);

    console.log('output.json and output.xml updated at', new Date());
  } else {
    console.log('No next object found in data.json');
  }
}

app.get('/', (req, res) => {
  // Read the content of the output.xml file
  const xmlContent = readXmlFile('./output.xml');
  // Send the XML content as the response
  res.header('Content-Type', 'application/xml');
  res.send(xmlContent);
});

// Schedule the script to run every 4 hours
schedule.scheduleJob('0 */4 * * *', function () {
  updateOutputFiles();
});

// Initial update when the script starts
updateOutputFiles();


app.listen(port, () => {
  console.log("I am live again");
})
