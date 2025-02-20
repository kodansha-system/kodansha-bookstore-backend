import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const EXCEL_FILE_PATH = path.join(__dirname, 'translations.xlsx');
const JSON_OUTPUT_PATH = path.join(__dirname);

function setNestedKey(obj: any, keyPath: string, value: string) {
  const keys = keyPath.split('.');
  let current = obj;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
    } else {
      current[key] = current[key] || {};
      current = current[key];
    }
  });
}

export function loadTranslationsFromExcel() {
  const workbook = XLSX.readFile(EXCEL_FILE_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const translations: Record<string, any> = {};

  sheet.forEach((row: any) => {
    const key = row['key'];
    Object.keys(row).forEach((lang) => {
      if (lang !== 'key') {
        if (!translations[lang]) translations[lang] = {};
        setNestedKey(translations[lang], key, row[lang]);
      }
    });
  });

  Object.keys(translations).forEach((lang) => {
    const langDir = path.join(JSON_OUTPUT_PATH, lang);

    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(langDir, `core.json`),
      JSON.stringify(translations[lang], null, 2),
    );
  });
}

loadTranslationsFromExcel();
