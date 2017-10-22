/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const User = require('./user.js');
const list = require('./list.js');
const crypto = require('./crypto.js');
const S3 = require('./s3.js');

class Sync {

  static async sync(ctx) {
    ctx.body = {};
    await User.getAuth(ctx);
    if (ctx.body.jwt) {
      ctx.state.user = ctx.body;

      const securePair = crypto.genKeyPair();
      const publicPair = crypto.genKeyPair();

      const secureBucket = await S3.createUserBucket();
      const publicBucket = await S3.createUserBucket();

      await global.db.query(
        `Update user SET
        secureS3Bucket = :secureS3Bucket,
        secureAwsAccessKey = :secureAwsAccessKey,
        secureAwsSecret = :secureAwsSecret,
        secureRsaPublicKey = :secureRsaPublicKey,
        secureRsaPrivateKey = :secureRsaPrivateKey,
        publicS3Bucket = :publicS3Bucket,
        publicAwsAccessKey = :publicAwsAccessKey,
        publicAwsSecret = :publicAwsSecret,
        publicRsaPublicKey = :publicRsaPublicKey,
        publicRsaPrivateKey = :publicRsaPrivateKey
        Where id = :id`,
        {
          id: ctx.state.user.id,
          secureS3Bucket: secureBucket.Location,
          secureAwsAccessKey: process.env.AWS_ACCESS,
          secureAwsSecret: process.env.AWS_SECRET,
          secureRsaPublicKey: crypto.getPublicKey(securePair),
          secureRsaPrivateKey: crypto.getPrivateKey(securePair),
          publicS3Bucket: publicBucket.Location,
          publicAwsAccessKey: process.env.AWS_ACCESS,
          publicAwsSecret: process.env.AWS_SECRET,
          publicRsaPublicKey: crypto.getPublicKey(publicPair),
          publicRsaPrivateKey: crypto.getPrivateKey(publicPair)
        }
      );

      await list.getLists(ctx);
      const lists = ctx.body; //list.get sets the ctx.body to the list of lists

      const [[user]] = await global.db.query(
        `Select id,
        uname,
        secureS3Bucket,
        secureAwsAccessKey,
        secureAwsSecret,
        securePasscode,
        secureRsaPublicKey,
        publicS3Bucket,
        publicAwsAccessKey,
        publicAwsSecret,
        publicPasscode,
        publicRsaPublicKey
        From user Where id = :id`,
        {id: ctx.state.user.id}
      );
      ctx.body = {
        lists: lists,
        s: {
          s3Bucket: user.secureS3Bucket,
          awsAccessKey: user.secureAwsAccessKey,
          awsSecret: user.secureAwsSecret,
          passcode: user.securePasscode,
          rsaPublicKey: user.secureRsaPublicKey,
        },
        p: {
          s3Bucket: user.publicS3Bucket,
          awsAccessKey: user.publicAwsAccessKey,
          awsSecret: user.publicAwsSecret,
          passcode: user.publicPasscode,
          rsaPublicKey: user.publicRsaPublicKey,
        }
      };
    }else{
      ctx.throw(403, 'Not Authorized');
    }
  }

}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = Sync;
