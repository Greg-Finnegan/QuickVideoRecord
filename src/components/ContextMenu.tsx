import React, { useState, useRef, useEffect } from "react";
import Icon from "./Icon";

interface ContextMenuItem {
  label: string;
  onClick: () => void;
  className?: string;
  icon?: React.ReactNode;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  triggerButton?: React.ReactNode;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ items, triggerButton }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (item: ContextMenuItem) => {
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {triggerButton || (
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
            <Icon name="menu" size={18} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[160px] overflow-hidden">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(item)}
              className={`w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap ${
                item.className || ""
              }`}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContextMenu;
