const Return = require('./return');


class Utility {
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

module.exports = Utility;