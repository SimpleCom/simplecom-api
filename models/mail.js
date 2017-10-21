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

  static async send(id, connection){
    console.log('email in');
    const file = 'search-'+id+'.pdf';

    const [result] = await connection.execute('select * from scrape where id = ?', [id]);
    const email = result[0].email;
    const term = result[0].term;

    sgMail.setApiKey(process.env.SENDGRIDKEY);

    setTimeout(()=>{
      fs.readFile(file, {encoding: 'base64'}, (err, base64data) => {
        const msg = {
          to: email,
          from: 'test@registeredartists.com',
          subject: 'Results of your trademark search for ' + term,
          text: 'Here it is! Brand new!',
          html: '<strong>Here it is! Brand new!</strong>',
          attachments: [{filename: 'searchResults.pdf', content: base64data}]
        };
        sgMail.send(msg);
        console.log(`'${term}' Email sent`);
      })
    }, 4000)

  }

}
module.exports = Mail;
