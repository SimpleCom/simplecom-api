/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  User routes                                                                                  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')(); // router middleware for koa
const organization  = require('../models.js');
router.prefix('/organization');
router.post('/:organizationID/logo', organization.addLogo);
router.get('/:organizationID', organization.get);
router.get('/', organization.getAll);
router.post('/', organization.add);
router.put('/:organizationID', organization.update);

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = router.middleware();
