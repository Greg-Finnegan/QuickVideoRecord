import React, { useState } from "react";

interface EditableFilenameProps {
  filename: string;
  onSave: (newFilename: string) => void;
  variant?: "default" | "large";
}

const EditableFilename: React.FC<EditableFilenameProps> = ({
  filename,
  onSave,
  variant = "default",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editedFilename, setEditedFilename] = useState(filename);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditedFilename(filename);
  };

  const handleSave = () => {
    if (editedFilename.trim() && editedFilename !== filename) {
      onSave(editedFilename.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedFilename(filename);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const textSizeClass = variant === "large" ? "text-lg" : "text-sm";
  const inputPaddingClass = variant === "large" ? "px-3 py-2" : "px-2 py-1";

  if (isEditing) {
    return (
      <input
        type="text"
        value={editedFilename}
        onChange={(e) => setEditedFilename(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        onClick={(e) => e.stopPropagation()}
        className={`m-0 mb-2 ${textSizeClass} font-medium bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-blue-500 rounded ${inputPaddingClass} focus:outline-none focus:ring-2 focus:ring-blue-500 w-[80%]`}
        autoFocus
      />
    );
  }

  return (
    <div
      className="relative inline-flex items-center gap-2 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <h3
        className={`m-0 mb-2 ${textSizeClass} font-medium text-slate-900 dark:text-slate-100 break-words hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
      >
        {filename}
      </h3>
      {isHovered && (
        <span
          className={`absolute -right-6 top-0 text-slate-400 dark:text-slate-500 ${textSizeClass}`}
        >
          ✎
        </span>
      )}
    </div>
  );
};

export default EditableFilename;
