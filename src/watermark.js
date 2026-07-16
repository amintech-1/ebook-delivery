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

    page.drawText(
  `LICENSED COPY\n\n${name}\n${email}\n\nOrder #${orderId}`,
  {
    x: width / 5,
    y: height / 2,
    size: 20,
    font,
    color: rgb(0.7, 0.7, 0.7),
    opacity: 0.09,
    rotate: degrees(45),
    lineHeight: 28,
  }
);

   page.drawText("Licensed Copy", {
  x: 30,
  y: 38,
  size: 9,
  font,
  color: rgb(0.35, 0.35, 0.35),
});

page.drawText(name, {
  x: 30,
  y: 24,
  size: 11,
  font,
  color: rgb(0.15, 0.15, 0.15),
});

page.drawText(`Order #${orderId}`, {
  x: 30,
  y: 12,
  size: 8,
  font,
  color: rgb(0.45, 0.45, 0.45),
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