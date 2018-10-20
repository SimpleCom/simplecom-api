const https = require('https');

exports.handler = function (event, context) {
  // Read options from the event.
  const srcBucket = event.Records[0].s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  const options = {
    host: 'api.simplecom.me',
    path: `/hit/${srcBucket}/${srcKey}`,
    method: 'GET'
  };
  console.log(options);
  const req = https.request(options, (res) => {
    var test = res.toString();
    console.log(JSON.parse(test));
    return true;
  });
  if (req){
    req.write('');
    req.end();
  }
};