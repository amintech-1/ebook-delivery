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

app.get("/redeem", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ms">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dapatkan Ebook Berlesen</title>

<style>
body{
margin:0;
font-family:Arial,sans-serif;
background:#0b1736;
display:flex;
justify-content:center;
align-items:center;
height:100vh;
}

.box{
background:white;
width:420px;
max-width:90%;
padding:35px;
border-radius:15px;
text-align:center;
box-shadow:0 15px 40px rgba(0,0,0,.25);
}

input{
width:100%;
padding:14px;
margin-top:18px;
font-size:16px;
border:1px solid #ccc;
border-radius:8px;
box-sizing:border-box;
}

button{
margin-top:20px;
width:100%;
padding:14px;
background:#0d6efd;
color:white;
border:none;
border-radius:8px;
font-size:16px;
cursor:pointer;
}

button:hover{
background:#0b5ed7;
}

.note{
margin-top:18px;
font-size:13px;
color:#666;
line-height:1.6;
}
</style>

</head>

<body>

<div class="box">

<h2>📱 Dapatkan Ebook Berlesen Anda</h2>

<p>
Sila masukkan <b>email yang digunakan semasa membuat pembelian di SociaBuzz.</b>
</p>

<form action="/verify" method="GET">

<input
type="email"
name="email"
placeholder="contoh@gmail.com"
required>

<button>
📥 Dapatkan Ebook Saya
</button>

</form>

<div class="note">

⚠️ Pastikan anda memasukkan <b>alamat email</b> (contoh@gmail.com), <b>bukan alamat rumah</b>.

<br><br>

Email ini digunakan untuk mengesahkan pembelian anda sebelum ebook berlesen dijana.

</div>

</div>

</body>
</html>
`);
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

app.get("/verify", (req, res) => {

const email = req.query.email;

if(!email){

return res.send("Sila masukkan email.");

}

const ordersDir = path.join(__dirname,"orders");

const files = fs.readdirSync(ordersDir);

let foundOrder = null;

for(const file of files){

const order = JSON.parse(

fs.readFileSync(path.join(ordersDir,file))

);

if(order.buyerEmail.toLowerCase()===email.toLowerCase()){

foundOrder = order;

break;

}

}

if(!foundOrder){

return res.send(`
<h2>Email tidak dijumpai.</h2>

<p>

Pastikan anda menggunakan email yang sama seperti semasa membuat pembayaran di SociaBuzz.

</p>
`);

}

res.redirect(

`/download/${foundOrder.downloadToken}`

);

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