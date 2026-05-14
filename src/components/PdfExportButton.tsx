import React, { useState, useEffect } from 'react';
import { Button } from './ui';
import { Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PdfExportButtonProps {
  elementId: string;
  filename: string;
}

export function PdfExportButton({ elementId, filename }: PdfExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const el = document.getElementById(elementId);
    if (!el) return;

    try {
      setIsExporting(true);
      
      const canvas = await html2canvas(el, {
        scale: 2, 
        backgroundColor: '#0A0A0A',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${filename}.pdf`);

    } catch (err) {
      console.error('PDF Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const onVoiceExport = () => {
      handleExport();
    };
    window.addEventListener('voice-export-pdf', onVoiceExport);
    return () => window.removeEventListener('voice-export-pdf', onVoiceExport);
  }, []);

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={isExporting}
      className="h-10 text-[10px] gap-2 px-4 shadow-none w-full md:w-auto min-w-[120px]"
    >
      {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} 
      Export PDF
    </Button>
  );
}
