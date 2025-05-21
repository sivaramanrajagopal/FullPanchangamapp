// components/RSNakshatraForecast.js
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function RSNakshatraForecast() {
  const [upcomingRSDays, setUpcomingRSDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNakshatra, setSelectedNakshatra] = useState("all");
  const [daysToShow, setDaysToShow] = useState(90);

  // Comprehensive mapping between English and Tamil nakshatra names
  const nakshatraMapping = {
    // English to Tamil
    Bharani: "பரணி",
    Krittika: "கார்த்திகை",
    Karthigai: "கார்த்திகை", // Alternative spelling
    Ardra: "திருவாதிரை",
    Thiruvadirai: "திருவாதிரை", // Alternative spelling
    Ashlesha: "ஆயில்யம்",
    Ayilyam: "ஆயில்யம்", // Alternative spelling
    Magha: "மகம்",
    Makam: "மகம்", // Alternative spelling
    "Purva Phalguni": "பூரம்",
    Pooram: "பூரம்", // Alternative spelling
    Chitra: "சித்திரை",
    Chitirai: "சித்திரை", // Alternative spelling
    Swati: "சுவாதி",
    Swathi: "ஸ்வாதி",
    Vishakha: "விசாகம்",
    Visakam: "விசாகம்", // Alternative spelling
    Jyeshtha: "கேட்டை",
    Kettai: "கேட்டை", // Alternative spelling
    "Purva Ashadha": "பூராடம்",
    Pooradam: "பூராடம்", // Alternative spelling
    "Purva Bhadrapada": "பூரட்டாதி",
    Poorattathi: "பூரட்டாதி", // Alternative spelling
  };

  // Create reverse mapping (Tamil to English)
  const tamilToEnglishMapping = {};
  Object.entries(nakshatraMapping).forEach(([english, tamil]) => {
    tamilToEnglishMapping[tamil] = english;
  });

  // List of RS Nakshatras (English names only)
  const rsNakshatrasEnglish = [
    "Bharani",
    "Krittika",
    "Karthigai",
    "Ardra",
    "Thiruvadirai",
    "Ashlesha",
    "Ayilyam",
    "Magha",
    "Makam",
    "Purva Phalguni",
    "Pooram",
    "Chitra",
    "Chitirai",
    "Swati",
    "Swathi",
    "Vishakha",
    "Visakam",
    "Jyeshtha",
    "Kettai",
    "Purva Ashadha",
    "Pooradam",
    "Purva Bhadrapada",
    "Poorattathi",
  ];

  // Create a list of Tamil RS Nakshatras
  const rsNakshatrasTamil = rsNakshatrasEnglish
    .map((name) => nakshatraMapping[name])
    .filter(Boolean); // Remove any undefined values

  // Combined list of unique Tamil names
  const uniqueTamilNakshatras = [...new Set(rsNakshatrasTamil)];

  useEffect(() => {
    fetchRSNakshatraDays();
  }, [daysToShow, selectedNakshatra]);

  const fetchRSNakshatraDays = async () => {
    setLoading(true);

    // Calculate date range
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + daysToShow);

    const formattedToday = today.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];

    try {
      const { data, error } = await supabase
        .from("daily_panchangam")
        .select("date, main_nakshatra, vaara")
        .gte("date", formattedToday)
        .lte("date", formattedEndDate)
        .order("date");

      if (error) throw error;

      // Filter for RS Nakshatras
      let rsDays = [];

      if (data && data.length > 0) {
        rsDays = data.filter((day) => {
          const nakshatra = day.main_nakshatra;

          // Check if this nakshatra is an RS nakshatra (in either language)
          const isRSNakshatra =
            rsNakshatrasEnglish.includes(nakshatra) ||
            uniqueTamilNakshatras.includes(nakshatra);

          // Apply nakshatra filter if not "all"
          if (selectedNakshatra !== "all" && isRSNakshatra) {
            if (selectedNakshatra === nakshatra) {
              return true;
            }

            // Check if the selected nakshatra's Tamil equivalent matches
            if (nakshatraMapping[selectedNakshatra] === nakshatra) {
              return true;
            }

            // Check if the nakshatra's English equivalent matches the selection
            if (
              tamilToEnglishMapping[nakshatra] &&
              tamilToEnglishMapping[nakshatra] === selectedNakshatra
            ) {
              return true;
            }

            return false;
          }

          return isRSNakshatra;
        });

        // Format the days for display
        rsDays = rsDays.map((day) => {
          const nakshatra = day.main_nakshatra;
          let englishName, tamilName;

          // Determine if the nakshatra is in English or Tamil
          if (rsNakshatrasEnglish.includes(nakshatra)) {
            // It's an English name
            englishName = nakshatra;
            tamilName = nakshatraMapping[nakshatra] || nakshatra;
          } else {
            // It's a Tamil name
            tamilName = nakshatra;
            englishName = tamilToEnglishMapping[nakshatra] || nakshatra;
          }

          return {
            ...day,
            formattedDate: new Date(day.date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            nakshatra: {
              english: englishName,
              tamil: tamilName,
            },
          };
        });
      }

      setUpcomingRSDays(rsDays);
    } catch (error) {
      console.error("Error fetching RS Nakshatra days:", error);
    } finally {
      setLoading(false);
    }
  };

  const setCalendarReminders = () => {
    alert("Calendar reminder feature will be implemented here");
    // This would typically generate calendar events for the RS days
  };

  // Get unique nakshatras for the dropdown, removing duplicates and alternates
  const getUniqueNakshatras = () => {
    // Get the primary English names without alternates
    const primaryEnglishNames = [
      "Bharani",
      "Krittika",
      "Ardra",
      "Ashlesha",
      "Magha",
      "Purva Phalguni",
      "Chitra",
      "Swati",
      "Vishakha",
      "Jyeshtha",
      "Purva Ashadha",
      "Purva Bhadrapada",
    ];

    return primaryEnglishNames;
  };

  return (
    <div className="rs-nakshatra-forecast">
      <h1 className="header">⚠️ RS Nakshatra Days Forecast</h1>

      <div className="filters">
        <div className="filter-item">
          <label htmlFor="nakshatra-filter">Filter by Nakshatra:</label>
          <select
            id="nakshatra-filter"
            value={selectedNakshatra}
            onChange={(e) => setSelectedNakshatra(e.target.value)}
            className="filter-select"
          >
            <option value="all">All RS Nakshatras</option>
            {getUniqueNakshatras().map((nakshatra) => (
              <option key={nakshatra} value={nakshatra}>
                {nakshatra} ({nakshatraMapping[nakshatra] || nakshatra})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="days-filter">Show:</label>
          <select
            id="days-filter"
            value={daysToShow}
            onChange={(e) => setDaysToShow(parseInt(e.target.value))}
            className="filter-select"
          >
            <option value={30}>Next 30 Days</option>
            <option value={60}>Next 60 Days</option>
            <option value={90}>Next 90 Days</option>
            <option value={180}>Next 6 Months</option>
            <option value={365}>Next Year</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading RS Nakshatra days...</div>
      ) : upcomingRSDays.length === 0 ? (
        <div className="no-data">
          No RS Nakshatra days found in the selected period.
        </div>
      ) : (
        <div className="rs-days-container">
          <div className="rs-days-table">
            <div className="table-header">
              <div className="header-cell date-cell">Date</div>
              <div className="header-cell day-cell">Day</div>
              <div className="header-cell nakshatra-cell">Nakshatra</div>
            </div>

            <div className="table-body">
              {upcomingRSDays.map((day) => (
                <div key={day.date} className="table-row">
                  <div className="table-cell date-cell">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="table-cell day-cell">
                    {day.vaara || day.formattedDate.split(",")[0]}
                  </div>
                  <div className="table-cell nakshatra-cell">
                    <span className="nakshatra-name">
                      {day.nakshatra.tamil}{" "}
                      {day.nakshatra.english !== day.nakshatra.tamil &&
                        `(${day.nakshatra.english})`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rs-info-panel">
            <h2 className="info-header">
              <span role="img" aria-label="Warning">
                📣
              </span>{" "}
              What to avoid on RS Nakshatra days:
            </h2>
            <div className="avoid-list">
              <div className="avoid-item">
                <span role="img" aria-label="Medical">
                  ✘
                </span>
                <span>Medical treatments and procedures</span>
              </div>
              <div className="avoid-item">
                <span role="img" aria-label="Travel">
                  ✘
                </span>
                <span>Starting journeys or travel</span>
              </div>
              <div className="avoid-item">
                <span role="img" aria-label="Financial">
                  ✘
                </span>
                <span>Financial transactions (loans, purchases)</span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="action-button" onClick={setCalendarReminders}>
              <span role="img" aria-label="Calendar">
                📆
              </span>{" "}
              Add to Calendar
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .rs-nakshatra-forecast {
          max-width: 600px;
          margin: 0 auto;
          padding-bottom: 20px;
        }

        .header {
          text-align: center;
          color: #4f46e5;
          margin-bottom: 20px;
          font-size: 1.5rem;
        }

        .filters {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 20px;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .filter-item label {
          font-weight: bold;
          font-size: 0.9rem;
        }

        .filter-select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }

        .loading,
        .no-data {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .rs-days-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 15px;
          margin-bottom: 20px;
        }

        .rs-days-table {
          margin-bottom: 20px;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 2fr;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 2px solid #eee;
          font-weight: bold;
        }

        .header-cell {
          padding: 0 10px;
        }

        .table-body {
          max-height: 400px;
          overflow-y: auto;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 2fr;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-cell {
          padding: 0 10px;
        }

        .nakshatra-name {
          display: inline-block;
          background-color: #ffebee;
          color: #c62828;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .rs-info-panel {
          background-color: #ffebee;
          border: 1px solid #e57373;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .info-header {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 1.1rem;
          color: #c62828;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .avoid-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .avoid-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .avoid-item span:first-child {
          color: #ef4444;
          font-size: 1.2rem;
          font-weight: bold;
        }

        .action-buttons {
          display: flex;
          justify-content: center;
        }

        .action-button {
          padding: 10px 15px;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 16px;
        }

        .action-button:hover {
          background-color: #4338ca;
        }

        @media (min-width: 640px) {
          .filters {
            flex-direction: row;
            justify-content: space-between;
          }

          .filter-item {
            width: 48%;
          }
        }
      `}</style>
    </div>
  );
}
