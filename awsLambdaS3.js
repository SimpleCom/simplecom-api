// dependencies
const http = require('http');

exports.handler = function (event, context) {
  return new Promise((resolve, reject) => {
    // Read options from the event.
    console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
    const srcBucket = event.Records[0].s3.bucket.name;
    // Object key may have spaces or unicode non-ASCII characters.
    const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    const options = {
      host: 'https://api.simplecom.me',
      path: `/hit/${srcBucket}/${srcKey}`,
      port: 443,
      method: 'GET'
    };
  });
};