import React, { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import Login from "./components/Login";
import MapPanel from "./components/MapPanel";
import MilestoneTable from "./components/MilestoneTable";
import MilestoneCircleChart from "./components/MilestoneCircleChart";
import ResourcePieChart from "./components/ResourcePieChart";
import BomTable from "./components/BomTable";
import MaterialsTable from "./components/MaterialsTable";
import SummaryCard from "./components/SummaryCard";
import { authApi } from "./api/client";

const API = "https://gold-cobra.onrender.com/api";

// Only admin gets Add/Edit/Delete controls.
const ADMIN_ROLE = "admin";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [selectedWard, setSelectedWard] = useState("");
  const [selectedRoad, setSelectedRoad] = useState("");

  const [milestoneData, setMilestoneData] = useState([]);
  const [bomData, setBomData] = useState([]);
  const [mixOverviewData, setMixOverviewData] = useState([]);
  const [roadImageUrl, setRoadImageUrl] = useState("");

  const [loading, setLoading] = useState(false);

  // ============================================================
  // CHECK LOGIN
  // ============================================================
  useEffect(() => {
    const token = localStorage.getItem(
      "gold_cobra_token"
    );

    const storedRole = localStorage.getItem(
      "gold_cobra_role"
    );

    if (token) {
      setIsLoggedIn(true);
      setRole(storedRole);
    }
  }, []);

  // ============================================================
  // LOAD DASHBOARD WHEN ROAD CHANGES
  // ============================================================
  useEffect(() => {
    if (isLoggedIn && selectedRoad) {
      loadDashboard();
    }
  }, [selectedRoad, isLoggedIn]);

  async function loadDashboard() {
    try {
      setLoading(true);

      const res = await fetch(
        `${API}/dashboard?road=${encodeURIComponent(
          selectedRoad
        )}`
      );

      if (!res.ok) {
        throw new Error(
          `Dashboard request failed: ${res.status}`
        );
      }

      const data = await res.json();

      setMilestoneData(
        Array.isArray(data.milestones)
          ? data.milestones
          : []
      );

      setBomData(
        Array.isArray(data.bom)
          ? data.bom
          : []
      );

      setMixOverviewData(
        Array.isArray(data.mixOverview)
          ? data.mixOverview
          : []
      );

      setRoadImageUrl(
        data.road?.image_url || ""
      );
    } catch (err) {
      console.error(
        "Dashboard Error:",
        err
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOGIN
  // ============================================================
  async function login(e) {
    e.preventDefault();

    if (!username || !password) {
      return;
    }

    setLoginError("");

    try {
      setLoggingIn(true);

      const res = await authApi.login({
        username,
        password,
      });

      const { token, user } = res.data;

      localStorage.setItem(
        "gold_cobra_token",
        token
      );

      localStorage.setItem(
        "gold_cobra_role",
        user?.role || ""
      );

      setRole(user?.role || "");
      setIsLoggedIn(true);
    } catch (err) {
      setLoginError(
        err?.response?.data?.message ||
          "Login failed. Check your credentials."
      );
    } finally {
      setLoggingIn(false);
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================
  function logout() {
    localStorage.removeItem(
      "gold_cobra_token"
    );

    localStorage.removeItem(
      "gold_cobra_role"
    );

    setIsLoggedIn(false);
    setRole(null);

    setSelectedWard("");
    setSelectedRoad("");

    setMilestoneData([]);
    setBomData([]);
    setMixOverviewData([]);
    setRoadImageUrl("");
  }

  const canEdit = role === ADMIN_ROLE;

  // ============================================================
  // LOGIN SCREEN
  // ============================================================
  if (!isLoggedIn) {
    return (
      <Login
        username={username}
        password={password}
        setUsername={setUsername}
        setPassword={setPassword}
        onLogin={login}
        error={loginError}
        loading={loggingIn}
      />
    );
  }

  // ============================================================
  // DASHBOARD
  // ============================================================
  return (
    <div
      className="
        min-h-[100dvh]
        w-full min-w-0
        overflow-x-hidden
        bg-gray-100
      "
    >
      <Navbar
        selectedWard={selectedWard}
        setSelectedWard={setSelectedWard}
        selectedRoad={selectedRoad}
        setSelectedRoad={setSelectedRoad}
        onLogout={logout}
        canEdit={canEdit}
      />

      <main
        className="
          mx-auto w-full min-w-0 max-w-7xl
          space-y-4
          px-3 py-4
          sm:space-y-6
          sm:px-4 sm:py-5
          md:px-6 md:py-6
        "
      >
        {/* ======================================================
            LOADING
            ====================================================== */}
        {loading && (
          <div
            className="
              w-full min-w-0
              rounded-xl bg-white
              px-4 py-3
              text-sm font-semibold
              text-blue-600
              shadow-sm
              sm:px-5 sm:py-4
            "
          >
            Loading Dashboard...
          </div>
        )}

        {/* ======================================================
            READ ONLY NOTICE
            ====================================================== */}
        {!canEdit && (
          <div
            className="
              w-full min-w-0
              rounded-xl
              border border-blue-100
              bg-blue-50
              px-3 py-2.5
              text-xs font-medium
              leading-5 text-blue-700
              sm:px-4 sm:py-3
              sm:text-sm
            "
          >
            Viewing in read-only mode.
            Contact an admin for edit access.
          </div>
        )}

        {/* ======================================================
            MAP + SUMMARY
            ====================================================== */}
        <section
          className="
            grid w-full min-w-0
            grid-cols-1
            gap-4
            lg:grid-cols-3
            lg:gap-6
          "
        >
          <MapPanel
            selectedWard={selectedWard}
            selectedRoad={selectedRoad}
            imageUrl={roadImageUrl}
            onChanged={loadDashboard}
            canEdit={canEdit}
          />

          <SummaryCard
            selectedWard={selectedWard}
            selectedRoad={selectedRoad}
            milestones={milestoneData}
            bom={bomData}
            materials={mixOverviewData}
          />
        </section>

        {/* ======================================================
            MILESTONES
            ====================================================== */}
        <section
          className="
            grid w-full min-w-0
            grid-cols-1
            gap-4
            lg:grid-cols-2
            lg:gap-6
          "
        >
          <MilestoneCircleChart
            data={milestoneData}
          />

          <MilestoneTable
            data={milestoneData}
            road={selectedRoad}
            onChanged={loadDashboard}
            canEdit={canEdit}
          />
        </section>

        {/* ======================================================
            MATERIALS
            ====================================================== */}
        <section
          className="
            grid w-full min-w-0
            grid-cols-1
            gap-4
            lg:grid-cols-2
            lg:gap-6
          "
        >
          <ResourcePieChart
            data={mixOverviewData}
          />

          <MaterialsTable
            data={mixOverviewData}
            road={selectedRoad}
            onChanged={loadDashboard}
            canEdit={canEdit}
          />
        </section>

        {/* ======================================================
            BILL OF MATERIALS
            ====================================================== */}
        <BomTable
          data={bomData}
          road={selectedRoad}
          onChanged={loadDashboard}
          canEdit={canEdit}
        />
      </main>
    </div>
  );
}