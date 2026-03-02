/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Admin from './pages/Admin';
import Analytics from './pages/Analytics';
import Billing from './pages/Billing';
import ClaimsAnalytics from './pages/ClaimsAnalytics';
import Dashboard from './pages/Dashboard';
import DeviceHealth from './pages/DeviceHealth';
import Devices from './pages/Devices';
import Home from './pages/Home';
import InsuranceClaims from './pages/InsuranceClaims';
import Onboarding from './pages/Onboarding';
import PredictiveMaintenance from './pages/PredictiveMaintenance';
import Procurement from './pages/Procurement';
import Reports from './pages/Reports';
import RequestHistory from './pages/RequestHistory';
import Requests from './pages/Requests';
import Tickets from './pages/Tickets';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Analytics": Analytics,
    "Billing": Billing,
    "ClaimsAnalytics": ClaimsAnalytics,
    "Dashboard": Dashboard,
    "DeviceHealth": DeviceHealth,
    "Devices": Devices,
    "Home": Home,
    "InsuranceClaims": InsuranceClaims,
    "Onboarding": Onboarding,
    "PredictiveMaintenance": PredictiveMaintenance,
    "Procurement": Procurement,
    "Reports": Reports,
    "RequestHistory": RequestHistory,
    "Requests": Requests,
    "Tickets": Tickets,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};