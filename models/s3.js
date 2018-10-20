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

class S3 {

  /**
   * Returns User details (convenience wrapper for single User details).
   *
   * @param   {number} id - User id or undefined if not found.
   * @returns {Object} User details.
   */
  static async hit(ctx) {
    try {
      console.log('bucket hit', ctx.params);

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

      console.log('user', user);

      const fileSplit = fileKey.split('/');
      fileSplit.shift();
      const fileName = fileSplit.pop();
      const dirAdd = fileSplit.join('/');
      const dir = path.join(__dirname, `/../decrypt/${user.id}/${dirAdd}/`);
      console.log('mkdirp', dir);
      const mkres = mkdirp.sync(dir);
      console.log('made dir', dir, mkres);
      console.log('fileName', fileName);
      const file = fs.createWriteStream(`${dir}${fileName}`);

      s3.getObject(s3Params, (error, data) => {
        console.log('data', data);
        // Delete the object from the bucket
        // s3.deleteObject(s3Params, () => {
        //   console.log(`File ${dir}${file} deleted.`);
        // });
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
        Bucket: 'simplecom-logos',
        Key: fileName,
        Body: base64data,
        ACL: 'public-read'
      }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
      });
    }));
  }

    // CREATE S3 BUCKET -- has errors
    // const bucketUrl = (await new Promise((resolve, reject) => {
    //   const params = {
    //     Bucket: `simplecom-uploads`,
    //     ACL: "public",
    //     CreateBucketConfiguration: {
    //       LocationConstraint: 'us-west-2'
    //     }
    //   };

    //   s3.createBucket(params, function (err, data) {
    //     if (err) reject(err);
    //     else resolve(data);
    //   });
    // })).Location;

    // const bucketNameRegex = /user-data-[a-z0-9\-]+/;
    // const bucketName = bucketNameRegex.exec(bucketUrl)[0];
    // console.log(bucketUrl);
    // console.log(bucketName);
    //}
  
  static async createUserBucket() {

    const s3 = new aws.S3();

    const bucketUrl = (await new Promise((resolve, reject) => {
      const params = {
        Bucket: `user-data-${uuidv4()}`,
        ACL: "private",
        CreateBucketConfiguration: {
          LocationConstraint: 'us-west-2'
        }
      };

      s3.createBucket(params, function (err, data) {
        if (err) reject(err);
        else resolve(data);
      });
    })).Location;

    const bucketNameRegex = /user-data-[a-z0-9\-]+/;
    const bucketName = bucketNameRegex.exec(bucketUrl)[0];

    // TODO: throws "Unable to validate the following destination configurations" until an event is manually added and deleted from the bucket in the AWS UI Console
    // await new Promise((resolve, reject) => {
    //   const params = {
    //     Bucket: bucketName,
    //     NotificationConfiguration: {
    //       LambdaFunctionConfigurations: [
    //         {
    //           Id: `lambda-upload-notification-${bucketName}`,
    //           LambdaFunctionArn: 'arn:aws:lambda:us-west-2:128878509512:function:respondS3Upload',
    //           Events: ['s3:ObjectCreated:CompleteMultipartUpload']
    //         },
    //       ]
    //     }
    //   };
    //
    //   s3.putBucketNotificationConfiguration(params, function(err, data) {
    //     if (err) reject(err);
    //     else resolve(data);
    //   });
    // });

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
          console.log(`Unable to delete bucket ${bucketName}`, err);
          resolve();
        } else {
          resolve(data);
        }
      });
    });
  }

}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = S3;
