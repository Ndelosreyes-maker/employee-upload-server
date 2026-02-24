import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

const MONDAY_TOKEN = process.env.MONDAY_TOKEN;
const BOARD_ID = process.env.BOARD_ID;

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const itemId = req.body.itemId;
    const columnId = req.body.columnId;

    console.log("Uploading file:", file.originalname);
    console.log("Item:", itemId);
    console.log("Column:", columnId);

    const formData = new FormData();
    formData.append("query", `
      mutation ($file: File!) {
        add_file_to_column (
          item_id: ${itemId},
          column_id: "${columnId}",
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

    fs.unlinkSync(file.path);

    return res.json({
      success: true,
      message: "Uploaded successfully"
    });

  } catch (err) {
    console.error(err);
    return res.json({
      success: false,
      message: "Upload failed"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
