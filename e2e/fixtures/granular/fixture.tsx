import React from "react";
import {createRoot} from "react-dom/client";
import {GranularDiagnostic} from "../../../src/components/diagnostic/granular-diagnostic";
import "../../../src/app/globals.css";
createRoot(document.getElementById("root")!).render(<React.StrictMode><GranularDiagnostic/></React.StrictMode>);
