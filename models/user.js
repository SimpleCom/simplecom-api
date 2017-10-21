/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const Lib = require('../lib/lib.js');
const ModelError = require('./modelerror.js');
const scrypt = require('scrypt');       // scrypt library
const jwt = require('jsonwebtoken'); // JSON Web Token implementation
const randomstring = require('randomstring');

class User {

  /**
   * Returns User details (convenience wrapper for single User details).
   *
   * @param   {number} id - User id or undefined if not found.
   * @returns {Object} User details.
   */
  static async get(id) {
    const [user] = await global.db.query('Select id, email, fname, lname, role, status From user Where id = :id', {id});
    user[0].password = null;
    return user[0];
  }

  static async save(ctx) {
    console.log(ctx.request.body);
    if (ctx.request.body.password && ctx.request.body.password.length > 3) {
      var newPassword = '';
      while (newPassword.length < 10) newPassword = scrypt.kdfSync(ctx.request.body.password, {N: 16, r: 8, p: 2});
      const resultPass = await global.db.query('update user set password = :password where id = :id', {
        id: ctx.request.body.id,
        password: newPassword
      });
      console.log(ctx.request.body.id);
      console.log(newPassword);

    }
    const result = await global.db.query('update user set email = :email, fname = :fname, lname = :lname, role = :role, status = :status, teamID = :teamID where id = :id', {
      id: ctx.params.userID,
      email: ctx.request.body.email,
      fname: ctx.request.body.fname,
      lname: ctx.request.body.lname,
      role: ctx.request.body.role,
      status: ctx.request.body.status,
      teamID: ctx.request.body.teamID
    });
    ctx.body = result;
    ctx.body.root = 'Result';
  }

  static async deleteUser(ctx) {
    const result = await global.db.query('delete from user where id = :id', {id: ctx.params.userID});
    ctx.body = result;
    ctx.body.root = 'Result';
  }

  /**
   * Returns Users with given field matching given value.
   *
   * @param   {string}        field - Field to be matched.
   * @param   {string!number} value - Value to match against field.
   * @returns {Object[]}      Users details.
   */

  static async getAuth(ctx) {
    console.log(ctx.request.body);
    let user = null;
    if (ctx.request.body.refreshToken) {
      [user] = await User.getByToken(ctx.request.body.refreshToken);
      if (!user) {
        [user] = await User.getBy('refreshToken', ctx.request.body.refreshToken);
        if (!user) ctx.throw(401, 'Bad Token not found');
      }
    } else {
      [user] = await User.getByUname(ctx.request.body.uname);
      console.log(user);
      if (!user) ctx.throw(401, 'Username/password not found');
      //console.log('user', user);
      //console.log('test', user);
      // check password
      try {
        const match = await scrypt.verifyKdf(Buffer.from(user.password, 'base64'), ctx.request.body.pass);
        if (!match) ctx.throw(401, 'Username/password not found.');
      } catch (e) { // e.g. "data is not a valid scrypt-encrypted block"
        //ctx.throw(404, e.message);
        ctx.throw(401, 'Username/password not found!');
      }
    }

    try {
      const payload = {
        id: user.id,                 // to get user details
      };
      console.log('env', process.env.TOKEN_TIME);
      const token = jwt.sign(payload, process.env.JWT_KEY, {expiresIn: process.env.TOKEN_TIME});
      const refreshToken = randomstring.generate(50);
      const decoded = jwt.verify(token, process.env.JWT_KEY); // throws on invalid token
      const ret = User.addToken(user.id, refreshToken);

      ctx.body = {
        jwt: token,
        root: 'Auth',
        role: user.role,
        refreshToken: refreshToken,
        expires: decoded.exp,
      };
    } catch (e) { // e.g. "data is not a valid scrypt-encrypted block"
      ctx.throw(404, e.message);
      //ctx.throw(404, 'Username/password not found!');
    }
  }

  static async getByUname(value) {
    try {

      const sql = `Select * From user where uname = :uname`;
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
    const sql = `insert into userToken (userID, refreshToken) values (:userID, :refreshToken)`;
    const ret = await global.db.query(sql, {userID: userID, refreshToken: refreshToken});
    return ret;
  }

  static async getByToken(token) {
    const sql = `Select * From user where id in (select userID from userToken where refreshToken = :token)`;
    const [users] = await global.db.query(sql, {token: token});

    const sql2 = `delete from userToken where refreshToken = :token`; //This token has been used, remove it.
    const res = await global.db.query(sql2, {token: token});

    return users;
  }

  // /**
  //  * Creates new User record.
  //  *
  //  * @param   {Object} values - User details.
  //  * @returns {number} New user id.
  //  * @throws  Error on validation or referential integrity errors.
  //  */
  // static async insert(values) {
  //   try {
  //     var newPassword = '';
  //     while (newPassword.length < 10) newPassword = scrypt.kdfSync(values.password, {N: 16, r: 8, p: 2});
  //
  //     values.password = newPassword;
  //     const [result] = await global.db.query('Insert Into user Set ?', [values]);
  //     //console.log('User.insert', result.insertId, new Date); // eg audit trail?
  //     return result.insertId;
  //
  //   } catch (e) {
  //     //console.log('error!!!', e.code);
  //     switch (e.code) { // just use default MySQL messages for now
  //       case 'ER_BAD_NULL_ERROR':
  //       case 'ER_NO_REFERENCED_ROW_2':
  //       case 'ER_NO_DEFAULT_FOR_FIELD':
  //         throw new ModelError(403, e.message); // Forbidden
  //       case 'ER_DUP_ENTRY':
  //         throw new ModelError(409, e.message); // Conflict, already exists
  //       case 'ER_BAD_FIELD_ERROR':
  //         throw new ModelError(500, e.message); // Internal Server Error for programming errors
  //       default:
  //         Lib.logException('User.insert', e);
  //         throw new ModelError(500, e.message); // Internal Server Error for uncaught exception
  //     }
  //   }
  // }
  //
  // /**
  //  * Update User details.
  //  *
  //  * @param  {number} id - User id.
  //  * @param  {Object} values - User details.
  //  * @throws Error on referential integrity errors.
  //  */
  // static async update(id, values) {
  //   try {
  //
  //     await global.db.query('Update user Set ? Where id = ?', [values, id]);
  //     //console.log('User.update', id, new Date); // eg audit trail?
  //
  //   } catch (e) {
  //     switch (e.code) { // just use default MySQL messages for now
  //       case 'ER_BAD_NULL_ERROR':
  //       case 'ER_DUP_ENTRY':
  //       case 'ER_ROW_IS_REFERENCED_2':
  //       case 'ER_NO_REFERENCED_ROW_2':
  //         throw new ModelError(403, e.message); // Forbidden
  //       case 'ER_BAD_FIELD_ERROR':
  //         throw new ModelError(500, e.message); // Internal Server Error for programming errors
  //       default:
  //         Lib.logException('User.update', e);
  //         throw new ModelError(500, e.message); // Internal Server Error for uncaught exception
  //     }
  //   }
  // }
  //
  //
  // /**
  //  * Delete User record.
  //  *
  //  * @param  {number} id - User id.
  //  * @throws Error
  //  */
  // static async delete(id) {
  //   try {
  //
  //     await global.db.query('Delete From user Where id = ?', {id});
  //     //console.log('User.delete', id, new Date); // eg audit trail?
  //
  //   } catch (e) {
  //     switch (e.code) {
  //       default:
  //         Lib.logException('User.delete', e);
  //         throw new ModelError(500, e.message); // Internal Server Error
  //     }
  //   }
  // }

  static async register(ctx) {
    console.log(ctx.request.body.uname);
    console.log(ctx.request.body.pass)
    let result;
    try {
      var newPassword = '';
      while (newPassword.length < 10) newPassword = scrypt.kdfSync(ctx.request.body.pass, {N: 16, r: 8, p: 2});
      [result] = await global.db.query(`insert into user (uname, password) values (:uname, :pass)`, {
        uname: ctx.request.body.uname,
        pass: newPassword.toString("base64")
      });
    } catch (e) {
      console.log('error', e);
      result = [{error: 1}];
    }
    ctx.body = result; //Return only the ID
    ctx.body.root = 'Result';
  }
}
//   static async validateCode(ctx) {
//     let result = [];
//     try {
//       [result] = await global.db.query('select id, name from team where code = :code', {code: ctx.params.code});
//     } catch(e){
//       result = [{id: 0}];
//     }
//     if (!result[0]){
//       result = [{id: 0}];
//     }
//     ctx.body = result[0]; //Return only the ID
//     ctx.body.root = 'Result';
//   }
// }

const makeCode = function() {
  var text = "";
  var possible = "BCDFGHJKLMNPQRSTVWXYZ0123456789";
  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = User;
