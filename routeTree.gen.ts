import { createRoute } from "@tanstack/react-router";
import HydroTracePage from "./pages/HydroTracePage";

export const routes = [
  createRoute({ path: "/", component: HydroTracePage }),
];
