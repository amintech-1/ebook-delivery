const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PDFDocument, rgb, degrees, StandardFonts } = require("pdf-lib");
const { generateWatermarkPDF } = require("./src/watermark");
const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.send("🚀 Ebook Delivery Server Running");
});
app.post("/webhook", async (req, res) => {

    console.log("========== NEW ORDER ==========");

    console.log(req.body);
    const buyerName = req.body.buyer_name;
const buyerEmail = req.body.buyer_email;
const orderId = req.body.id;
const downloadToken = crypto.randomBytes(24).toString("hex");
const orderData = {
  orderId,
  buyerName,
  buyerEmail,
  downloadToken,
  createdAt: req.body.created_at,
};
const ordersDir = path.join(__dirname, "orders");

if (!fs.existsSync(ordersDir)) {
  fs.mkdirSync(ordersDir, { recursive: true });
}
const orderPath = path.join(
  __dirname,
  "orders",
  `${orderId}.json`
);

fs.writeFileSync(
  orderPath,
  JSON.stringify(orderData, null, 2)
);

console.log("✅ Order saved:", orderPath);
await generateWatermarkPDF(
  buyerName,
  buyerEmail,
  orderId
);

    res.send("OK");
    });
app.get("/download/:token", async (req, res) => {
  console.log("🔥 DOWNLOAD ROUTE HIT");
const token = req.params.token;

const pdfPath = path.join(
  __dirname,
  "output",
  `${orderId}.pdf`
);

if (!fs.existsSync(pdfPath)) {
  return res.status(404).send("File not found");
}

res.download(
  pdfPath,
  "Android Transfer Je Kat Rumah - Licensed Copy.pdf"
);
});
app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});