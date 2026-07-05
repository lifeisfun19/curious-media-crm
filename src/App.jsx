import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";
import AutoSyncSheet from "./components/AutoSyncSheet";

import { CreatorsProvider } from "./context/CreatorsContext";
import { CampaignsProvider } from "./context/CampaignsContext";
import { ToastProvider } from "./context/ToastContext";

import Workspace from "./pages/Workspace";

export default function App() {
  return (
    <ToastProvider>
      <CreatorsProvider>
        <CampaignsProvider>
          <AutoSyncSheet />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Workspace />} />
                <Route path="/campaigns/:id" element={<Workspace />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </CampaignsProvider>
      </CreatorsProvider>
    </ToastProvider>
  );
}