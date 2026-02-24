import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

const mondayToken = process.env.MONDAY_TOKEN;

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const itemId = req.body.itemId;
    const columnId = req.body.columnId;
    const filePath = req.file.path;

    const query = `
      mutation ($file: File!) {
        add_file_to_column(
          item_id: ${itemId},
          column_id: "${columnId}",
          file: $file
        ) { id }
      }
    `;

    const formData = new FormData();
    formData.append("query", query);
    formData.append("variables[file]", fs.createReadStream(filePath));

    const response = await fetch("https://api.monday.com/v2/file", {
      method: "POST",
      headers: { Authorization: mondayToken },
      body: formData
    });

    const result = await response.json();
    console.log(result);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Upload failed");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
