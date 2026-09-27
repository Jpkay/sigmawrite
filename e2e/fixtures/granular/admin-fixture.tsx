import React from 'react';
import {createRoot} from 'react-dom/client';
import {DiagnosticTestWorkspace} from '../../../src/app/admin/diagnostic-test/workspace';
import '../../../src/app/globals.css';
createRoot(document.getElementById('root')!).render(<DiagnosticTestWorkspace/>);
