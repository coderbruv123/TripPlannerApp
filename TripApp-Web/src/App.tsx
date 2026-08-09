import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import TripResults from "./components/TripResults";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trip" element={<TripResults />} />
      </Routes>
    </BrowserRouter>
  );
}