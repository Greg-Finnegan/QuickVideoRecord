import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { geminiAuth } from "../../utils/geminiAuth";

interface GeminiProfileProps {
  clickable?: boolean;
  showDisconnect?: boolean;
}

const GeminiProfile: React.FC<GeminiProfileProps> = ({
  clickable = true,
  showDisconnect = true,
}) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const tokens = await geminiAuth.getTokens();
      setEmail(tokens?.email || null);
    } catch (err) {
      console.error("Failed to load Gemini profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to disconnect from Gemini?")) {
      await geminiAuth.disconnect();
      // Parent component will handle re-rendering after storage change
    }
  };

  const handleClick = () => {
    if (clickable) {
      navigate("/settings");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full">
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse" />
      </div>
    );
  }

  if (!email) {
    return null;
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full hover:border-slate-400 dark:hover:border-slate-600 transition-all group ${
        clickable ? "cursor-pointer" : ""
      }`}
      title={clickable ? "Go to settings" : undefined}
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
        {email.charAt(0).toUpperCase()}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
          {email}
        </div>
      </div>
      <span className="text-xl">✨</span>
      {showDisconnect && (
        <button
          onClick={handleDisconnect}
          className="ml-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Disconnect from Gemini"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default GeminiProfile;
