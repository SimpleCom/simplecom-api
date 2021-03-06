#!/usr/bin/env node
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Simple app to explore Node.js + Koa + MySQL basics for CRUD admin + API                        */
/*                                                                                                */
/* App comprises three (composed) sub-apps:                                                       */
/*  - www.   (public website pages)                                                               */
/*  - admin. (pages for interactively managing data)                                              */
/*  - api.   (RESTful CRUD API)                                                                   */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';
/* eslint no-shadow:off */
/* app is already declared in the upper scope */

const Koa = require('koa');            // Koa framework
const body = require('koa-body');       // body parser
const compress = require('koa-compress');   // HTTP compression
const session = require('koa-session');    // session for flash messages
const mysql = require('mysql2/promise'); // fast mysql driver
const debug = require('debug')('app');   // small debugging utility
const cors = require('koa2-cors');   // CORS for Koa 2
const jwt = require('jsonwebtoken'); // JSON Web Token implementation
const bunyan = require('bunyan');       // logging
const koaLogger = require('koa-bunyan');   // logging
const mkdirp = require('mkdirp');
const Return = require('./models/return');

const app = new Koa();

// MySQL connection pool (set up on app initialization)
require('dotenv').config(); // loads environment variables from .env file (if available - eg dev env)
const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

global.connectionPool = mysql.createPool(config); // put in global to pass to sub-apps


/* set up middleware which will be applied to each request - - - - - - - - - - - - - - - - - - -  */


// return response time in X-Response-Time header
app.use(async function responseTime(ctx, next) {
  const t1 = Date.now();
  await next();
  const t2 = Date.now();
  ctx.set('X-Response-Time', Math.ceil(t2 - t1) + 'ms');
});


// HTTP compression
app.use(compress({}));


// only search-index www subdomain
app.use(async function robots(ctx, next) {
  await next();
  ctx.response.set('X-Robots-Tag', 'noindex, nofollow');
});

// parse request body into ctx.request.body
app.use(body({multipart: true}));

// set signed cookie keys for JWT cookie & session cookie
app.keys = ['7R%k2s*d$ehj76w@ere'];

// session for flash messages (uses signed session cookies, with no server storage)
app.use(session(app)); // note koa-session@3.4.0 is v1 middleware which generates deprecation notice

// sometimes useful to be able to track each request...
app.use(async function (ctx, next) {
  debug(ctx.method + ' ' + ctx.url);
  await next();
});

app.use(cors({'Access-Control-Allow-Origin': '*'}));

// content negotiation: api will respond with json, xml, or yaml
app.use(async function contentNegotiation(ctx, next) {
  await next();
  if (!ctx.body) return; // no content to return
  //We are always returning json therefore we do not need the root.  Just in case it is here we can remove it.
  delete ctx.body.root; // xml root element
});


// handle thrown or uncaught exceptions anywhere down the line
app.use(async function handleErrors(ctx, next) {
  try {
    await next();
  } catch (e) {
    ctx.status = e.status || 500;
    if (!ctx.body || !ctx.body.success) {
      if (typeof ctx.body !== 'object') {
        ctx.body = Return.setReturn(null, false, e);
      }
    }
    switch (ctx.status) {
      case 204: // No Content
        break;
      case 401: // Unauthorized
        ctx.set('WWW-Authenticate', 'Basic');
        break;
      case 403: // Forbidden
      case 404: // Not Found
      case 406: // Not Acceptable
      case 409: // Conflict
        break;
      default:
      case 500: // Internal Server Error (for uncaught or programming errors)
        if (app.env !== 'production') {
          ctx.body.stack = e.stack;
        }
        ctx.app.emit('error', e, ctx); // github.com/koajs/koa/wiki/Error-Handling
        break;
    }
  }
});


// set up MySQL connection
app.use(async function mysqlConnection(ctx, next) {
  try {

    // keep copy of ctx.state.db in global for access from models
    ctx.state.db = global.db = await global.connectionPool.getConnection();
    ctx.state.db.connection.config.namedPlaceholders = true;
    // traditional mode ensures not null is respected for unsupplied fields, ensures valid JavaScript dates, etc
    await ctx.state.db.query('SET SESSION sql_mode = "TRADITIONAL"');

    await next();

    ctx.state.db.release();

  } catch (e) {
    // note if getConnection() fails we have no this.state.db, but if anything downstream throws,
    // we need to release the connection
    if (ctx.state.db) ctx.state.db.release();
    throw e;
  }
});

const dir = __dirname + '/logs';
mkdirp.sync(dir);

// logging
const access = {type: 'rotating-file', path: './logs/api-access.log', level: 'trace', period: '1d', count: 4};
const error = {type: 'rotating-file', path: './logs/api-error.log', level: 'error', period: '1d', count: 4};
const logger = bunyan.createLogger({name: 'api', streams: [access, error]});
app.use(koaLogger(logger, {}));

// ------------ routing

app.use(require('./routes/routes-root.js'));
app.use(require('./routes/routes-auth.js'));
app.use(require('./routes/routes-sync.js'));
app.use(require('./routes/routes-pdf.js'));

// remaining routes require JWT auth (obtained from /auth and supplied in bearer authorization header)

app.use(async function verifyJwt(ctx, next) {
  const rx = ctx.request.url.split('/');
  if (rx[1] !== 'logos') {
    if (!ctx.header.authorization) {
      ctx.throw(401, 'Authorization required');
    }
    const [scheme, token] = ctx.header.authorization.split(' ');
    if (scheme !== 'Bearer') {
      ctx.throw(401, 'Invalid authorization');
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_KEY); // throws on invalid token
      // valid token: accept it...
      ctx.state.user = payload;                  // for user id  to look up user details
    } catch (e) {
      if (e.message === 'invalid token') {
        ctx.throw(401, 'Invalid JWT');
      } // Unauthorized
      ctx.throw(e.status || 500, e.message); // Internal Server Error
    }
  }
  await next();
});

// CHECK USER STATUS
app.use(async function checkStatus(ctx, next) {
  // CHECK STATUS FROM DATABASE
  const [[result]] = await ctx.state.db.query("SELECT status, userTypeID FROM user WHERE id=:id", {id: ctx.state.user.id});
  // THIS OVERWRITES THE JWT VALUE
  ctx.state.user.userTypeID = result.userTypeID;
  if (result.status !== 1) {
    ctx.throw(401, 'Invalid authorization');
    return 0;
  } else await next();
});

app.use(require('./routes/routes-list.js'));
app.use(require('./routes/routes-user.js'));

app.use(require('./routes/routes-codes.js'));
app.use(require('./routes/routes-utility.js'));

app.use(async function verifyAdmin(ctx, next) {
  if (ctx.state.user.userTypeID === 2) {
    await next();
  } else {
    ctx.throw(401, 'Invalid authorization');
  }
});

app.use(require('./routes/routes-admin-user.js'));
app.use(require('./routes/routes-admin-organization.js'));


/* create server - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


app.listen(process.env.PORT || 3001);
console.info(`${process.version} listening on port ${process.env.PORT || 3001} (${app.env}/${config.database})`);


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = app;
