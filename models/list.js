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
    ctx.body = list;
  }

  static async getList(ctx) {
    const [list] = await global.db.query(`Select id, name, email 
                                            from listDetail 
                                           where listID = :listID 
                                             and listID in (select id from list where userID = :userID)`, { listID: ctx.params.listID, userID: ctx.state.user.id });
    ctx.body = list;
  }

  static async create(ctx) {
      const [result] = await global.db.query(
          'Insert into list (name, userID) VALUES (:name, :userID)',
          { name: ctx.request.body.name, userID: ctx.state.user.id }
      );
      ctx.body = {
        id: result.insertId,
        name: ctx.request.body.name
      };
  }

  static async update(ctx) {
      await global.db.query(
          'Update list SET name = :name where id = :id and userID = :userID',
          { name: ctx.request.body.name, id: ctx.params.listID, userID: ctx.state.user.id }
      );
      ctx.body = {
          id: ctx.params.listID,
          name: ctx.request.body.name
      };
  }

}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = List;
