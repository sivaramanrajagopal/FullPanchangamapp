// pages/my-nakshatra.js
import dynamic from "next/dynamic";

// Import component with SSR disabled to prevent build errors
const PersonalNakshatraDashboard = dynamic(
  () => import("../components/PersonalNakshatraDashboard"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          fontSize: "18px",
          color: "#666",
        }}
      >
        Loading your personalized dashboard...
      </div>
    ),
  },
);

export default function MyNakshatraPage() {
  return <PersonalNakshatraDashboard />;
}
