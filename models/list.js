/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const Lib = require('../lib/lib.js');
const ModelError = require('./modelerror.js');

class List {

  /**
   * Returns User details (convenience wrapper for single User details).
   *
   * @param   {number} id - User id or undefined if not found.
   * @returns {Object} User details.
   */
  static async get(ctx) {
    const [list] = await global.db.query('Select id, name from list where userID = :userID', { userID: ctx.state.user.id });
    return list;
  }

  static async getList(ctx) {
    const [list] = await global.db.query(`Select id, name, email 
                                            from listDetail 
                                           where listID = :listID 
                                             and listID in (select id from list where userID = :userID)`, { listID: ctx.params.listID, userID: ctx.state.user.id });
    return list;
  }

}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = List;
