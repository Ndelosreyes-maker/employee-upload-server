import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

const MONDAY_TOKEN = process.env.MONDAY_TOKEN;

// ===============================
// UPLOAD TO MONDAY
// ===============================
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { itemId, columnId } = req.body;
    const file = req.file;

    console.log("Uploading file:", file.originalname);
    console.log("Item:", itemId);
    console.log("Column:", columnId);

    // GraphQL mutation
    const operations = JSON.stringify({
      query: `
        mutation ($file: File!) {
          add_file_to_column(
            item_id: ${itemId},
            column_id: "${columnId}",
            file: $file
          ) {
            id
          }
        }
      `,
      variables: { file: null }
    });

    const map = JSON.stringify({
      "0": ["variables.file"]
    });

    const formData = new FormData();
    formData.append("operations", operations);
    formData.append("map", map);
    formData.append("0", fs.createReadStream(file.path));

    // 🚨 CRITICAL: must include formData headers
    const response = await fetch("https://api.monday.com/v2/file", {
      method: "POST",
      headers: {
        Authorization: MONDAY_TOKEN,
        ...formData.getHeaders()
      },
      body: formData
    });

    const result = await response.json();
    console.log("Monday response:", result);

    fs.unlinkSync(file.path);

    if (result.errors) {
      return res.json({ success: false, error: result.errors });
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.json({ success: false, error: err.message });
  }
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
