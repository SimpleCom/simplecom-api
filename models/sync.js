/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const User = require('./user.js');
const list = require('./list.js');
const crypto = require('./crypto.js');

class Sync {

  static async sync(ctx) {
    ctx.body = {};
    await User.getAuth(ctx);
    if (ctx.body.jwt) {
      ctx.state.user = ctx.body;

      const pair = await crypto.genKeyPair();

      await list.getLists(ctx);
      const lists = ctx.body; //list.get sets the ctx.body to the list of lists

      const [[user]] = await global.db.query(
        'Select id, uname, privateS3Bucket, privateAwsAccessKey, privateAwsSecret, publicS3Bucket, publicAwsAccessKey, publicAwsSecret, privatePasscode, publicPasscode From user Where id = :id',
        {id: ctx.state.user.id}
      );
      ctx.body = {
        lists: lists,
        user: user
      };
    }else{
      ctx.throw(403, 'Not Authorized');
    }
  }

}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = Sync;
