import { Button } from '@/components/ui/button';
import { Copy, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonsProps {
  text: string;
  className?: string;
}

export function ShareButtons({ text, className = '' }: ShareButtonsProps) {
  const encodedText = encodeURIComponent(text);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?text=${encodedText}`, '_blank');
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Button variant="outline" size="sm" onClick={copyToClipboard} title="Copy to clipboard">
        <Copy className="w-3.5 h-3.5 mr-1" />
        Copy
      </Button>
      <Button variant="outline" size="sm" onClick={shareWhatsApp} title="Share on WhatsApp">
        <MessageCircle className="w-3.5 h-3.5" />
      </Button>
      <Button variant="outline" size="sm" onClick={shareTelegram} title="Share on Telegram">
        <Send className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
