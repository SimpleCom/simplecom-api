/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';
const fs = require('fs');
const aws = require('aws-sdk');

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
    const s3 = new AWS.S3();
    const params = {
      Bucket: `/${ctx.params.bucket}`,
      Key: ctx.params.key,
    };

    var file = fs.createWriteStream('test.mp4');
    file.on('close', function(){
      console.log('done');  //prints, file created
    });
    s3.getObject(params).createReadStream().on('error', function(err){
      console.log(err);
    }).pipe(file);

    ctx.body = 'Success';
  }

}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = S3;
