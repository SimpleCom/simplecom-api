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

  static async getListDetails(ctx) {
    const [[list]] = await global.db.query(
      'Select id, name from contactList where id = :id and userID = :userID',
      { id: ctx.params.listID, userID: ctx.state.user.id }
    );
    ctx.body = list;
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
    await List.checkPermissions(ctx, ctx.params.listID, ctx.state.user);

    await global.db.query(
      'Delete from contactList where id = :id',
      { id: ctx.params.listID }
    );

    await global.db.query(
      'Delete from contact where listID = :listID',
      { listID: ctx.params.listID }
    );

    ctx.body = null;
  }

  static async getContacts(ctx) {
    const [contacts] = await global.db.query(
      `SELECT l.name as listName, c.id, c.name, c.email
      FROM contactList as l INNER JOIN contact as c
      ON l.id = c.listID
      WHERE l.userID = :userID AND l.id = :listID`,
      { listID: ctx.params.listID, userID: ctx.state.user.id }
    );
    ctx.body = {
      listName: contacts[0] && contacts[0].listName,
      contacts: contacts
    };
  }

  static async addContact(ctx) {
    await List.checkPermissions(ctx, ctx.params.listID, ctx.state.user);

    const [result] = await global.db.query(
      'Insert into contact (listID, name, email) VALUES (:listID, :name, :email)',
      {
        listID: ctx.params.listID,
        name: ctx.request.body.name,
        email: ctx.request.body.email
      }
    );
    ctx.body = {
      id: result.insertId,
      name: ctx.request.body.name,
      email: ctx.request.body.email
    };
  }

  static async updateContact(ctx) {
    await List.checkPermissions(ctx, ctx.params.listID, ctx.state.user);

    await global.db.query(
      'Update contact SET name = :name, email = :email where id = :contactID',
      {
        contactID: ctx.params.contactID,
        name: ctx.request.body.name,
        email: ctx.request.body.email
      }
    );
    ctx.body = {
      id: ctx.params.listID,
      name: ctx.request.body.name,
      email: ctx.request.body.email
    };
  }

  static async deleteContact(ctx) {
    await List.checkPermissions(ctx, ctx.params.listID, ctx.state.user);

    await global.db.query(
      'Delete from contact where id = :id',
      { id: ctx.params.contactID }
    );
    ctx.body = null;
  }

  static async checkPermissions(ctx, listID, user){
    const [[list]] = await global.db.query(
      'Select userID from contactList where id = :id',
      { id: listID }
    );

    if(!list || list.userID !== user.id){
      ctx.throw(403, 'You do not have permission to modify this list');
    }
  }
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = List;
