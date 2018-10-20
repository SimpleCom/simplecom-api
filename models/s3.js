/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';
const fs = require('fs');
const aws = require('aws-sdk');
const mkdirp = require('mkdirp');
const uuidv4 = require('uuid/v4');
const Return = require('./return');
const path = require('path');

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION
});

const AWS_LAMDA_FUNCTION_NAME = process.env.AWS_LAMDA_ARN.split(':').pop();

class S3 {

  /**
   * Returns User details (convenience wrapper for single User details).
   *
   * @param   {number} id - User id or undefined if not found.
   * @returns {Object} User details.
   */
  static async hit(ctx) {
    try {
      const bucket = ctx.params.bucket;
      const fileKey = ctx.params.key;
      const s3 = new aws.S3();
      const s3Params = {
        Bucket: `/${bucket}`,
        Key: fileKey,
      };

      //Find bucket in the user table
      const [[user]] = await global.db.query(
        'Select id from user where secureS3Bucket = :sBucket or publicS3Bucket = :pBucket',
        {sBucket: bucket, pBucket: bucket}
      );

      const fileSplit = fileKey.split('/');
      fileSplit.shift();
      const fileName = fileSplit.pop();
      const dirAdd = fileSplit.join('/');
      const dir = path.join(__dirname, `/../decrypt/${user.id}/${dirAdd}/`);

      mkdirp.sync(dir);

      const file = fs.createWriteStream(`${dir}${fileName}`);

      s3.getObject(s3Params, (error, data) => {
        console.log('data');
      }).createReadStream().on('error', function (err) {
        console.log(err);
      }).pipe(file);

    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }
  }

  // UPLOAD ORGANIZATION
  static async uploadImage(filePath, fileName) {
    // Read in the file, convert it to base64, store to S3
    const data = (await new Promise((resolve, reject) => {       
      fs.readFile(filePath,(err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    }));

    const base64data = new Buffer(data, 'binary');

    const s3 = new aws.S3();
    return (await new Promise((resolve, reject) => {
      s3.putObject({
        Bucket: process.env.AWS_BUCKET,
        Key: fileName,
        Body: base64data,
        ACL: 'public-read'
      }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
      });
    }));
  }
  
  static async createUserBucket() {

    const s3 = new aws.S3();


    const bucketUrl = await S3.createBucket(`user-data-${uuidv4()}`, 'private');

    const bucketNameRegex = /user-data-[a-z0-9\-]+/;
    const bucketName = bucketNameRegex.exec(bucketUrl)[0];

    await S3.createLamdaPermission(bucketName);
    await S3.createLamdaNotification(bucketName);

    return bucketName;
  }

  static async deleteUserBucket(bucketName) {

    const s3 = new aws.S3();

    const params = {
      Bucket: bucketName
    };

    return await new Promise(resolve => {
      s3.deleteBucket(params, function (err, data) {
        if (err){
          console.log(`Unable to delete bucket`);
          resolve();
        } else {
          resolve(data);
        }
      });
    });
  }

  static async createBucket(bucketName, acl) {
    const s3 = new aws.S3();

    const bucketUrl = (await new Promise((resolve, reject) => {
      const params = {
        Bucket:                    bucketName,
        ACL:                       acl,
        CreateBucketConfiguration: {
          LocationConstraint: process.env.AWS_REGION
        }
      };

      s3.createBucket(params, function (err, data) {
        if (err) reject(err);
        else resolve(data);
      });
    })).Location;

    return bucketUrl;
  }

  static async createLamdaPermission(bucketName) {
    const lambda = new aws.Lambda();

    return await new Promise((resolve, reject) => {
      const params = {
        Action: "lambda:InvokeFunction",
        FunctionName: process.env.AWS_LAMDA_ARN,
        Principal: "s3.amazonaws.com",
        SourceAccount: process.env.AWS_ACCOUNT_ID,
        SourceArn: `arn:aws:s3:::${bucketName}`,
        StatementId: `${AWS_LAMDA_FUNCTION_NAME}-${bucketName}`
      };
      lambda.addPermission(params, function(err, data) {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  static async createLamdaNotification(bucketName) {
    const s3 = new aws.S3();

    return await new Promise((resolve, reject) => {
      const params = {
        Bucket: bucketName,
        NotificationConfiguration: {
          LambdaFunctionConfigurations: [
            {
              Id: `${AWS_LAMDA_FUNCTION_NAME}-${bucketName}`,
              LambdaFunctionArn: process.env.AWS_LAMDA_ARN,
              Events: ['s3:ObjectCreated:CompleteMultipartUpload']
            },
          ]
        }
      };

      s3.putBucketNotificationConfiguration(params, function(err, data) {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = S3;
