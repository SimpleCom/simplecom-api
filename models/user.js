/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict'

const Lib = require('../lib/lib.js');
const ModelError = require('./modelerror.js');
const scrypt = require('scrypt');       // scrypt library
const jwt = require('jsonwebtoken'); // JSON Web Token implementation
const randomstring = require('randomstring');
const fs = require('fs-extra');
const Return = require('./return');

class User {

  /**
   * Returns User details (convenience wrapper for single User details).
   *
   * @param   {number} id - User id or undefined if not found.
   * @returns {Object} User details.
   */
  static async get(id) {
    const [[user]] = await global.db.query('Select id, uname, userTypeID, organizationID, securePasscode, publicPasscode, distressPasscode From user Where id = :id', {id});
    return user;
  }

  static async getUser(ctx) {
    try {
      const user = await User.get(ctx.params.userID);
      ctx.body = Return.setReturn(user);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
      throw e;
    }
  }

  static async setStatus(ctx) {
    try {
      const userID = ctx.params.userID;
      const result = await global.db.query('update user set status = :status where id = :id', {
        status: ctx.request.body.status,
        id: userID
      });
      ctx.body = Return.setReturn(result);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
      throw e;
    }
  }

  static async routeUpdate(ctx) {
    try {
      // only admin can edit other users
      const userID = Number(ctx.params.userID);
      const requestUserType = ctx.state.user.userTypeID;

      // IS USER EDITING SELF?
      let editSelf = false;
      if (ctx.state.user.id === userID) editSelf = true;

      // CHECK PERMISSION TO CHANGE PASSWORD
      if (editSelf === true || requestUserType == 2) {
        // NOT CALLING RETURN.SETRETURN BECAUSE SUB FUNCTION CALLS IT
        ctx.body = await User.update(ctx);
      } else {
        ctx.throw(401,"Not Authorized");
      }
    } catch ({status, message}) {
      ctx.throw(status, message);
      return 0;
    }
  }

  static async update(ctx) {
    const userID = ctx.params.userID;

    const result = await global.db.query(`update user
                                          set uname            = :uname,
                                              userTypeID       = :userTypeID,
                                              organizationID   = :organizationID,
                                              securePasscode   = :securePasscode,
                                              publicPasscode   = :publicPasscode,
                                              distressPasscode = :distressPasscode
                                          where id = :id`,
      {
        uname: ctx.request.body.uname,
        userTypeID: ctx.request.body.userTypeID,
        organizationID: ctx.request.body.organizationID,
        securePasscode: ctx.request.body.securePasscode,
        publicPasscode: ctx.request.body.publicPasscode,
        distressPasscode: ctx.request.body.distressPasscode,
        id: userID
      });

      // IF PASSWORD, UPDATE PASSWORD
      if (ctx.request.body.password) {await User.doUpdatePassword(userID, ctx.request.body.password);} 

    return Return.setReturn(result);
  }

  /**
   * Returns Users with given field matching given value.
   *
   * @param   {string}        field - Field to be matched.
   * @param   {string!number} value - Value to match against field.
   * @returns {Object[]}      Users details.
   */

  static async getAuth(ctx) {
    let user = null;
    if (ctx.request.body.refreshToken) {
      [user] = await User.getByToken(ctx.request.body.refreshToken);
      if (!user) {
        [user] = await User.getBy('refreshToken', ctx.request.body.refreshToken);
        if (!user) ctx.throw(401, 'Bad Token not found');
      }
    } else {
      [user] = await User.getByUname(ctx.request.body.uname);
      if (!user) ctx.throw(401, 'Username/password not found');
      if (user.status !== 1) {
        ctx.throw(401, 'Invalid authorization');
        return 0;
      }
      // check password
      try {
        const match = await scrypt.verifyKdf(Buffer.from(user.password, 'base64'), ctx.request.body.pass);
        if (!match) ctx.throw(401, 'Username/password not found.');
      } catch (e) { // e.g. "data is not a valid scrypt-encrypted block"
        ctx.throw(401, 'Username/password not found!');
      }
    }

    try {
      const payload = {
        id: user.id,                 // to get user details
        userTypeID: user.userTypeID
      };
      const token = jwt.sign(payload, process.env.JWT_KEY, {expiresIn: process.env.TOKEN_TIME});
      const refreshToken = randomstring.generate(50);
      const decoded = jwt.verify(token, process.env.JWT_KEY); // throws on invalid token
      const ret = User.addToken(user.id, refreshToken);

      ctx.body = {
        id: user.id,
        jwt: token,
        root: 'Auth',
        role: user.role,
        refreshToken: refreshToken,
        expires: decoded.exp,
      };
    } catch (e) { // e.g. "data is not a valid scrypt-encrypted block"
      ctx.throw(404, 'Username/password not found!');
    }
  }

  static async getByUname(value) {
    try {

      const sql = `Select *
                   From user
                   where uname = :uname`;
      const [users] = await global.db.query(sql, {uname: value});
      return users;

    } catch (e) {
      switch (e.code) {
        case 'ER_BAD_FIELD_ERROR':
          throw new ModelError(403, 'Unrecognised User field uname.');
        default:
          Lib.logException('User.getBy', e);
          throw new ModelError(500, e.message);
      }
    }
  }

  static async addToken(userID, refreshToken) {
    const sql = `insert into userToken (userID, refreshToken)
                 values (:userID, :refreshToken)`;
    const ret = await global.db.query(sql, {userID: userID, refreshToken: refreshToken});
    return ret;
  }

  static async getByToken(token) {
    const sql = `Select *
                 From user
                 where id in (select userID from userToken where refreshToken = :token)`;
    const [users] = await global.db.query(sql, {token: token});

    const sql2 = `delete
                  from userToken
                  where refreshToken = :token`; //This token has been used, remove it.
    const res = await global.db.query(sql2, {token: token});

    return users;
  }

  static async register(ctx) {
    try {
      let newPassword = '';
      while (newPassword.length < 10) newPassword = scrypt.kdfSync(ctx.request.body.pass, {N: 16, r: 8, p: 2});
      const [result] = await global.db.query(`insert into user (uname, password, userTypeID)
                                        values (:uname, :pass, :userTypeID)`, {
        uname: ctx.request.body.uname,
        pass: newPassword.toString("base64"),
        userTypeID: ctx.request.body.userTypeID
      });
      ctx.body = Return.setReturn(result);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
      throw e;
    }
  }

  static async updatePassword(ctx) {
    try {
      // only admin can edit other user's password
      // length > 8
      const id = Number(ctx.params.userID);
      const password = ctx.request.body.password;
      const requestUserType = ctx.state.user.userTypeID;

      // IS USER EDITING SELF?
      let editSelf = false;
      if (ctx.state.user.id === id) editSelf = true;

      // CHECK PERMISSION TO CHANGE PASSWORD
      if (editSelf === true || requestUserType == 2) {
        const ret = await User.doUpdatePassword(id, password);
        ctx.body = Return.setReturn(ret);
      } else {
        ctx.throw(401,"Not Authorized");
      }
    } catch ({status, message}) {
      ctx.throw(status, message);
      return 0;
    }
  }

  static async doUpdatePassword(userID, password) {
      if (password && password.length >= 8) {
          let newPassword = '';
          while (newPassword.length < 10) newPassword = scrypt.kdfSync(password, {N: 16, r: 8, p: 2});
          await global.db.query(`UPDATE user SET password=:newPassword WHERE id=:id`, {newPassword: newPassword.toString("base64"), id: userID});
          return "Password updated";
      } else throw {status: 400, message: 'Password needs to be longer than 8 characters.'};
  }

  static async getList(ctx) {
    try {
      const [result] = await global.db.query(`select u.id, u.uname, o.name, u.status
                                              from user u
                                                     left join organization o on u.organizationID = o.id
      order by u.status desc, u.uname asc`);
      ctx.body = Return.setReturn(result);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
      throw e;
    }
  }

  static async getUserTypes(ctx) {
    try {
      const [result] = await global.db.query(`select id, name
                                              from userType`);
      ctx.body = Return.setReturn(result);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
      throw e;
    }
  }
}

const makeCode = function (len = 6) {
  var text = "";
  var possible = "BCDFGHJKLMNPQRSTVWXYZ0123456789";
  for (var i = 0; i < len; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
};

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = User;
