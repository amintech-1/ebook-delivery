require("dotenv").config();
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
app.get("/test", async (req, res) => {
  try {
    const name = req.query.name || "Jessica Tan";
    const email = req.query.email || "jessica@example.com";
    const orderId = req.query.order || "TEST123";

    await generateWatermarkPDF(
      name,
      email,
      orderId
    );

    res.send(`✅ Test PDF generated for ${name}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Failed to generate PDF");
  }
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
res.json({
  download_url: `${process.env.BASE_URL}/download/${downloadToken}`
});
}); 
app.get("/download/:token", async (req, res) => {
  console.log("🔥 DOWNLOAD ROUTE HIT");

  const token = req.params.token;

  const ordersDir = path.join(__dirname, "orders");
  const files = fs.readdirSync(ordersDir);

  let order = null;

  for (const file of files) {
    const data = JSON.parse(
      fs.readFileSync(path.join(ordersDir, file))
    );

    if (data.downloadToken === token) {
      order = data;
      break;
    }
  }

  if (!order) {
    return res.status(404).send("Invalid download link");
  }

  const pdfPath = path.join(
    __dirname,
    "output",
    `${order.orderId}.pdf`
  );

  if (!fs.existsSync(pdfPath)) {
    return res.status(404).send("File not found");
  }

res.download(
  pdfPath,
  process.env.DOWNLOAD_FILENAME
  );
});
app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running at port ${process.env.PORT || 3000}`);
});