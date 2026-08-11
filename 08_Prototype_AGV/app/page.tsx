"use client";
import { useEffect, useState, useCallback } from "react";
import { SimState } from "@/lib/types";
import WarehouseMap from "@/components/WarehouseMap";
import RobotPanel from "@/components/RobotPanel";
import TaskQueue from "@/components/TaskQueue";
import EventLog from "@/components/EventLog";
import CommandBar from "@/components/CommandBar";
import ManualTaskForm from "@/components/ManualTaskForm";

const POLL_MS = 1500;

export default function Home() {
  const [state, setState] = useState<SimState | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/state");
    const data = await res.json();
    setState(data);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  if (!state) {
    return <div className="p-8 text-sm text-gray-500">Đang tải dashboard...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">
          AGV Dispatch Dashboard — Portfolio Prototype
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Mô phỏng hệ thống điều phối robot vận chuyển tự hành trong kho · tick #{state.tick}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <WarehouseMap zones={state.zones} robots={state.robots} tasks={state.tasks} />
          <CommandBar onTaskCreated={refresh} />
          <ManualTaskForm zones={state.zones} onTaskCreated={refresh} />
        </div>
        <div className="space-y-4">
          <RobotPanel robots={state.robots} />
          <TaskQueue tasks={state.tasks} />
          <EventLog events={state.events} />
        </div>
      </div>

      <footer className="text-[11px] text-gray-400 mt-6">
        Traceability: dashboard này hiện thực hóa BR-01→BR-06, BR-10 trong 01_BRD_AGV.md · chi tiết FR
        xem 02_SRS_FRD_AGV.md.
      </footer>
    </main>
  );
}
