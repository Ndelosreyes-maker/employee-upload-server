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
