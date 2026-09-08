import React, { useEffect, useState } from "react";
import { LogOut, Menu, X, Plus, Trash2 } from "lucide-react";
import axios from "axios";

import { wardApi, roadApi } from "../api/client";
import CrudModal from "./CrudModal";

const API = "https://gold-cobra.onrender.com/api";

const WARD_FIELDS = [
  {
    name: "ward_number",
    label: "Ward Number",
    type: "text",
    required: true,
  },
];

const ROAD_FIELDS = [
  {
    name: "road_name",
    label: "Road Name",
    type: "text",
    required: true,
  },
];

export default function Navbar({
  selectedWard,
  setSelectedWard,
  selectedRoad,
  setSelectedRoad,
  onLogout,
  canEdit = false,
}) {
  const [wards, setWards] = useState([]);
  const [roads, setRoads] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [wardModalOpen, setWardModalOpen] = useState(false);
  const [roadModalOpen, setRoadModalOpen] = useState(false);

  useEffect(() => {
    loadWards();
  }, []);

  useEffect(() => {
    if (selectedWard) {
      loadRoads(selectedWard);
    }
  }, [selectedWard]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const loadWards = async (preferWard) => {
    try {
      const res = await axios.get(`${API}/wards`);

      const wardList = res.data.wards || [];
      setWards(wardList);

      if (preferWard) {
        setSelectedWard(String(preferWard));
      } else if (wardList.length > 0) {
        setSelectedWard(String(wardList[0].ward_number));
      }
    } catch (err) {
      console.error("Load Wards Error:", err);
    }
  };

  const loadRoads = async (ward, preferRoad) => {
    try {
      const res = await axios.get(`${API}/roads/ward/${ward}`);

      const roadList = res.data.roads || [];
      setRoads(roadList);

      if (preferRoad) {
        setSelectedRoad(preferRoad);
      } else if (roadList.length > 0) {
        setSelectedRoad(roadList[0].road_name);
      } else {
        setSelectedRoad("");
      }
    } catch (err) {
      console.error("Load Roads Error:", err);
      setRoads([]);
      setSelectedRoad("");
    }
  };

  async function handleAddWard(values) {
    await wardApi.add({
      ward_number: values.ward_number,
    });

    setWardModalOpen(false);
    await loadWards(values.ward_number);
  }

  async function handleAddRoad(values) {
    const currentWard = wards.find(
      (w) => String(w.ward_number) === String(selectedWard)
    );

    if (!currentWard) {
      throw new Error("Select a ward first.");
    }

    await roadApi.add({
      ward_id: currentWard.id,
      road_name: values.road_name,
    });

    setRoadModalOpen(false);

    await loadRoads(selectedWard, values.road_name);
  }

  async function handleDeleteRoad() {
    const currentRoad = roads.find(
      (r) => r.road_name === selectedRoad
    );

    if (!currentRoad) return;

    if (
      !window.confirm(
        `Delete road "${selectedRoad}"?\n\nThis removes all its data.`
      )
    ) {
      return;
    }

    try {
      await roadApi.remove(currentRoad.id);
      await loadRoads(selectedWard);
    } catch (err) {
      window.alert(
        err?.response?.data?.message ||
          "Failed to delete road."
      );
    }
  }

  const selectClass =
    "h-11 min-w-0 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:px-4";

  const iconButtonClass =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white transition active:scale-95";

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">

        <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6">

          {/* =========================
              TOP BAR
          ========================= */}
          <div className="flex min-w-0 items-center justify-between gap-3">

            {/* Logo */}
            <div className="min-w-0 flex-1">
              <img
                src="/logo.png"
                alt="Gold Cobra"
                className="
                  h-11
                  w-auto
                  max-w-[180px]
                  object-contain
                  object-left
                  sm:h-14
                  sm:max-w-[220px]
                  lg:h-16
                  lg:max-w-[250px]
                "
              />
            </div>

            {/* Desktop controls */}
            <div className="hidden min-w-0 items-center gap-2 lg:flex">

              {/* Ward */}
              <div className="flex min-w-0 items-center gap-2">
                <select
                  value={selectedWard}
                  onChange={(e) =>
                    setSelectedWard(e.target.value)
                  }
                  className="h-11 max-w-[150px] rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  {wards.map((ward) => (
                    <option
                      key={ward.id}
                      value={ward.ward_number}
                    >
                      Ward {ward.ward_number}
                    </option>
                  ))}
                </select>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setWardModalOpen(true)}
                    aria-label="Add ward"
                    className={`${iconButtonClass} text-blue-600 hover:bg-blue-50`}
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>

              {/* Road */}
              <div className="flex min-w-0 items-center gap-2">
                <select
                  value={selectedRoad}
                  onChange={(e) =>
                    setSelectedRoad(e.target.value)
                  }
                  className="h-11 max-w-[260px] rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  {roads.map((road) => (
                    <option
                      key={road.id}
                      value={road.road_name}
                    >
                      {road.road_name}
                    </option>
                  ))}
                </select>

                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => setRoadModalOpen(true)}
                      aria-label="Add road"
                      className={`${iconButtonClass} text-blue-600 hover:bg-blue-50`}
                    >
                      <Plus size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteRoad}
                      disabled={!selectedRoad}
                      aria-label="Delete road"
                      className={`${iconButtonClass} text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={onLogout}
                aria-label="Logout"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-600 active:scale-95"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              aria-label={
                isMenuOpen ? "Close menu" : "Open menu"
              }
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((value) => !value)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50 active:scale-95 lg:hidden"
            >
              {isMenuOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>
          </div>

          {/* =========================
              MOBILE MENU
          ========================= */}
          {isMenuOpen && (
            <div className="mt-4 border-t border-gray-100 pt-4 lg:hidden">

              <div className="space-y-3">

                {/* Ward */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Ward
                  </label>

                  <div className="flex gap-2">
                    <select
                      value={selectedWard}
                      onChange={(e) =>
                        setSelectedWard(e.target.value)
                      }
                      className={selectClass}
                    >
                      {wards.map((ward) => (
                        <option
                          key={ward.id}
                          value={ward.ward_number}
                        >
                          Ward {ward.ward_number}
                        </option>
                      ))}
                    </select>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          setWardModalOpen(true)
                        }
                        aria-label="Add ward"
                        className={`${iconButtonClass} text-blue-600 hover:bg-blue-50`}
                      >
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Road */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Road
                  </label>

                  <div className="flex gap-2">
                    <select
                      value={selectedRoad}
                      onChange={(e) =>
                        setSelectedRoad(e.target.value)
                      }
                      className={selectClass}
                    >
                      {roads.map((road) => (
                        <option
                          key={road.id}
                          value={road.road_name}
                        >
                          {road.road_name}
                        </option>
                      ))}
                    </select>

                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setRoadModalOpen(true)
                          }
                          aria-label="Add road"
                          className={`${iconButtonClass} text-blue-600 hover:bg-blue-50`}
                        >
                          <Plus size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={handleDeleteRoad}
                          disabled={!selectedRoad}
                          aria-label="Delete road"
                          className={`${iconButtonClass} text-red-600 hover:bg-red-50 disabled:opacity-40`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Logout */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 active:scale-[0.99]"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* =========================
          WARD MODAL
      ========================= */}
      {canEdit && wardModalOpen && (
        <CrudModal
          title="Add Ward"
          fields={WARD_FIELDS}
          initialValues={{}}
          onClose={() => setWardModalOpen(false)}
          onSubmit={handleAddWard}
          submitLabel="Add"
        />
      )}

      {/* =========================
          ROAD MODAL
      ========================= */}
      {canEdit && roadModalOpen && (
        <CrudModal
          title={`Add Road (Ward ${selectedWard})`}
          fields={ROAD_FIELDS}
          initialValues={{}}
          onClose={() => setRoadModalOpen(false)}
          onSubmit={handleAddRoad}
          submitLabel="Add"
        />
      )}
    </>
  );
}