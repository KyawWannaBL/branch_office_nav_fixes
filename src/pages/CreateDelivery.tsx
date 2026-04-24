import { Navigate, useLocation } from "react-router-dom";

export default function CreateDelivery() {
  const location = useLocation();
  const qs = location.search || "";
  return <Navigate to={`/delivery-registration${qs}`} replace />;
}
