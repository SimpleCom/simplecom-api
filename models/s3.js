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
const crypto = require('./crypto.js');
const path = require('path');

aws.config.update({
  accessKeyId:     process.env.AWS_ACCESS,
  secretAccessKey: process.env.AWS_SECRET,
  region:          process.env.AWS_REGION,
});

const AWS_LAMBDA_FUNCTION_NAME = process.env.AWS_LAMBDA_ARN.split(':').pop();

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
      const s3Path = ctx.params.key;

      const [ s3UserId, codeType, filename  ] = s3Path.split('/');

      //Find bucket in the user table
      const [ [ user ] ] = await global.db.query(
        'Select id, secureRsaPrivateKey, publicRsaPrivateKey from user where secureS3Bucket = :sBucket or publicS3Bucket = :pBucket',
        { sBucket: bucket, pBucket: bucket },
      );

      if (!user || user.id !== parseInt(s3UserId)) {
        ctx.throw(400, 'Bucket not associated with a user');
        return;
      }

      const { id, secureRsaPrivateKey, publicRsaPrivateKey } = user;

      const isSecure = codeType !== 'p';
      const rsaPrivateKey = isSecure ? secureRsaPrivateKey : publicRsaPrivateKey;

      const fileContents = await S3.downloadFile(bucket, s3Path);

      // TODO: Figure out how to store files in database until we receive the final message and then decrypt them all at once. Do images have seperate keys?
      // TODO: Remove next line. It has a hardcoded message that corresponds with the key we got above.
      const message = await S3.downloadFile(bucket, '2/p/M-2-T-0.txt');

      // TODO: Figure out if lambda notification is a message or key file and call correct function
      const aesKey = crypto.rsaDecrypt(rsaPrivateKey, fileContents);
      const plainTextFile = crypto.aesDecrypt(aesKey, message);

      console.log(aesKey);
      console.log(plainTextFile);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }
  }

  static async downloadFile(bucket, s3Path) {
    const s3 = new aws.S3();
    const s3Params = {
      Bucket: bucket,
      Key:    s3Path,
    };

    const data = await new Promise((resolve, reject) => {
      s3.getObject(s3Params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.Body.toString());
        }
      });
    });

    return data;
  }

  // UPLOAD ORGANIZATION
  static async uploadImage(filePath, fileName) {
    // Read in the file, convert it to base64, store to S3
    const data = (await new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }));

    const base64data = new Buffer(data, 'binary');

    const s3 = new aws.S3();
    return (await new Promise((resolve, reject) => {
      s3.putObject({
        Bucket: process.env.AWS_BUCKET,
        Key:    fileName,
        Body:   base64data,
        ACL:    'public-read',
      }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }));
  }

  static async createUserBucket() {
    const bucketUrl = await S3.createBucket(`user-data-${uuidv4()}`, 'private');

    const bucketNameRegex = /user-data-[a-z0-9\-]+/;
    const bucketName = bucketNameRegex.exec(bucketUrl)[ 0 ];

    await S3.createLambdaNotification(bucketName);

    return bucketName;
  }

  static async deleteUserBucket(bucketName) {

    const s3 = new aws.S3();

    const params = {
      Bucket: bucketName,
    };

    return await new Promise(resolve => {
      s3.deleteBucket(params, function (err, data) {
        if (err) {
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
          LocationConstraint: process.env.AWS_REGION,
        },
      };

      s3.createBucket(params, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    })).Location;

    return bucketUrl;
  }

  static async createLambdaNotification(bucketName) {
    const s3 = new aws.S3();

    return await new Promise((resolve, reject) => {
      const params = {
        Bucket:                    bucketName,
        NotificationConfiguration: {
          LambdaFunctionConfigurations: [
            {
              Id:                `${AWS_LAMBDA_FUNCTION_NAME}-${bucketName}`,
              LambdaFunctionArn: process.env.AWS_LAMBDA_ARN,
              Events:            [ 's3:ObjectCreated:CompleteMultipartUpload' ],
            },
          ],
        },
      };

      s3.putBucketNotificationConfiguration(params, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = S3;
