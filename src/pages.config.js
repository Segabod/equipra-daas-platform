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
import Billing from './pages/Billing';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Home from './pages/Home';
import Requests from './pages/Requests';
import Tickets from './pages/Tickets';
import RequestHistory from './pages/RequestHistory';
import Reports from './pages/Reports';
import DeviceHealth from './pages/DeviceHealth';
import Onboarding from './pages/Onboarding';
import Procurement from './pages/Procurement';
import Analytics from './pages/Analytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Billing": Billing,
    "Dashboard": Dashboard,
    "Devices": Devices,
    "Home": Home,
    "Requests": Requests,
    "Tickets": Tickets,
    "RequestHistory": RequestHistory,
    "Reports": Reports,
    "DeviceHealth": DeviceHealth,
    "Onboarding": Onboarding,
    "Procurement": Procurement,
    "Analytics": Analytics,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};