import * as XLSX from 'xlsx';
import { RegisteredStudent, VoterRegisterImportRow } from '../types/election';

export interface ParseResult {
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: VoterRegisterImportRow[];
  validStudents: RegisteredStudent[];
  duplicateStudentNumbers: string[];
}

/**
 * Parses either an Excel (.xlsx, .xls) or CSV file.
 * Expects columns: Name, Surname, Student No (or Student Number / StudentId), Residence (optional if uploading to a specific residence).
 * Ensures Student Number is preserved as a string (keeping leading zeros).
 */
export async function parseVoterRegisterFile(
  file: File,
  targetResidenceId: string,
  targetResidenceName: string,
  existingStudentNumbers: Set<string>
): Promise<ParseResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array', raw: false }); // raw: false ensures strings are formatted without dropping leading zeros
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON array of objects with string values
  const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

  const rows: VoterRegisterImportRow[] = [];
  const validStudents: RegisteredStudent[] = [];
  const seenInBatch = new Set<string>();
  const duplicateStudentNumbers: string[] = [];

  jsonRows.forEach((rawRow, index) => {
    const rowNum = index + 2; // header is row 1
    // Normalize keys (trim and case-insensitive check)
    const normalized: Record<string, string> = {};
    for (const key of Object.keys(rawRow)) {
      const cleanKey = key.trim().toLowerCase();
      normalized[cleanKey] = String(rawRow[key] || '').trim();
    }

    // Extract fields
    const name = normalized['name'] || normalized['first name'] || normalized['firstname'] || '';
    const surname = normalized['surname'] || normalized['last name'] || normalized['lastname'] || '';
    const studentNo = 
      normalized['student no'] || 
      normalized['student number'] || 
      normalized['studentno'] || 
      normalized['student_number'] || 
      normalized['student id'] || 
      normalized['studentid'] || '';
    const residenceField = 
      normalized['residence'] || 
      normalized['res'] || 
      normalized['hall'] || 
      targetResidenceName;

    const errors: string[] = [];

    // Validation 1: Required Name
    if (!name) {
      errors.push('Missing First Name');
    }

    // Validation 2: Required Surname
    if (!surname) {
      errors.push('Missing Surname');
    }

    // Validation 3: Required Student Number
    if (!studentNo) {
      errors.push('Missing Student Number');
    } else {
      // Must be numeric string
      if (!/^\d+$/.test(studentNo)) {
        errors.push(`Invalid Student Number format: "${studentNo}" (must be digits only)`);
      }

      // Check duplicates within batch
      if (seenInBatch.has(studentNo)) {
        errors.push(`Duplicate student number in file: "${studentNo}"`);
        if (!duplicateStudentNumbers.includes(studentNo)) {
          duplicateStudentNumbers.push(studentNo);
        }
      } else {
        seenInBatch.add(studentNo);
      }

      // Check duplicate against existing approved register in other residences
      if (existingStudentNumbers.has(studentNo)) {
        errors.push(`Conflict: Student "${studentNo}" already exists in an approved register`);
      }
    }

    // Validation 4: Residence assignment check if specified in row
    if (residenceField && residenceField.toLowerCase() !== targetResidenceName.toLowerCase()) {
      errors.push(`Residence mismatch: File specifies "${residenceField}" but uploading to "${targetResidenceName}"`);
    }

    const isValid = errors.length === 0;

    rows.push({
      rowNumber: rowNum,
      name,
      surname,
      studentNumber: studentNo,
      residence: residenceField || targetResidenceName,
      isValid,
      errors,
    });

    if (isValid) {
      validStudents.push({
        id: `stud-${targetResidenceId}-${studentNo}`,
        studentNumber: studentNo,
        name,
        surname,
        fullName: `${name} ${surname}`,
        email: `${studentNo}@dut4life.ac.za`,
        residenceId: targetResidenceId,
        residenceName: targetResidenceName,
        isEligible: true,
        votingStatus: 'Not Voted',
        isDemoData: false,
      });
    }
  });

  return {
    fileName: file.name,
    totalRows: rows.length,
    validRows: validStudents.length,
    invalidRows: rows.length - validStudents.length,
    rows,
    validStudents,
    duplicateStudentNumbers,
  };
}

/**
 * Downloads a CSV error report for a rejected or flagged batch.
 */
export function exportErrorReportCsv(fileName: string, rows: VoterRegisterImportRow[]) {
  const invalidRows = rows.filter(r => !r.isValid);
  if (invalidRows.length === 0) {
    alert('No errors found in this register batch.');
    return;
  }

  const csvContent = [
    ['Row Number', 'Name', 'Surname', 'Student Number', 'Target Residence', 'Validation Errors'].join(','),
    ...invalidRows.map(r => [
      r.rowNumber,
      `"${r.name}"`,
      `"${r.surname}"`,
      `"${r.studentNumber}"`,
      `"${r.residence}"`,
      `"${r.errors.join('; ')}"`,
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Error_Report_${fileName.replace(/\.[^/.]+$/, '')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
