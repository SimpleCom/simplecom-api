/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const Lib = require('../lib/lib.js');
const ModelError = require('./modelerror.js');
const scrypt = require('scrypt');       // scrypt library

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

  static async getAll(ctx) {
    let teamWhere = ''
    if (ctx.state.user.role < 3) {
      const [[myTeamID]] = await global.db.query(`Select teamID from user where ID = ${ctx.state.user.id}`);
      teamWhere = `WHERE teamID = ${myTeamID.teamID}`
    }
    const [users] = await global.db.query(`SELECT u.id, u.email, u.fname, u.lname, u.role, u.status, u.teamID, t.name as teamName, t.code as code
                                             FROM team t left join user u on u.teamID = t.id
                                            ${teamWhere}
                                            ORDER BY teamName, lname, fname`);
    let curCode = 'z4rde#'; //Gibberish to avoid ever matching on the first round
    let outTeams = [];
    let curTeam = {};
    users.forEach((user)=>{
      //console.log(user);
      if (user.code != curCode){
        //This is a new team, set it up
        curCode = user.code;
        if (curTeam.name){
          outTeams.push(curTeam);
          curTeam = {};
        }
        curTeam.name = user.teamName;
        curTeam.code = user.code;
        curTeam.users = [];
      }
      curTeam.users.push(user);
    });
    outTeams.push(curTeam);

    ctx.body = outTeams;
    ctx.body.root = 'Users';
  }

  static async getTeams(ctx) {
    const [teams] = await global.db.query(`Select * From team`);
    ctx.body = teams;
    ctx.body.root = 'Teams';
  }

  static async getRoles(ctx) {
    const [roles] = await global.db.query(`Select * From userRole where canUse <= ${ctx.state.user.role}`);
    ctx.body = roles;
    ctx.body.root = 'UserRoles';
  }

  static async addTeam(ctx){
    const result = await global.db.query('insert into team (name, maxUsers, status) values (:teamName, 0, 1)', {
      teamName: ctx.request.body.name
    });
    const id = result[0].insertId;
    let done = false;
    while (!done){
      try {
        let code = makeCode();
        const res = await global.db.query('update team set code = :code where id = :id', {code: code, id: id});
        done = true;
      } catch (e){
        console.log('error!!!', e);
        done = false;
      }
    }


    ctx.body = result;
    ctx.body.root = 'Result';

  }

  static async save(ctx) {
    console.log(ctx.request.body);
    if(ctx.request.body.password && ctx.request.body.password.length > 3){
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
  static async getBy(field, value) {
    try {

      const sql = `Select * From user where ${field} = :${field} Order By fname, lname`;
      const [users] = await global.db.query(sql, {[field]: value});

      return users;

    } catch (e) {
      switch (e.code) {
        case 'ER_BAD_FIELD_ERROR':
          throw new ModelError(403, 'Unrecognised User field ' + field);
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

  static async register (ctx){
    console.log(ctx.request.body);
    let result;
    try {
      var newPassword = '';
      while (newPassword.length < 10) newPassword = scrypt.kdfSync(ctx.request.body.password, {N: 16, r: 8, p: 2});
      [result] = await global.db.query(`insert into user (fname, lname, email, password, teamID, role, status) values (:fname, :lname, :email, :password, :teamID, :role, :status)`, {fname: ctx.request.body.fname, lname: ctx.request.body.lname, email: ctx.request.body.email, password: newPassword, teamID: ctx.request.body.teamID, role: 1, status: 1 });
    } catch(e){
      console.log('error', e);
      result = [{error: 1}];
    }
    ctx.body = result; //Return only the ID
    ctx.body.root = 'Result';


  }

  static async validateCode(ctx) {
    let result = [];
    try {
      [result] = await global.db.query('select id, name from team where code = :code', {code: ctx.params.code});
    } catch(e){
      result = [{id: 0}];
    }
    if (!result[0]){
      result = [{id: 0}];
    }
    ctx.body = result[0]; //Return only the ID
    ctx.body.root = 'Result';
  }
}

let makeCode = function() {
  var text = "";
  var possible = "BCDFGHJKLMNPQRSTVWXYZ0123456789";
  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = User;
