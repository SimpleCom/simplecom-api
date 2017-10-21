/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Route to handle root element: return uri's for available resources & note on authentication   */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')(); // router middleware for koa

router.get('/testmail', function getRoot(ctx) {
  const sgMail = require('@sendgrid/mail');
  console.log(process.env.SENDGRIDKEY);
  sgMail.setApiKey(process.env.SENDGRIDKEY);
  const msg = {
    to: 'geektech2000@gmail.com',
    from: 'test@registeredartists.com',
    subject: 'Sending with SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };
  const ret = sgMail.send(msg);
  console.log('return', ret);
  ctx.body = 'mail sent';
});

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = router.middleware();
