import React, { useState, useRef, useCallback } from 'react';
import { 
  Bold, Italic, Underline, List, ListOrdered, 
  Link, Image, Code, Quote, Heading1, Heading2, 
  Heading3, AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Type, Palette
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string; // 👈 Add this
  height?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Start typing...",
  height = "200px",
  className = '', // ✅ Default to empty string
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);

  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  }, [executeCommand]);

  const insertImage = useCallback(() => {
    const url = prompt('Enter image URL:');
    if (url) {
      executeCommand('insertImage', url);
    }
  }, [executeCommand]);

  const changeTextColor = useCallback(() => {
    const color = prompt('Enter color (hex, rgb, or name):');
    if (color) {
      executeCommand('foreColor', color);
    }
  }, [executeCommand]);

  const changeBackgroundColor = useCallback(() => {
    const color = prompt('Enter background color (hex, rgb, or name):');
    if (color) {
      executeCommand('backColor', color);
    }
  }, [executeCommand]);

  const toolbarButtons = [
    { icon: Bold, command: 'bold', title: 'Bold' },
    { icon: Italic, command: 'italic', title: 'Italic' },
    { icon: Underline, command: 'underline', title: 'Underline' },
    { icon: Code, command: 'formatBlock', value: 'pre', title: 'Code Block' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', title: 'Quote' },
    { icon: Heading1, command: 'formatBlock', value: 'h1', title: 'Heading 1' },
    { icon: Heading2, command: 'formatBlock', value: 'h2', title: 'Heading 2' },
    { icon: Heading3, command: 'formatBlock', value: 'h3', title: 'Heading 3' },
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
    { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
    { icon: Undo, command: 'undo', title: 'Undo' },
    { icon: Redo, command: 'redo', title: 'Redo' }
  ];

  return (
    <div className={`border border-[#ffffff1a] rounded-lg overflow-hidden bg-[#2b2e31] ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-[#ffffff1a] bg-[#2b2e31] p-2">
        <div className="flex flex-wrap gap-1">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={() => executeCommand(button.command, button.value)}
              className="p-2 hover:bg-[#404040] rounded text-gray-300 hover:text-cyan-400 transition-colors"
              title={button.title}
            >
              <button.icon className="h-4 w-4" />
            </button>
          ))}
          
          {/* Separator */}
          <div className="w-px bg-[#ffffff1a] mx-1" />
          
          {/* Special buttons */}
          <button
            type="button"
            onClick={insertLink}
            className="p-2 hover:bg-[#404040] rounded text-gray-300 hover:text-cyan-400 transition-colors"
            title="Insert Link"
          >
            <Link className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={insertImage}
            className="p-2 hover:bg-[#404040] rounded text-gray-300 hover:text-cyan-400 transition-colors"
            title="Insert Image"
          >
            <Image className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={changeTextColor}
            className="p-2 hover:bg-[#404040] rounded text-gray-300 hover:text-cyan-400 transition-colors"
            title="Text Color"
          >
            <Type className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={changeBackgroundColor}
            className="p-2 hover:bg-[#404040] rounded text-gray-300 hover:text-cyan-400 transition-colors"
            title="Background Color"
          >
            <Palette className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="p-4 text-white bg-[#2b2e31] focus:outline-none min-h-[200px] prose prose-invert max-w-none"
        style={{ height }}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;