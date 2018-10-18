/* - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Route to handle creation of PDF files from the system   */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')(); // router middleware for koa
const pdf = require('../models/pdf');

//router.get('/pdf/:id', pdf.doPDF);
router.get('/testpdf', pdf.testPDF);


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
module.exports = router.middleware();
