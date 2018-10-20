/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Email model                                                                                   */
/*                                                                                                */
/* All database modifications go through the model as well as queries                             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const sgMail = require('@sendgrid/mail');
const process = require('process');
const fs = require('fs');

class Mail {

  static async send(file, data) {
    sgMail.setApiKey(process.env.SENDGRIDKEY);

    const lists = data.lists.join();
    const [result] = await global.db.query(`select * from contact where listID IN (${lists})`);
    setTimeout(() => {
      for (const r of result) {
        fs.readFile(file, {encoding: 'base64'}, (err, base64data) => {
          const msg = {
            to: r.email,
            from: 'test@registeredartists.com',
            subject: 'New Missions Update',
            text: 'See Attached PDF',
            html: 'See Attached PDF',
            attachments: [{ filename: 'missionUpdate.pdf', content: base64data }],
          };
          sgMail.send(msg);
        });
      }
    }, 4000);

  }

}

module.exports = Mail;
