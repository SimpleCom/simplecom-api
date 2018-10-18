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

    const bucket = ctx.params.bucket;
    const fileKey = ctx.params.key;
    const s3 = new aws.S3();
    const params = {
      Bucket: `/${bucket}`,
      Key: fileKey,
    };

    //Find bucket in the user table
    const [[user]] = await global.db.query(
      'Select id from user where secureS3Bucket = :sBucket or publicS3Bucket = :pBucket',
      { sBucket: bucket, pBucket: bucket }
    );

    const dir = __dirname + `/../decrypt/${user.id}/`;
    mkdirp.sync(dir);
    console.log(res, dir);
    const file = fs.createWriteStream(`${dir}${fileKey}`);

    s3.getObject(params).createReadStream().on('error', function(err){
      console.log(err);
    }).pipe(file);

    ctx.body = 'Success';
  }

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
