/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* User model; users allowed to access the system                                                 */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


// const fs = require('fs-extra');
const s3 = require("./s3");


class Organization {

  static async addLogo(ctx) {
    const imageFile = ctx.request.body.files.uploadFile;
    const origin = ctx.origin;
    const destination = `logos/${ctx.params.organizationID}/${imageFile.name}`;
    //await fs.copy(imageFile.path, destination);

    await s3.uploadImage(imageFile.path, destination);

    const fileURL = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET}/${destination}`;

    await global.db.query(`UPDATE organization SET 
        logo = :logo
        Where id = :id`,
        {id: ctx.params.organizationID, logo: fileURL}
      );

    const response = {url: fileURL};
    ctx.body = response;
  }

}
  
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = Organization;
