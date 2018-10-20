/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

const Return = require('./return');

class Codes {

  static async getCodes(ctx) {
    try {
      const [[codes]] = await global.db.query(
        'Select securePasscode, publicPasscode, distressPasscode from user where id = :userID',
        {userID: ctx.state.user.id}
      );
      ctx.body = Return.setReturn(codes);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }
  }

  static async updateCodes(ctx) {
    try {
      await global.db.query(
        'Update user SET securePasscode = :securePasscode, publicPasscode = :publicPasscode, distressPasscode = :distressPasscode where id = :userID',
        { securePasscode: ctx.request.body.securePasscode, publicPasscode: ctx.request.body.publicPasscode, distressPasscode: ctx.request.body.distressPasscode, userID: ctx.state.user.id }
      );
      const [[codes]] = await global.db.query(
        'Select securePasscode, publicPasscode, distressPasscode from user where id = :userID',
        { userID: ctx.state.user.id }
      );
      ctx.body = Return.setReturn(codes);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }
  }
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = Codes;
