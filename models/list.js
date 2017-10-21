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
  static async getLists(ctx) {
    const [list] = await global.db.query(
      'Select id, name from contactList where userID = :userID',
      { userID: ctx.state.user.id }
    );
    ctx.body = list;
  }

  static async createList(ctx) {
    const [result] = await global.db.query(
      'Insert into contactList (name, userID) VALUES (:name, :userID)',
      { name: ctx.request.body.name, userID: ctx.state.user.id }
    );
    ctx.body = {
      id: result.insertId,
      name: ctx.request.body.name
    };
  }

  static async updateList(ctx) {
    await global.db.query(
      'Update contactList SET name = :name where id = :id and userID = :userID',
      { name: ctx.request.body.name, id: ctx.params.listID, userID: ctx.state.user.id }
    );
    ctx.body = {
      id: ctx.params.listID,
      name: ctx.request.body.name
    };
  }

  static async deleteList(ctx) {
    await global.db.query(
      'Delete from contactList where id = :id and userID = :userID',
      { id: ctx.params.listID, userID: ctx.state.user.id }
    );
    ctx.body = null;
  }

}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = List;
