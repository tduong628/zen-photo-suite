/**
 * Deluxe Photo Editor — Gallery backend
 * Saves generated images to a Drive folder and logs them in this spreadsheet.
 *
 * Deploy: Extensions > Apps Script > Deploy > New deployment > Web app
 *   - Execute as: Me
 *   - Who has access: Anyone
 */

var SPREADSHEET_ID = '1yMCjmDz0pDc54mDPslkfVV6R6E6xUjOTefx3m-Z-EqA';
var SHEET_NAME = 'Gallery';
var FOLDER_NAME = 'Zen Photo Editor Gallery';

function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(FOLDER_NAME);
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Tool', 'Style', 'Prompt', 'Caption', 'FileId', 'ImageUrl', 'ThumbnailUrl']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action === 'delete' && data.fileId) {
      return deleteItem(data.fileId);
    }

    var folder = getOrCreateFolder();
    var bytes = Utilities.base64Decode(data.imageBase64);
    var fileName = (data.tool || 'image') + '_' + new Date().toISOString().replace(/[:.]/g, '-') + '.png';
    var blob = Utilities.newBlob(bytes, data.mimeType || 'image/png', fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var imageUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;
    var thumbnailUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w800';

    var sheet = getOrCreateSheet();
    sheet.appendRow([
      new Date(),
      data.tool || '',
      data.style || '',
      data.prompt || '',
      data.caption || '',
      fileId,
      imageUrl,
      thumbnailUrl
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', fileId: fileId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteItem(fileId) {
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
  } catch (e) { /* file may already be gone */ }

  var sheet = getOrCreateSheet();
  var values = sheet.getDataRange().getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    if (values[i][5] === fileId) {
      sheet.deleteRow(i + 1);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    var sheet = getOrCreateSheet();
    var values = sheet.getDataRange().getValues();
    var items = [];
    for (var i = 1; i < values.length; i++) {
      items.push({
        timestamp: values[i][0],
        tool: values[i][1],
        style: values[i][2],
        prompt: values[i][3],
        caption: values[i][4],
        fileId: values[i][5],
        imageUrl: values[i][6],
        thumbnailUrl: values[i][7]
      });
    }
    items.reverse(); // newest first
    return ContentService.createTextOutput(JSON.stringify(items))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
