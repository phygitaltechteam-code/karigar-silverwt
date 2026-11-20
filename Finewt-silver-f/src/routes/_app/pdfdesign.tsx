import HeaderPdfDesign from '@/components/HeaderPdfDesign';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/pdfdesign')({
  component: RouteComponent,
});

function RouteComponent() {
  return <HeaderPdfDesign />;
}
