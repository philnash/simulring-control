const { GoogleSpreadsheet } = require("google-spreadsheet");
const fs = require("fs").promises;

exports.handler = async function (context, event, callback) {
  try {
    const doc = new GoogleSpreadsheet(context.DOCUMENT_ID);
    const credentials = await fs.readFile(
      Runtime.getAssets()[context.GOOGLE_CREDENTIALS].path,
      { encoding: "utf-8" }
    );
    const authJson = JSON.parse(credentials);

    doc.useServiceAccountAuth({
      client_email: authJson.client_email,
      private_key: authJson.private_key,
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    const numbers = rows
      .filter((r) => r["Active?"].toLowerCase() === "yes")
      .map((r) => r.Number)
      .join(",");
    callback(null, numbers);
  } catch (error) {
    if (error.response.status === 404) {
      console.error(
        "Could not find your Google Sheets document. Please ensure DOCUMENT_ID is correct."
      );
    }
    if (error.response && error.response.data && error.response.data.error) {
      const errorData = error.response.data.error;
      console.error(
        `${errorData.status} [${errorData.code}]: ${errorData.message}`
      );
    }
    callback(error);
  }
};
