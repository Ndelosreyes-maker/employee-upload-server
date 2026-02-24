import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

const MONDAY_TOKEN = process.env.MONDAY_TOKEN;
const BOARD_ID = process.env.BOARD_ID;
const FILE_COLUMN_ID = process.env.FILE_COLUMN_ID;
const STATUS_COLUMN_ID = process.env.STATUS_COLUMN_ID;

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const itemId = req.body.itemId;

    console.log("File received:", file.originalname);
    console.log("Item ID:", itemId);

    const formData = new FormData();
    formData.append("query", `
      mutation ($file: File!) {
        add_file_to_column (
          item_id: ${itemId},
          column_id: "${FILE_COLUMN_ID}",
          file: $file
        ) {
          id
        }
      }
    `);
    formData.append("file", fs.createReadStream(file.path));

    const response = await fetch("https://api.monday.com/v2/file", {
      method: "POST",
      headers: {
        Authorization: MONDAY_TOKEN
      },
      body: formData
    });

    const result = await response.json();
    console.log("Monday response:", result);

    // 🔥 Update status column
    await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        Authorization: MONDAY_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          mutation {
            change_column_value(
              board_id: ${BOARD_ID},
              item_id: ${itemId},
              column_id: "${STATUS_COLUMN_ID}",
              value: "{\"label\":\"Submitted\"}"
            ) { id }
          }
        `
      })
    });

    fs.unlinkSync(file.path);

    return res.json({
      success: true,
      message: "File uploaded successfully"
    });

  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Upload failed"
    });
  }
});

app.listen(3000, () => console.log("Server running"));
