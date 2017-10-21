/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  User routes                                                                                  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')(); // router middleware for koa
const list  = require('../models/list.js');

router.get('/lists', list.getLists);
router.post('/lists', list.createList);
router.put('/lists/:listID', list.updateList);
router.delete('/lists/:listID', list.deleteList);
router.get('/lists/:listID/contacts', list.getContacts);
router.post('/lists/:listID/contacts', list.addContact);

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = router.middleware();
