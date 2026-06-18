# 구글 앱스 스크립트(GAS) 백엔드 코드 업데이트

`사번성명_RAWDATA` 시트에서 사번과 이름을 대조하여 일치하지 않을 경우 설문을 진행할 수 없도록 차단하는 로직이 추가된 새로운 GAS 코드입니다.
기존 Apps Script 편집기에 아래 코드를 **모두 덮어쓰기** 하신 후, 반드시 **[새 배포]**(New Deployment)를 진행해주세요!

```javascript
function doGet(e) {
  var action = e.parameter.action;
  
  if (action === "check") {
    var empId = String(e.parameter.empId).trim();
    var empName = String(e.parameter.empName).trim();
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ============================================
    // 1. 사번 및 성명 일치 여부 검증 (사번성명_RAWDATA 시트)
    // ============================================
    var rawSheet = ss.getSheetByName("사번성명_RAWDATA");
    var isValid = false;
    var foundId = false;
    
    if (rawSheet) {
      var rawData = rawSheet.getDataRange().getValues();
      
      // i=1 (2행)부터 반복하여 확인
      for (var i = 1; i < rawData.length; i++) {
        var rowId = String(rawData[i][0]).trim();
        var rowName = String(rawData[i][1]).trim();
        
        if (rowId === empId) {
          foundId = true;
          if (rowName === empName) {
            isValid = true;
          }
          break; // 사번을 찾았으므로 루프 종료
        }
      }
      
      // 사번이 존재하지 않는 경우
      if (!foundId) {
        return ContentService.createTextOutput(JSON.stringify({ 
          valid: false, 
          error: "등록되지 않은 사번입니다." 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      // 사번은 존재하나 성명이 틀린 경우
      if (!isValid) {
        return ContentService.createTextOutput(JSON.stringify({ 
          valid: false, 
          error: "사번과 성명이 일치하지 않습니다." 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
    } else {
      return ContentService.createTextOutput(JSON.stringify({ 
        valid: false, 
        error: "'사번성명_RAWDATA' 시트를 찾을 수 없습니다." 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ============================================
    // 2. 중복 참여 여부 확인 (사번성명_RAWDATA가 아닌 시트)
    // ============================================
    var sheets = ss.getSheets();
    var responseSheet = null;
    
    // '사번성명_RAWDATA'가 아닌 첫 번째 시트를 응답 시트로 간주
    for (var k = 0; k < sheets.length; k++) {
      if (sheets[k].getName() !== "사번성명_RAWDATA") {
        responseSheet = sheets[k];
        break;
      }
    }
    
    var exists = false;
    
    if (responseSheet) {
      var data = responseSheet.getDataRange().getValues();
      for (var j = 1; j < data.length; j++) {
        // 혹시 열 순서가 다를 수 있으니 1, 2, 3번째 열 모두에서 사번을 검사 (보통 2번째 열에 위치)
        if (String(data[j][0]).trim() === empId || String(data[j][1]).trim() === empId || String(data[j][2]).trim() === empId) {
          exists = true;
          break;
        }
      }
    }
    
    // 모든 검증 통과 (valid: true) 및 중복 여부 반환
    return ContentService.createTextOutput(JSON.stringify({ 
      valid: true, 
      exists: exists 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // CORS 처리 설정
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.TEXT);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var sheet = null;
    
    // '사번성명_RAWDATA'가 아닌 시트에 데이터 저장
    for (var k = 0; k < sheets.length; k++) {
      if (sheets[k].getName() !== "사번성명_RAWDATA") {
        sheet = sheets[k];
        break;
      }
    }
    
    var data = JSON.parse(e.postData.contents);
    
    // JSON 객체를 1차원 배열로 변환 (appendRow는 배열만 받습니다)
    var rowData = [
      new Date(),       // Timestamp
      data.empId,       // 사번
      data.empName,     // 이름
      data.score,       // 총점 (선택적)
      data.q1 || "",
      data.q2_1 || "",
      data.q2_2 || "",
      data.q3_1 || "",
      data.q3_2 || "",
      data.q4 || "",
      data.q5_1 || "",
      data.q5_2 || "",
      data.q6 || "",
      data.q7 || "",
      data.q8_1 || "",
      data.q8_2 || "",
      data.q9 || ""
    ];
    
    sheet.appendRow(rowData);
    output.setContent("Success");
  } catch(error) {
    output.setContent("Error: " + error.toString());
  }
  
  return output;
}
```
