/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  User routes                                                                                  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')(); // router middleware for koa
const list  = require('../models/list.js');

router.get('/lists', list.getListsWithContacts);
router.post('/lists', list.createList);
router.get('/lists/:listID', list.getListDetails);
router.put('/lists/:listID', list.updateList);
router.delete('/lists/:listID', list.deleteList);
router.get('/lists/:listID/contacts', list.getContacts);
router.post('/lists/:listID/contacts', list.addContact);
router.put('/lists/:listID/contacts/:contactID', list.updateContact);
router.delete('/lists/:listID/contacts/:contactID', list.deleteContact);

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = router.middleware();
