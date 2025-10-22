import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

type CopyToClipboardProps = {
  text: string;
  iconSize?: number;
  className?: string;
};

export default function CopyToClipboard({ text, iconSize = 16, className = '' }: CopyToClipboardProps) {
  const { translations } = useLanguage(); // 👈 Get translations

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // Fallback for Clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      // Success toast
      toast.success(translations['Copied']);
    } catch (err) {
      console.error('Clipboard error:', err);
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-cyan-400 hover:text-cyan-300 ${className}`}
      title="Copy"
    >
      <Copy className="w-4 h-4" />
    </button>
  );
}
