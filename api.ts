import { DashboardData } from './types';

/**
 * --- GOOGLE APPS SCRIPT CODE (COPY & PASTE TO YOUR SHEET) ---
 * 
 * 1. Create a new Google Sheet.
 * 2. Extensions > Apps Script.
 * 3. Paste the code below into Code.gs.
 * 4. Deploy > New Deployment > Select "Web app".
 * 5. Description: "Dashboard API", Execute as: "Me", Who has access: "Anyone".
 * 6. Click "Deploy" and copy the "Web App URL".
 * 
 * Code.gs:
 * -----------------------------------------------------------
 * function doGet(e) {
 *   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Data');
 *   // We store the entire JSON in cell A1 for simplicity and flexibility
 *   const data = sheet.getRange('A1').getValue();
 *   
 *   let result = {};
 *   if (data && data !== "") {
 *     try {
 *       result = JSON.parse(data);
 *     } catch (err) {
 *       result = { error: "Invalid JSON in sheet" };
 *     }
 *   }
 *   
 *   return ContentService.createTextOutput(JSON.stringify(result))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 * 
 * function doPost(e) {
 *   try {
 *     // Handle CORS for browser fetch
 *     // Note: e.postData.contents contains the stringified JSON
 *     const payload = e.postData.contents;
 *     
 *     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Data');
 *     
 *     // Clear previous data and set new JSON
 *     sheet.getRange('A1').setValue(payload);
 *     // Update timestamp in B1 just for visibility
 *     sheet.getRange('B1').setValue(new Date());
 *     
 *     return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *       
 *   } catch (err) {
 *     return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 * -----------------------------------------------------------
 */

export const fetchFromSheet = async (url: string): Promise<DashboardData | null> => {
  console.log(`[API] Fetching from: ${url}`);
  try {
    const response = await fetch(url);
    console.log(`[API] Fetch response status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[API] Fetch failed. Status: ${response.status}, Body: ${text}`);
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    console.log(`[API] Fetch raw response:`, text.substring(0, 100) + "..."); // Log first 100 chars

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error(`[API] JSON Parse Error. Raw text: ${text}`, e);
      throw new Error("Invalid JSON response from GAS");
    }

    // Check if the returned object is empty (new sheet)
    if (Object.keys(data).length === 0) {
      console.log("[API] Received empty data object (New Sheet)");
      return null;
    }

    return data as DashboardData;
  } catch (error) {
    console.error("[API] Failed to fetch from sheet", error);
    throw error;
  }
};

export const saveToSheet = async (url: string, data: DashboardData): Promise<void> => {
  console.log(`[API] Saving to: ${url}`);
  try {
    // Google Apps Script Web Apps require strict CORS handling.
    // often 'no-cors' mode is used for simple fire-and-forget, but for data integrity
    // standard POST with text/plain (to avoid preflight OPTIONS issues in some GAS setups) is recommended.

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      // Important: GAS handles text/plain easier without complex CORS preflight
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    console.log(`[API] Save response status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[API] Save failed. Status: ${response.status}, Body: ${text}`);
      throw new Error(`Save request failed: ${response.status}`);
    }

    const text = await response.text();
    console.log(`[API] Save raw response:`, text);

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error(`[API] Save JSON Parse Error. Raw text: ${text}`, e);
      throw new Error("Invalid JSON response from GAS save");
    }

    if (result.status === 'error') {
      console.error(`[API] GAS returned error: ${result.message}`);
      throw new Error(result.message);
    }
    console.log("[API] Save successful");
  } catch (error) {
    console.error("[API] Failed to save to sheet", error);
    throw error;
  }
};
