/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Route to handle authentication /auth element                                                  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')(); // router middleware for koa

const User = require('../models/user.js');

/**
 * @api {get} /auth Get JWT authentication token for subsequent API requests
 * @apiName   GetAuth
 * @apiGroup  Auth
 *
 * @apiDescription Subsequent requests requiring authentication are made with the JSON Web Token
 *   obtained from /auth, supplied in the Bearer Authorization HTTP header.
 *
 *   Note that since this does a KDF verification, it is a *slow* operation. The returned token has a
 *   24-hour limited lifetime.
 *
 * @apiParam   username                  Email of user to be authenticated.
 * @apiParam   password                  Password of user to be authenticated.
 * @apiHeader  [Accept=application/json] application/json, application/xml, text/yaml, text/plain.
 * @apiSuccess jwt                       JSON Web Token be used for subsequent Authorization header
 */

router.post('/user/login', User.getAuth);

// router.get('/jwt', async function getJWT(ctx) {
//   if (!ctx.header.authorization) ctx.throw(401, 'Authorisation required');
//   const [scheme, token] = ctx.header.authorization.split(' ');
//   if (scheme != 'Bearer') ctx.throw(401, 'Invalid authorisation');
//
//   const roles = {1: 'user', 2: 'admin', 3: 'su'};
//
//   try {
//     const payload = jwt.verify(token, process.env.JWT_KEY); // throws on invalid token
//     // valid token: accept it...
//     ctx.state.user = payload;                  // for user id  to look up user details
//     ctx.state.user.Role = roles[payload.role]; // for authorisation checks
//
//     const curDate = new Date() / 1000;
//     ctx.state.user.curDate = curDate;
//     const seconds = Math.round(ctx.state.user.exp - curDate);
//     ctx.state.user.remainingSeconds = Math.round(seconds);
//     ctx.state.user.remainingMinutes = Math.round(seconds / 60);
//     ctx.state.user.remainingHours = Math.round(seconds / 60 / 60);
//
//     ctx.body = ctx.state.user;
//     ctx.root = 'TOKEN';
//   } catch (e) {
//     if (e.message == 'invalid token') ctx.throw(401, 'Invalid JWT'); // Unauthorized
//     ctx.throw(e.status || 500, e.message); // Internal Server Error
//   }
// });



/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = router.middleware();
