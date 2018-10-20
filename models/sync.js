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
    console.log("syncing");
    ctx.body = {};
    await User.getAuth(ctx);
    if (ctx.body.jwt) {
      ctx.state.user = ctx.body;

      // TODO: change back when s3 lambda events are working
      // const [[userBuckets]] = await global.db.query(
      //   `Select
      //   secureS3Bucket,
      //   secureAwsAccessKey,
      //   publicS3Bucket,
      //   publicAwsAccessKey
      //   From user Where id = :id`,
      //   {id: ctx.state.user.id}
      // );

      // await S3.deleteUserBucket(userBuckets.secureS3Bucket); // TODO: change back when s3 lambda events are working
      // await S3.deleteUserBucket(userBuckets.publicS3Bucket); // TODO: change back when s3 lambda events are working

      const securePair = crypto.genKeyPair();
      const publicPair = crypto.genKeyPair();

      const secureBucket = null; // await S3.createUserBucket(); // TODO: change back when s3 lambda events are working
      const publicBucket = null; // await S3.createUserBucket(); // TODO: change back when s3 lambda events are working

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
          secureS3Bucket: secureBucket,
          secureAwsAccessKey: process.env.AWS_ACCESS,
          secureAwsSecret: process.env.AWS_SECRET,
          secureRsaPublicKey: crypto.getPublicKey(securePair),
          secureRsaPrivateKey: crypto.getPrivateKey(securePair),
          publicS3Bucket: publicBucket,
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
        userId: ctx.state.user.id, // TODO: remove when s3 lambda events are working
        lists: lists,
        s: {
          s3Bucket: 'simplecom-uploads', //user.secureS3Bucket, // TODO: change back when s3 lambda events are working
          awsAccessKey: user.secureAwsAccessKey,
          awsSecret: user.secureAwsSecret,
          passcode: user.securePasscode,
          rsaPublicKey: user.secureRsaPublicKey,
        },
        p: {
          s3Bucket: 'simplecom-uploads', //user.publicS3Bucket, // TODO: change back when s3 lambda events are working
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
