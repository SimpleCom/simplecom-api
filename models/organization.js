/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

const s3 = require("./s3");
const Return = require('./return');


class Organization {

  static async addLogo(ctx) {
    try {
      const imageFile = ctx.request.body.files.uploadFile;
      const origin = ctx.origin;
      const destination = `logos/${ctx.params.organizationID}/${imageFile.name}`;
      //await fs.copy(imageFile.path, destination);

      await s3.uploadImage(imageFile.path, destination);

      const fileURL = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET}/${destination}`;

      await global.db.query(`UPDATE organization
                             SET logo = :logo
                             Where id = :id`,
        {id: ctx.params.organizationID, logo: fileURL}
      );

      const response = {url: fileURL};
      ctx.body = Return.setReturn(response);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }
  }

  static async getAll(ctx) {
    try {
      const [response] = await global.db.query(`select id, name, logo
                                                from organization`);
      ctx.body = Return.setReturn(response);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }
  }

  static async get(ctx) {
    try {
      const orgID = ctx.params.organizationID;
      const [[response]] = await global.db.query(`select id, name, logo
                                                from organization
                                               where id = :orgID`, {orgID: orgID});
      ctx.body = Return.setReturn(response);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }
  }

  static async add(ctx) {
    try {
      const response = await global.db.query(`insert into organization (name) values (:name)`, {name: ctx.request.body.name});
      ctx.body = Return.setReturn(response);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }
  }

  static async update(ctx) {
    try {
      const orgID = ctx.params.organizationID;
      const response = await global.db.query(`update organization set name = :name where id = :id`, {name: ctx.request.body.name, id: orgID});
      ctx.body = Return.setReturn(response);
    } catch (e) {
      ctx.body = Return.setReturn(null, false, e);
    }
  }

}
  
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = Organization;
