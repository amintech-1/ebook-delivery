const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, degrees, StandardFonts } = require("pdf-lib");

async function generateWatermarkPDF(name, email, orderId) {
  const masterPath = path.join(__dirname, "..", "ebooks", "master.pdf");
  const outputPath = path.join(
    __dirname,
    "..",
    "output",
    `${orderId}.pdf`
  );

  const existingPdfBytes = fs.readFileSync(masterPath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    page.drawText(email, {
      x: width / 6,
      y: height / 2,
      size: 20,
      font,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.15,
      rotate: degrees(45),
    });

   page.drawText(`Licensed To:`, {
  x: 30,
  y: 34,
  size: 8,
  font,
  color: rgb(0.4, 0.4, 0.4),
});

page.drawText(name, {
  x: 30,
  y: 20,
  size: 11,
  font,
  color: rgb(0.2, 0.2, 0.2),
});
  }

  const pdfBytes = await pdfDoc.save();

  fs.writeFileSync(outputPath, pdfBytes);

  console.log("✅ Watermarked PDF saved:", outputPath);

  return outputPath;
}

module.exports = {
  generateWatermarkPDF,
};