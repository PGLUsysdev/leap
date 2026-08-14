import { PDFViewer } from '@react-pdf/renderer';
import { PpmpDocument } from './PpmpDocument';

export function PpmpPreview() {
    return (
        <div style={{ width: '100vw', height: '94vh', margin: 0, padding: 0 }}>
            <PDFViewer
                style={{ width: '100%', height: '100%', border: 'none' }}
            >
                <PpmpDocument />
            </PDFViewer>
        </div>
    );
}

export default PpmpPreview;
