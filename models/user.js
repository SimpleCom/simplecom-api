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
const fs = require('fs-extra');

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

  static async deleteUser(ctx) {
    const result = await global.db.query('delete from user where id = :id', {id: ctx.params.userID});
    ctx.body = result;
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

  static async addLogo(ctx) {
    let imageFile = ctx.request.body.files.uploadFile;
    let destination = `uploads/logos/${ctx.params.userID}/${imageFile.name}`;

    await fs.copy(imageFile.path, destination)
      .then(() => {
        const response = {
          'url': destination
        }

        ctx.body = response;
      })
      .catch(err => console.log(err))
  }
}

const makeCode = function() {
  var text = "";
  var possible = "BCDFGHJKLMNPQRSTVWXYZ0123456789";
  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = User;
