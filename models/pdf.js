/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* PDF model                                                                                   */
/*                                                                                                */
/* All database modifications go through the model as well as queries                             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const fs = require('fs');
const PDFDocument = require('pdfkit');
const doc = new PDFDocument;
const randomstring = require('randomstring');
const mkdirp = require('mkdirp');
const mail = require('./mail.js');

const testData = {
  userID: 1,
  lists: [ 29, 30 ],
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam sit amet leo arcu. Nulla consequat rutrum ornare. Curabitur in erat condimentum, feugiat eros id, auctor magna. Praesent vehicula magna diam. Maecenas id fermentum velit. Nulla non dui urna. Aenean quis consequat est. Vivamus lorem felis, sodales in lectus eu, efficitur vestibulum magna. Praesent laoreet diam dui, quis luctus nisi placerat ut. Pellentesque pharetra tincidunt dui ut eleifend.\n' +
        '\n' +
        'Morbi tortor risus, egestas at felis et, accumsan convallis ex. Maecenas lacus magna, consectetur eu scelerisque sit amet, elementum id sapien. Aenean suscipit ex consectetur ligula eleifend, et condimentum tellus cursus. Morbi sollicitudin non eros quis porttitor. Duis mi nisi, sagittis fermentum ipsum quis, pellentesque viverra nisl. Nulla eget turpis eu neque iaculis egestas. Donec maximus ornare diam, ut lacinia diam pulvinar ac. Sed felis velit, dapibus eu aliquet nec, tempor quis tortor.\n' +
        '\n' +
        'Maecenas ac dictum lectus. Cras in odio tortor. Donec non elementum nulla. Mauris at tempor dolor, tempor tempor nisl. Cras eros diam, venenatis ut felis vel, malesuada dictum sem. Vivamus magna erat, condimentum in neque non, scelerisque fermentum sem. Phasellus tellus urna, tristique non massa ac, dignissim imperdiet ex. Integer ultricies lacus nunc, ornare pellentesque purus posuere scelerisque. Donec blandit fringilla urna, nec convallis quam venenatis eget. Mauris dapibus commodo maximus. Cras blandit porttitor odio ultricies luctus. Donec at neque a nisi porttitor sollicitudin id sed est. Etiam vel cursus metus. In mi velit, finibus ut diam a, sagittis aliquam felis. Maecenas vel nulla pharetra est vehicula interdum.\n' +
        '\n' +
        'Quisque semper, mi vel venenatis efficitur, erat ex vehicula urna, a suscipit massa est ut nibh. Vestibulum justo quam, consequat vel vehicula et, consequat in ligula. Nam vestibulum neque interdum scelerisque euismod. Suspendisse vel sapien at nibh auctor ultrices vitae a magna. Pellentesque interdum risus nunc, in elementum neque ultrices eget. Interdum et malesuada fames ac ante ipsum primis in faucibus. Donec tellus erat, placerat et imperdiet quis, convallis sed nulla. Ut egestas rhoncus placerat. Aenean blandit velit porta turpis malesuada facilisis.\n' +
        '\n' +
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nibh libero, auctor vel lacus sed, dictum consectetur leo. Mauris tristique, dolor ac finibus hendrerit, ligula massa semper sapien, a eleifend quam dui sit amet enim. Aliquam a fringilla ligula. Curabitur facilisis tristique nibh, vitae convallis elit blandit id. Quisque accumsan ligula massa, quis dignissim felis egestas vitae. Quisque egestas enim et aliquet vehicula. Aenean in ex neque. Pellentesque nisl est, aliquet pulvinar ornare nec, dapibus a risus.',
  images: [ { img: 'decrypt/1/IMG_0157.JPG', caption: 'caption is here' }, { img: 'decrypt/1/IMG_0157.JPG', caption: 'caption 2 is here' }, { img: 'decrypt/1/IMG_0157.JPG', caption: 'caption 3 is here' }, { img: 'decrypt/1/IMG_0157.JPG', caption: 'caption is here' }, { img: 'decrypt/1/IMG_0157.JPG', caption: 'caption 2 is here' }, { img: 'decrypt/1/IMG_0157.JPG', caption: 'caption 3 is here' }, { img: 'decrypt/1/IMG_0157.JPG', caption: 'caption is here 7' }, { img: 'decrypt/1/IMG_0157.JPG', caption: 'caption 2 is here' }, { img: 'decrypt/1/IMG_0157.JPG', caption: 'caption 3 is here' } ],
};

// The first page of the document, includes search and client info
class Pdf {

  static testPDF(ctx) {
    const filename = Pdf.makePDF(testData);
    mail.send(filename, testData);
    ctx.body = 'success';
  }

  static makePDF(data){
    const dir = __dirname + '/pdf';
    mkdirp.sync(dir);

    const filename = dir + '/' + randomstring.generate(25);

    doc.pipe(fs.createWriteStream(filename));

    //Text Here
    doc.text(data.text);
    doc.addPage();
    let top = 20;
    let left = 25;
    for(const img of data.images){
      console.log(top, left);
      doc.image(img.img, left, top, { height: 200, left: 100 } )
          .text(img.caption + top, left, top + 205);
      if (left > 25) {
        left = 25;
        if (top < 400){
          top += 230;
        } else {
          console.log('new page');
          doc.addPage();
          top = 20;
        }

      } else {
        left = 315;
      }
    }

    doc.end();
    return filename;
  }

}

module.exports = Pdf;
