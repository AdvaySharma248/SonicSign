const fs = require('fs/promises');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { getAbsolutePath } = require('../../../storage/localStorage');
const { AppError } = require('../../../utils/AppError');

const pdfService = {
  async getMetadata(filePath) {
    const bytes = await fs.readFile(filePath);

    if (bytes.length < 4 || bytes.slice(0, 4).toString('ascii') !== '%PDF') {
      throw new AppError('Corrupted PDF', 400);
    }

    try {
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      let pageCount = null;
      try {
        pageCount = pdf.getPageCount();
      } catch (err) {
        console.warn(`[PDF Page Count Warning] Failed to get page count for ${filePath}: ${err.message}`);
      }
      return {
        pageCount: pageCount || 1,
        bytes,
        success: true
      };
    } catch (error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('encrypted') || errorMsg.includes('password') || errorMsg.includes('ignoreencryption')) {
        console.warn(`[PDF Encrypted Warning] PDF at ${filePath} is encrypted/password-protected: ${error.message}`);
        return {
          pageCount: 1,
          bytes,
          success: false,
          error: error.message
        };
      }

      throw new AppError('Corrupted PDF', 400);
    }
  },

  async embedSignatures(document, signatures) {
    const bytes = await fs.readFile(getAbsolutePath(document.fileName));
    const pdf = await PDFDocument.load(bytes);

    for (const signature of signatures) {
      const page = pdf.getPage(signature.page - 1);
      const imageBytes = Buffer.from(signature.signatureImage.replace(/^data:image\/png;base64,/, ''), 'base64');
      const image = await pdf.embedPng(imageBytes);
      page.drawImage(image, {
        x: signature.x,
        y: signature.y,
        width: signature.width,
        height: signature.height,
      });
    }

    return Buffer.from(await pdf.save());
  },

  async embedFieldValues(document, fields, values) {
    const bytes = await fs.readFile(getAbsolutePath(document.fileName));
    const pdf = await PDFDocument.load(bytes);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const signatureFont = await pdf.embedFont(StandardFonts.HelveticaOblique);
    const valueByField = new Map(values.map((value) => [value.fieldId.toString(), value]));
    for (const field of fields) {
      const value = valueByField.get(field.id);
      if (!value) continue;
      const page = pdf.getPage(field.page - 1);
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const x = (field.x / 100) * pageWidth;
      const width = (field.width / 100) * pageWidth;
      const height = (field.height / 100) * pageHeight;
      const y = pageHeight - ((field.y / 100) * pageHeight) - height;
      if (field.type === 'signature' && /^data:image\//.test(value.value)) {
        const match = value.value.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
        if (match) {
          const imageBytes = Buffer.from(match[2], 'base64');
          const image = match[1] === 'png' ? await pdf.embedPng(imageBytes) : await pdf.embedJpg(imageBytes);
          page.drawImage(image, { x, y, width, height });
          continue;
        }
      }
      const text = field.type === 'date' && !value.value ? new Date().toLocaleDateString() : value.value;
      const drawFont = field.type === 'signature' ? signatureFont : font;
      page.drawText(String(text), {
        x: x + 3,
        y: y + Math.max(2, height / 3),
        size: Math.min(18, Math.max(8, height * 0.55)),
        font: drawFont,
        color: rgb(0.05, 0.1, 0.2),
        maxWidth: Math.max(1, width - 6),
      });
    }
    return Buffer.from(await pdf.save());
  },
};

module.exports = { pdfService };
