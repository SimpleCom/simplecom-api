/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Route to handle root element: return uri's for available resources & note on authentication   */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')(); // router middleware for koa
const s3 = require('../models/s3.js');

router.get('/', function getRoot(ctx) {
    // root element just returns uri's for principal resources (in preferred format)
    const resources = { auth: { _uri: '/user/login' } };
    const authentication = '‘GET /user/login’ to obtain JSON Web Token; subsequent requests require JWT auth';
    ctx.body = { resources: resources, authentication: authentication };
});
router.get('/hit/:bucket/:key', s3.hit);

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = router.middleware();
