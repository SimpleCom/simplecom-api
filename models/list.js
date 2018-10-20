/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const Lib = require('../lib/lib.js');
const ModelError = require('./modelerror.js');
const Return = require('./return');

class List {

  static async getLists(ctx) {
    try {
      const [list] = await global.db.query(
        'Select id, name from contactList where userID = :userID',
        {userID: ctx.state.user.id}
      );
      ctx.body = Return.setReturn(list);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }

  }

  static async getListsWithContacts(ctx) {
    try {
      const [list] = await global.db.query(
          `SELECT l.id as listID, l.name as listName, c.id, c.name, c.email
           FROM contactList as l
                  LEFT JOIN contact as c ON l.id = c.listID
           WHERE l.userID = :userID`,
        {userID: ctx.state.user.id}
      );
      const lists = Object.values(list.reduce((nestedList, value) => {
        const contact = {
          id: value.id,
          name: value.name,
          email: value.email
        };

        nestedList[value.listID] = nestedList[value.listID] ?
          nestedList[value.listID].contacts.push(contact) :
          nestedList[value.listID] = {
            id: value.listID,
            name: value.listName,
            contacts: contact.id ? [contact] : []
          };
        return nestedList;
      }, {}));
      console.log(lists);
      ctx.body = Return.setReturn(lists);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }

  }

  static async createList(ctx) {
    try {
      const [result] = await global.db.query(
        'Insert into contactList (name, userID) VALUES (:name, :userID)',
        {name: ctx.request.body.name, userID: ctx.state.user.id}
      );
      const response = {
        id: result.insertId,
        name: ctx.request.body.name
      };
      ctx.body = Return.setReturn(response);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }

  }

  static async getListDetails(ctx) {
    try {
      const [[list]] = await global.db.query(
        'Select id, name from contactList where id = :id and userID = :userID',
        {id: ctx.params.listID, userID: ctx.state.user.id}
      );
      ctx.body = Return.setReturn(list);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }
  }

  static async updateList(ctx) {
    try {
      await global.db.query(
        'Update contactList SET name = :name where id = :id and userID = :userID',
        {name: ctx.request.body.name, id: ctx.params.listID, userID: ctx.state.user.id}
      );
      const ret = {
        id: ctx.params.listID,
        name: ctx.request.body.name
      };
      ctx.body = Return.setReturn(ret);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }

  }

  static async deleteList(ctx) {
    try {
      await List.checkPermissions(ctx, ctx.params.listID, ctx.state.user);

      await global.db.query(
        'Delete from contactList where id = :id',
        {id: ctx.params.listID}
      );

      await global.db.query(
        'Delete from contact where listID = :listID',
        {listID: ctx.params.listID}
      );

      ctx.body = Return.setReturn('deleted');
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }

  }

  static async getContacts(ctx) {
    try {
      const [contacts] = await global.db.query(
          `SELECT l.name as listName, c.id, c.name, c.email
           FROM contactList as l
                  INNER JOIN contact as c ON l.id = c.listID
           WHERE l.userID = :userID
             AND l.id = :listID`,
        {listID: ctx.params.listID, userID: ctx.state.user.id}
      );
      const ret = {
        listName: contacts[0] && contacts[0].listName,
        contacts: contacts
      };
      ctx.body = Return.setReturn(ret);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }

  }

  static async addContact(ctx) {
    try {
      await List.checkPermissions(ctx, ctx.params.listID, ctx.state.user);

      const [result] = await global.db.query(
        'Insert into contact (listID, name, email) VALUES (:listID, :name, :email)',
        {
          listID: ctx.params.listID,
          name: ctx.request.body.name,
          email: ctx.request.body.email
        }
      );
      const ret = {
        id: result.insertId,
        name: ctx.request.body.name,
        email: ctx.request.body.email
      };
      ctx.body = Return.setReturn(ret);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }

  }

  static async updateContact(ctx) {
    try {
      await List.checkPermissions(ctx, ctx.params.listID, ctx.state.user);

      await global.db.query(
        'Update contact SET name = :name, email = :email where id = :contactID',
        {
          contactID: ctx.params.contactID,
          name: ctx.request.body.name,
          email: ctx.request.body.email
        }
      );
      const ret = {
        id: ctx.params.listID,
        name: ctx.request.body.name,
        email: ctx.request.body.email
      };
      ctx.body = Return.setReturn(ret);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }

  }

  static async deleteContact(ctx) {
    try {
      await List.checkPermissions(ctx, ctx.params.listID, ctx.state.user);

      await global.db.query(
        'Delete from contact where id = :id',
        {id: ctx.params.contactID}
      );
      ctx.body = Return.setReturn('deleted');
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }

  }

  static async checkPermissions(ctx, listID, user) {
    try {
      const [[list]] = await global.db.query(
        'Select userID from contactList where id = :id',
        {id: listID}
      );

      if (!list || list.userID !== user.id) {
        ctx.throw(403, 'You do not have permission to modify this list');
      }
      ctx.body = Return.setReturn('permitted');
    } catch (e) {
      ctx.throw(403, 'You do not have permission to modify this list');
    }

  }
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = List;
