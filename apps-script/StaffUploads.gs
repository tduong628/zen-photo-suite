/**
 * Zen Staff Uploads — staff photo intake for the social media pipeline.
 *
 * doGet (no params)      → mobile upload form (HTML)
 * doGet ?list=1          → JSON: all uploads, newest first
 * doGet ?fileId=X        → JSON: { base64, mimeType } of the stored image
 * doPost {upload}        → save image to Drive + row in 'Uploads' sheet (status PENDING)
 * doPost {action:status} → update a row's status (PROCESSED / SKIPPED)
 *
 * Deploy: Web app · Execute as Me · Anyone
 */

var SPREADSHEET_ID = '1yMCjmDz0pDc54mDPslkfVV6R6E6xUjOTefx3m-Z-EqA';
var SHEET_NAME = 'Uploads';
var FOLDER_NAME = 'Zen Staff Uploads';

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
    sheet.appendRow(['Timestamp', 'Staff', 'Salon', 'Service', 'Note', 'Status', 'FileId', 'ThumbnailUrl']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveUpload(data) {
  var folder = getOrCreateFolder();
  var bytes = Utilities.base64Decode(data.imageBase64);
  var fileName = 'staff_' + (data.staffName || 'unknown').replace(/\W+/g, '') + '_' +
    new Date().toISOString().replace(/[:.]/g, '-') + '.jpg';
  var blob = Utilities.newBlob(bytes, data.mimeType || 'image/jpeg', fileName);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var fileId = file.getId();

  getOrCreateSheet().appendRow([
    new Date(),
    data.staffName || '',
    data.salon || '',
    data.serviceType || '',
    data.note || '',
    'PENDING',
    fileId,
    'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w800'
  ]);
  return { status: 'ok', fileId: fileId };
}

function updateStatus(fileId, status) {
  var sheet = getOrCreateSheet();
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][6] === fileId) {
      sheet.getRange(i + 1, 6).setValue(status);
    }
  }
  return { status: 'ok' };
}

function listUploads() {
  var values = getOrCreateSheet().getDataRange().getValues();
  var items = [];
  for (var i = 1; i < values.length; i++) {
    items.push({
      timestamp: values[i][0],
      staffName: values[i][1],
      salon: values[i][2],
      serviceType: values[i][3],
      note: values[i][4],
      status: values[i][5],
      fileId: values[i][6],
      thumbnailUrl: values[i][7]
    });
  }
  items.reverse();
  return items;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var result;
    if (data.action === 'status') {
      result = updateStatus(data.fileId, data.status || 'PROCESSED');
    } else {
      result = saveUpload(data);
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    if (e.parameter.list) {
      return ContentService.createTextOutput(JSON.stringify(listUploads()))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (e.parameter.fileId) {
      var file = DriveApp.getFileById(e.parameter.fileId);
      var blob = file.getBlob();
      return ContentService.createTextOutput(JSON.stringify({
        base64: Utilities.base64Encode(blob.getBytes()),
        mimeType: blob.getContentType()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    return HtmlService.createHtmlOutput(UPLOAD_FORM_HTML)
      .setTitle('Zen Nail Spa — Staff Photo Upload')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

var UPLOAD_FORM_HTML = '<!DOCTYPE html><html><head><style>' +
  '*{box-sizing:border-box;margin:0;padding:0}' +
  'body{font-family:-apple-system,system-ui,sans-serif;background:#FDF4F9;color:#3b1f30;padding:20px;max-width:480px;margin:0 auto}' +
  'h1{font-size:1.3rem;margin:14px 0 2px}' +
  '.sub{font-size:.8rem;color:#9d6b85;margin-bottom:18px}' +
  'label{display:block;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9d6b85;margin:14px 0 6px}' +
  'input,select,textarea{width:100%;padding:12px;border:1px solid #ecd5e3;border-radius:12px;font-size:1rem;background:#fff}' +
  'textarea{resize:none;height:70px}' +
  '.photo-box{width:100%;aspect-ratio:4/3;border:2px dashed #e3b8cf;border-radius:16px;background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#be185d;font-weight:600;cursor:pointer;overflow:hidden;position:relative}' +
  '.photo-box img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}' +
  'button{width:100%;margin-top:20px;padding:15px;border:0;border-radius:14px;background:#be185d;color:#fff;font-size:1.05rem;font-weight:700;cursor:pointer}' +
  'button:disabled{opacity:.5}' +
  '.ok{background:#dcfce7;color:#166534;padding:14px;border-radius:12px;margin-top:16px;text-align:center;font-weight:600;display:none}' +
  '.err{background:#fee2e2;color:#991b1b;padding:14px;border-radius:12px;margin-top:16px;text-align:center;font-weight:600;display:none}' +
  '.seg{display:flex;gap:8px}' +
  '.seg button{margin-top:0;padding:11px 0;font-size:.9rem;background:#fff;color:#9d6b85;border:1px solid #ecd5e3}' +
  '.seg button.on{background:#be185d;color:#fff;border-color:#be185d}' +
  '</style></head><body>' +
  '<h1>💅 Staff Photo Upload</h1>' +
  '<div class="sub">Snap your best work — it goes straight to the salon’s social media pipeline.</div>' +
  '<div class="photo-box" onclick="document.getElementById(\'f\').click()">' +
  '<span id="ph">📸 Tap to take / choose photo</span><img id="prev" style="display:none">' +
  '</div>' +
  '<input type="file" id="f" accept="image/*" capture="environment" style="display:none">' +
  '<label>Your name</label><input id="staff" placeholder="e.g. Kim">' +
  '<label>Salon</label><div class="seg" id="salonSeg">' +
  '<button type="button" class="on" data-v="Zen Nail Spa">Deluxe (Cary)</button>' +
  '<button type="button" data-v="Zen Nail Spa">Zen (Durham)</button></div>' +
  '<label>Service type</label><select id="svc">' +
  '<option>Nails</option><option>Pedicure</option><option>Nail Art</option><option>Waxing</option><option>Kids</option><option>Other</option></select>' +
  '<label>Note (optional)</label><textarea id="note" placeholder="e.g. chrome french tips for a wedding"></textarea>' +
  '<button id="send" disabled>Upload Photo</button>' +
  '<div class="ok" id="ok">✅ Uploaded! Thank you — you can send another.</div>' +
  '<div class="err" id="err"></div>' +
  '<script>' +
  'var b64=null,salon="Zen Nail Spa";' +
  'document.querySelectorAll("#salonSeg button").forEach(function(b){b.onclick=function(){' +
  'document.querySelectorAll("#salonSeg button").forEach(function(x){x.classList.remove("on")});' +
  'b.classList.add("on");salon=b.dataset.v;};});' +
  'document.getElementById("f").onchange=function(ev){var file=ev.target.files[0];if(!file)return;' +
  'var r=new FileReader();r.onload=function(e){var img=new Image();img.onload=function(){' +
  'var MAX=1600,w=img.width,h=img.height;if(w>MAX||h>MAX){var s=MAX/Math.max(w,h);w=Math.round(w*s);h=Math.round(h*s);}' +
  'var c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);' +
  'var d=c.toDataURL("image/jpeg",0.9);b64=d.split(",")[1];' +
  'var p=document.getElementById("prev");p.src=d;p.style.display="block";' +
  'document.getElementById("ph").style.display="none";' +
  'document.getElementById("send").disabled=false;};img.src=e.target.result;};r.readAsDataURL(file);};' +
  'document.getElementById("send").onclick=function(){var btn=this;btn.disabled=true;btn.textContent="Uploading…";' +
  'document.getElementById("ok").style.display="none";document.getElementById("err").style.display="none";' +
  'google.script.run.withSuccessHandler(function(){' +
  'document.getElementById("ok").style.display="block";btn.textContent="Upload Photo";' +
  'b64=null;document.getElementById("prev").style.display="none";document.getElementById("ph").style.display="";' +
  'document.getElementById("note").value="";document.getElementById("f").value="";btn.disabled=true;' +
  '}).withFailureHandler(function(e){' +
  'var er=document.getElementById("err");er.textContent="Upload failed: "+e.message;er.style.display="block";' +
  'btn.disabled=false;btn.textContent="Upload Photo";' +
  '}).saveUpload({imageBase64:b64,mimeType:"image/jpeg",staffName:document.getElementById("staff").value,' +
  'salon:salon,serviceType:document.getElementById("svc").value,note:document.getElementById("note").value});};' +
  '</script></body></html>';
