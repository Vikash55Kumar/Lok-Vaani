import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface UsePdfExportOptions {
  fileName?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

export const usePdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPdf = useCallback(async (
    elementRef: React.RefObject<HTMLElement | null>, 
    options: UsePdfExportOptions = {}
  ) => {
    const {
      fileName = 'report.pdf',
      format = 'a4',
      orientation = 'portrait'
    } = options;

    if (!elementRef.current) {
      console.error('Export element not found');
      return;
    }

    try {
      setIsExporting(true);
      const container = elementRef.current;

      // Initialize PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Margins
      const marginTop = 15;
      const marginBottom = 15;
      const marginLeft = 15;
      const marginRight = 15;
      
      const contentWidth = pdfWidth - marginLeft - marginRight;
      // const pageHeightContent = pdfHeight - marginTop - marginBottom;

      // Check for sections marked for smart export
      const sections = container.querySelectorAll('[data-pdf-section]');

      if (sections.length > 0) {
        // --- Smart Export (Element-wise) ---
        let cursorY = marginTop;

        for (let i = 0; i < sections.length; i++) {
          const section = sections[i] as HTMLElement;
          
          // Capture section
          const canvas = await html2canvas(section, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff' // Assume white background for sections
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          
          // Calculate scaled dimensions
          const ratio = contentWidth / imgWidth;
          const scaledHeight = imgHeight * ratio;

          // Check if it fits on the current page
          if (cursorY + scaledHeight > pdfHeight - marginBottom) {
            // It doesn't fit. 
            // If it's the *first* item on the page, we have to print it anyway (or slice it, but we avoid slicing here for now)
            // If it's NOT the first item, add a new page.
            if (cursorY > marginTop) {
              pdf.addPage();
              cursorY = marginTop;
            }
          }

          // Render image
          pdf.addImage(imgData, 'PNG', marginLeft, cursorY, contentWidth, scaledHeight);
          
          // Move cursor
          cursorY += scaledHeight + 5; // Add 5mm gap between sections
        }

      } else {
        // --- Fallback: Full Snapshot (Legacy Mode) ---
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = pdfWidth / imgWidth;
        const scaledHeight = imgHeight * ratio;

        let heightLeft = scaledHeight;
        let position = 0;

        // First page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;

        // Subsequent pages
        while (heightLeft > 0) {
          position = heightLeft - scaledHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
          heightLeft -= pdfHeight;
        }
      }

      // Save
      pdf.save(fileName);

    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportToPdf, isExporting };
};