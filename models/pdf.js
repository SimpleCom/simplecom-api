/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* PDF model                                                                                   */
/*                                                                                                */
/* All database modifications go through the model as well as queries                             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const fs = require('fs');
const PDFDocument = require('pdfkit');
const dateFormat = require('dateformat');
let doc;
const stateList = [{name: 'Missouri', abbr: 'MO'},{name: 'Minnesota', abbr: 'MN'},{name: 'Nevada', abbr: 'NV'},{name: 'Kentucky', abbr: 'KY'},{name: 'Indiana', abbr: 'IN'}, {name: 'Colorado', abbr: 'CO'}, {name: 'Alabama', abbr: 'AL'}, {name: 'North Carolina', abbr: 'NC'}, {name: 'Georgia', abbr: 'GA'}, {name: 'Illinois', abbr: 'IL'}];
//,{name: 'Louisiana', abbr: 'LA'}
let footerCounter = 1;

async function states(state, id, connection) {
  const columnWidth = 175;
  const columnHeight = 50;
  const columnStart = 75;
  const perPage = 12;

  doc.addPage({margins: {top: 50, bottom: 50, left: 50, right: 50}});
  header();

  doc.fontSize(16);
  doc.text(state.name, 50, columnStart - 20, {
    align: 'left',
    fill: true,
    stroke: true
  });

  const [marks] = await connection.execute('select * from stateResult where scrapeID = ? and state = "' + state.abbr + '"', [id]);

  doc.fontSize(9);
  let counter = 0;
  footerCounter++;
  footer(footerCounter);
  for (const key in marks) {
    doc.fontSize(9);
    if (marks[key].hasOwnProperty('markName')) {
      doc.text(marks[key].markName, 50, columnStart + (columnHeight * counter), {
        align: 'left',
        width: 150,
        height: columnHeight - 5,
        ellipsis: true
      });
    }

    if (marks[key].hasOwnProperty('event')) {
      doc.text(marks[key].event, 205, columnStart + (columnHeight * counter), {
        align: 'left',
        width: 100,

      });
    }

    if (marks[key].hasOwnProperty('ownerName')) {
      doc.text(marks[key].ownerName, 335, columnStart + (columnHeight * counter), {
        align: 'left',
        width: 70,
        height: columnHeight - 5,
        ellipsis: true
      });
    }

    if (marks[key].hasOwnProperty('registrationDate')) {
      doc.text(dateFormat(marks[key].registrationDate, 'mm-dd-yy'), 410, columnStart + (columnHeight * counter), {
        align: 'left',
        width: 80
      });
    }

    if (marks[key].hasOwnProperty('status')) {
      doc.text(marks[key].status, 410, columnStart + (columnHeight * counter) + 15, {
        align: 'left',
        width: 80
      });
    }

    if (counter % perPage === 0 && counter !== 0) {
      doc.addPage({margins: {top: 50, bottom: 50, left: 50, right: 50}});
      header();
      doc.fontSize(16);
      doc.text(state.name, 50, columnStart - 20, {
        align: 'left',
        fill: true,
        stroke: true
      });

      footerCounter++;
      footer(footerCounter);
      counter = 0;
    } else {
      counter += 1;
    }
  }
}

function uspto(marks) {
  const leftColumnPosition = 50;
  const rightColumnPosition = 150;
  const columnHeight = 100;
  const columnSpacing = 25;
  const leftColumnWidth = 100;
  const rightColumnWidth = 425;
  const rowCounterMultiplier = 0.8;
  const imageSpacing = 175;

  doc.addPage({margins: {top: 50, bottom: 50, left: 50, right: 50}});
  header();

  doc.fontSize(16);

  doc.fontSize(10.5);
  footerCounter++;
  footer(footerCounter);

  let rowCounter = 1;

  for (const key in marks) {
    // if (marks[key].hasOwnProperty('image')) {
    //   doc.image('/home/brock/Downloads/logo.jpg', leftColumnPosition, columnHeight + columnSpacing * rowCounter, {
    //     align: 'center',
    //     height: 100,
    //     width: 100
    //   });
    // }

    if (marks[key].hasOwnProperty('name')) {
      doc.text('Word Mark', leftColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].name, rightColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });

      rowCounter += 1 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('type')) {
      doc.text('Type', leftColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].type, rightColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });

      rowCounter += 1 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('serialNumber')) {
      doc.text('Serial Number', leftColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].serialNumber, rightColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });

      rowCounter += 1 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('registrationNumber')) {
      doc.text('Reg. Number', leftColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].registrationNumber, rightColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });

      rowCounter += 1 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('registrationDate')) {
      doc.text('Reg. Date', leftColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].registrationDate, rightColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });

      rowCounter += 1 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('filingDate')) {
      doc.text('Filing Date', leftColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].filingDate, rightColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });

      rowCounter += 1 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('status')) {
      doc.text('Status', leftColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].status, rightColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });

      rowCounter += 1 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('published')) {
      doc.text('Published', leftColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].published, rightColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });

      rowCounter += 1 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('services')) {
      doc.text('Goods and Services', leftColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].services, rightColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth,
        height: 170,
        ellipsis: true
      });

      rowCounter += 9 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('drawingCode')) {
      doc.text('Drawing Code', leftColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].drawingCode, rightColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });

      rowCounter += 1 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('currentBasis')) {
      doc.text('Current Basis', leftColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].currentBasis, rightColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });
    }

    if (marks[key].hasOwnProperty('originalFilingBasis')) {
      doc.text('Original Basis', leftColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].originalFilingBasis, rightColumnPosition + imageSpacing, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });

      rowCounter += 1 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('owner')) {
      doc.text('Owner', leftColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].owner, rightColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });

      rowCounter += 2 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('characters')) {
      doc.text('Characters Claimed', leftColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].characters, rightColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });

      rowCounter += 2 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('assignmentRecorded')) {
      doc.text('Assignment Recorded', leftColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].assignmentRecorded, rightColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });

      rowCounter += 2 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('disclaimer')) {
      doc.text('Disclaimer', leftColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].disclaimer, rightColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });

      rowCounter += 2 * rowCounterMultiplier;
    }

    if (marks[key].hasOwnProperty('register')) {
      doc.text('Register', leftColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: leftColumnWidth,
        fill: true,
        stroke: true
      });

      doc.text(marks[key].register, rightColumnPosition, columnHeight + columnSpacing * rowCounter, {
        align: 'left',
        width: rightColumnWidth
      });
    }

    rowCounter = 1;

    if (footerCounter !== marks.length + 1) {
      doc.addPage({margins: {top: 50, bottom: 30, left: 50, right: 50}});
      header();
      footerCounter++;
      footer(footerCounter);
    }
  }
}

// Adds a header to the top of the current page
function header() {
  doc.fontSize(20);
  doc.text('Registered Artists', 0, 40, {
    align: 'center',
    width: 620
  });
  doc.moveDown(2);
  doc.fontSize(12);
}

// Adds a fixed footer to the bottom of the current page
function footer(counter) {
  doc.fontSize(10.5);
  doc.text(counter.toString(), 75, 720, {
    align: 'center',
  });
  doc.fontSize(12);
}

// The first page of the document, includes search and client info
function splash(term) {
  const clientName = 'Test Professionals, Inc';
  const accountNo = 289347589237;
  const searchTerm = term;
  const searchOptions = 'Active, Abandoned, Cancelled Status';

  doc.image('logo.png', {
    align: 'center',
    height: 100,
    width: 100
  });

  doc.moveUp(6);

  doc.fontSize(20);
  doc.text('Comprehensive Search Report', {
    align: 'right'
  });

  doc.fontSize(12);

  doc.text('Created on February 10, 2017 at 6:17 PM PST', {
    align: 'right'
  });

  doc.moveDown(8);

  doc.fontSize(14);

  doc.text(`Client                               ${clientName}`, {
    align: 'left',
    fill: true,
    stroke: true
  });

  doc.moveDown(1);

  doc.text(`Account No.                     ${accountNo}`, {
    align: 'left',
    fill: true,
    stroke: true
  });

  doc.moveDown(1);

  doc.text(`Search Term                    ${searchTerm}`, {
    align: 'left',
    fill: true,
    stroke: true
  });

  doc.moveDown(1);

  doc.text(`Search Options               ${searchOptions}`, {
    align: 'left',
    fill: true,
    stroke: true
  });

  doc.moveDown(1);
}

class Pdf {

  static async doPDF(id, connection) {
    doc = new PDFDocument;

    const [info] = await connection.execute('select * from scrape where id = ?', [id]);
    const term = info[0].term;

    const [usptoMarks] = await connection.execute('select * from usptoResult where scrapeID = ?', [id]);
    console.log(`'${term}' start pdf`);
    doc.pipe(fs.createWriteStream('search-' + id + '.pdf'));

    // Actually construct the PDF
    header();
    splash(term);
    footer(1);
    uspto(usptoMarks);

    for (const state of stateList) {
      await states(state, id, connection);
    }

    await doc.end();

    console.log(`'${term}' pdf done`);

  }

  static testPDF(id) {

    doc.pipe(fs.createWriteStream('output.pdf'));

    // Actually construct the PDF
    header();
    splash();
    footer(1);
    uspto(usptoMarks);

    for (const state of stateList) {
      states(state);
    }

    doc.end();

  }

}
module.exports = Pdf;
