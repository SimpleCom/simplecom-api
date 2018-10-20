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
  const req = https.request(options, (res) => {
    res.on('data', (d) => {
      return true;
    });
  });
  req.on('error', (e) => {
    console.log('error', e);
  });
  req.write('');
  req.end();
};