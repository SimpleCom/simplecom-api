/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

class Codes {

  static async getCodes(ctx) {
    const [[codes]] = await global.db.query(
      'Select privatePasscode, publicPasscode from user where id = :userID',
      { userID: ctx.state.user.id }
    );
    ctx.body = codes;
  }

  static async updateCodes(ctx) {
    await global.db.query(
      'Update user SET privatePasscode = :privatePasscode, publicPasscode = :publicPasscode where id = :userID',
      { privatePasscode: ctx.request.body.privatePasscode, publicPasscode: ctx.request.body.publicPasscode, userID: ctx.state.user.id }
    );
    ctx.body = {
      privatePasscode: ctx.request.body.privatePasscode,
      publicPasscode: ctx.request.body.publicPasscode
    };
  }
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = Codes;