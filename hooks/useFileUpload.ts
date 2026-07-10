"use client";

// ⚠️ File upload — not yet implemented (UI only, no actual upload logic)

import { useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type UseFileUploadResult = {
  fileName: string;
  fileError: string;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function useFileUpload(): UseFileUploadResult {
  const [fileName, setFileName] = useState("Choose File...");
  const [fileError, setFileError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;

    if (!file) {
      setFileName("Choose File...");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError("ขนาดไฟล์ต้องไม่เกิน 5 MB");
      try { e.target.value = ""; } catch (_err) {}
      setFileName("Choose File...");
      return;
    }

    setFileName(file.name);
  };

  return { fileName, fileError, handleFileChange };
}
