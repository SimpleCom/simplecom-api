/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';
const fs = require('fs');
const aws = require('aws-sdk');
const mkdirp = require('mkdirp-promise')

class S3 {

  /**
   * Returns User details (convenience wrapper for single User details).
   *
   * @param   {number} id - User id or undefined if not found.
   * @returns {Object} User details.
   */
  static async hit(ctx) {

    aws.config.update({
      accessKeyId: process.env.AWS_ACCESS,
      secretAccessKey: process.env.AWS_SECRET,
      region: process.env.AWS_REGION
    });
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

    await mkdirp(`/decrypt/${user.id}/`);
    const file = fs.createWriteStream(`/decrypt/${user.id}/${fileKey}`);

    s3.getObject(params).createReadStream().on('error', function(err){
      console.log(err);
    }).pipe(file);

    ctx.body = 'Success';
  }

}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = S3;
