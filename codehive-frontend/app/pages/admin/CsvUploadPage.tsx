import { useState, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { AuthService } from "~/services";
import type { CsvBulkRegisterResponse } from "~/types";

export function CsvUploadPage() {
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CsvBulkRegisterResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "text/csv") {
      setFile(selected);
      setErrorMessage("");
    } else {
      setFile(null);
      setErrorMessage("Please select a valid CSV file.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setResult(null);
    setErrorMessage("");

    try {
      const response = await AuthService.uploadCsv(file);
      setResult(response.data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setErrorMessage(message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      {/* Top bar */}
      <header className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk User Registration</h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* CSV Format Info */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Expected CSV Format</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            The CSV file should contain no header row. Each row must have 6 columns in this order:
          </p>
          <div className="bg-gray-50 dark:bg-dark-card rounded-xl p-4 font-mono text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
            <p className="text-gray-400 dark:text-gray-500 mb-1"># role, name, fatherLastName, motherLastName, enrollmentNumber, email</p>
            <p>STUDENT,Juan,García,López,2021630001,juan@example.com</p>
            <p>TEACHER,María,Hernández,Pérez,2021630002,maria@example.com</p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            Valid roles: STUDENT, TEACHER, ADMIN. Maximum 1500 records per upload.
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload CSV File</h2>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
            <svg className="mx-auto w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer text-azure dark:text-yellow hover:underline font-medium"
            >
              Choose a file
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">or drag and drop a .csv file</p>
            {file && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 font-medium">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {errorMessage && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || isLoading}
            className="w-full mt-4 btn-primary py-3 text-base disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </div>
            ) : (
              "Upload & Register Users"
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Results</h2>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-dark-card rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.totalProcessed}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Processed</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.successCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Succeeded</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{result.errorCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Errors:</h3>
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <li key={i} className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-lg">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
