import { Toaster as Sonner } from 'sonner';
import { useTheme } from '@/context/ThemeContext';

function Toaster(props) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{ classNames: { toast: 'font-sans' } }}
      {...props}
    />
  );
}

export { Toaster };
