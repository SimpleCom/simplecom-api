/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const user = require('./user.js');
const list = require('./list.js');

class Sync {

  /**
   * Returns User details (convenience wrapper for single User details).
   *
   * @param   {number} id - User id or undefined if not found.
   * @returns {Object} User details.
   */
  static async sync(ctx) {
    ctx.body = {};
    await user.getAuth(ctx);
    if (ctx.body.jwt) {
      ctx.state.user = ctx.body;
      await list.getLists(ctx);
      const listPart = ctx.body; //list.get sets the ctx.body to the list of lists
      ctx.body = { list: listPart };
    }else{
      ctx.body = 'Not Authorized';
    }
  }

}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = Sync;
