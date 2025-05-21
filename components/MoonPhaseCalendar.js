
// Fixed MoonPhaseCalendar.js with corrected date handling and improved responsive UI
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function MoonPhaseCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [panchangMap, setPanchangMap] = useState({});

  useEffect(() => {
    fetchMonthData(currentMonth);
  }, [currentMonth]);

  // Fixed function to handle date timezone issues and ensure correct data fetching
  const fetchMonthData = async (date) => {
    setLoading(true);

    // Get year and month from the date
    const year = date.getFullYear();
    const month = date.getMonth();

    // Create first day of month at midnight local time
    const firstDay = new Date(year, month, 1);

    // Create last day of month at midnight local time
    const lastDay = new Date(year, month + 1, 0);

    // Format dates for database query - ensuring we use local timezone date
    // This fixes the issue where it was fetching previous day's data
    const formatDateForDB = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startStr = formatDateForDB(firstDay);
    const endStr = formatDateForDB(lastDay);

    // Fetch data from Supabase with corrected date range
    try {
      const { data, error } = await supabase
        .from("daily_panchangam")
        .select("date, tithi, main_nakshatra, is_pournami, is_amavasai, is_ekadashi, is_dwadashi")
        .gte("date", startStr)
        .lte("date", endStr)
        .order("date");

      if (error) {
        console.error("Error fetching panchangam data:", error);
        setLoading(false);
        return;
      }

      // Create a lookup map for easy access to date data
      const map = {};
      data.forEach((item) => {
        // Ensure we're mapping to the correct date key
        const dateKey = item.date;
        map[dateKey] = item;
      });

      // Build calendar grid with proper spacing
      const days = [];

      // Add empty cells for days before the first of the month
      const firstWeekday = firstDay.getDay();
      for (let i = 0; i < firstWeekday; i++) {
        days.push({ empty: true });
      }

      // Add calendar days with panchangam data
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const dayDate = new Date(year, month, d);
        const dateKey = formatDateForDB(dayDate);
        const info = map[dateKey] || null;

        let tithi = "-", paksha = "", special = "", waxing = false, waning = false;

        // Safely parse tithi information
        if (info?.tithi) {
          try {
            const tithiParsed = typeof info.tithi === "string" 
              ? JSON.parse(info.tithi) 
              : info.tithi;

            if (Array.isArray(tithiParsed) && tithiParsed.length > 0) {
              tithi = tithiParsed[0]?.name || "-";
              paksha = tithiParsed[0]?.paksha || "-";
              waxing = paksha === "சுக்ல பக்ஷ";
              waning = paksha === "கிருஷ்ண பக்ஷ";
            }
          } catch (err) {
            console.error("Tithi parse error for date:", dateKey, err);
          }
        }

        // Determine special day type
        if (info?.is_pournami) special = "பௌர்ணமி";
        else if (info?.is_amavasai) special = "அமாவாசை";
        else if (info?.is_ekadashi) special = "ஏகாதசி";
        else if (info?.is_dwadashi) special = "துவாதசி";

        days.push({
          day: d,
          date: dateKey,
          special,
          tithi,
          waxing,
          waning,
          nakshatra: info?.main_nakshatra || "",
          fullData: info,
        });
      }

      // Add empty cells to complete the last week
      const remainingCells = 7 - (days.length % 7);
      if (remainingCells < 7) {
        for (let i = 0; i < remainingCells; i++) {
          days.push({ empty: true });
        }
      }

      setCalendarData(days);
      setPanchangMap(map);
    } catch (err) {
      console.error("Calendar data processing error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Improved modal with better styling and error handling
  const renderModal = () => {
    if (!selectedDate) return null;

    const data = panchangMap[selectedDate] || {};
    let tithiName = "-", paksha = "-";

    if (data.tithi) {
      try {
        const parsed = typeof data.tithi === "string" 
          ? JSON.parse(data.tithi) 
          : data.tithi;

        tithiName = parsed?.[0]?.name || "-";
        paksha = parsed?.[0]?.paksha || "-";
      } catch (err) {
        console.error("Modal tithi parse error:", err);
      }
    }

    // Format date for display
    const formatDisplayDate = (dateStr) => {
      try {
        const [year, month, day] = dateStr.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString("ta-IN", { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } catch {
        return dateStr;
      }
    };

    return (
      <div className="modal-overlay" onClick={() => setSelectedDate(null)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={() => setSelectedDate(null)}>×</button>
          <h3>{formatDisplayDate(selectedDate)}</h3>
          <div className="modal-content">
            <p><strong>நட்சத்திரம்:</strong> {data.main_nakshatra || "-"}</p>
            <p><strong>திதி:</strong> {tithiName}</p>
            <p><strong>சிறப்பு:</strong> {
              data.is_pournami ? "பௌர்ணமி" : 
              data.is_amavasai ? "அமாவாசை" : 
              data.is_ekadashi ? "ஏகாதசி" : 
              data.is_dwadashi ? "துவாதசி" : "-"
            }</p>
            <p><strong>பிறை:</strong> {paksha}</p>
          </div>
        </div>
      </div>
    );
  };

  const formatMonthYear = (date) => {
    try {
      return date.toLocaleDateString("ta-IN", { month: "long", year: "numeric" });
    } catch {
      return `${date.getMonth() + 1}/${date.getFullYear()}`;
    }
  };

  // Helper function to get day style class
  const getDayClass = (item) => {
    let classes = "day";
    if (item.empty) classes += " empty";
    if (item.special) classes += " special";
    if (item.waxing) classes += " waxing";
    if (item.waning) classes += " waning";
    return classes;
  };

  return (
    <div className="moon-phase-calendar">
      <h1 className="header">🌗 Moon Phase Calendar</h1>

      <div className="month-navigator">
        <button className="nav-button" onClick={() => 
          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
        }>
          &lt; Prev
        </button>
        <h2>{formatMonthYear(currentMonth)}</h2>
        <button className="nav-button" onClick={() => 
          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
        }>
          Next &gt;
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading calendar data...</p>
        </div>
      ) : (
        <div className="calendar">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
            <div key={`weekday-${i}`} className="weekday">{day}</div>
          ))}

          {calendarData.map((item, i) => (
            <div
              key={`day-${i}`}
              className={getDayClass(item)}
              onClick={() => item.date && setSelectedDate(item.date)}
            >
              {!item.empty && (
                <>
                  <div className="day-number">{item.day}</div>

                  <div className="day-content">
                    {item.waxing && <div className="moon-icon waxing">◔</div>}
                    {item.waning && <div className="moon-icon waning">◑</div>}
                    {item.special && <div className="special-text">{item.special}</div>}
                    {item.nakshatra && <div className="nakshatra">{item.nakshatra}</div>}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {renderModal()}

      <style jsx>{`
        .moon-phase-calendar {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .header {
          text-align: center;
          margin-bottom: 20px;
          color: #1e293b;
        }

        .month-navigator {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
        }

        .nav-button {
          background: #334155;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .nav-button:hover {
          background: #1e293b;
        }

        .calendar {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 24px;
        }

        .weekday {
          text-align: center;
          font-weight: bold;
          background: #e2e8f0;
          padding: 10px 0;
          border-radius: 4px;
        }

        .day {
          position: relative;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
        }

        .day:not(.empty) {
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.2s;
        }

        .day:not(.empty):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }

        .day.empty {
          background: #f1f5f9;
          border-color: #f1f5f9;
        }

        .day.special {
          background: #fef9c3;
          border-color: #fde047;
        }

        .day-number {
          font-weight: bold;
          padding: 6px 8px;
          background: rgba(0, 0, 0, 0.03);
        }

        .day-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          padding: 4px;
          font-size: 0.85rem;
          overflow: hidden;
        }

        .moon-icon {
          font-size: 1.2rem;
          margin: 2px 0;
        }

        .moon-icon.waxing {
          color: #10b981;
        }

        .moon-icon.waning {
          color: #ef4444;
        }

        .special-text {
          color: #b45309;
          font-weight: 500;
          margin: 2px 0;
        }

        .nakshatra {
          color: #475569;
          font-size: 0.75rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          text-align: center;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #334155;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal {
          position: relative;
          background: white;
          padding: 24px;
          border-radius: 8px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .close-button {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #64748b;
        }

        .modal h3 {
          margin-top: 0;
          color: #1e293b;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .modal-content p {
          margin: 8px 0;
          line-height: 1.5;
        }

        /* Responsive adjustments */
        @media (max-width: 600px) {
          .moon-phase-calendar {
            padding: 12px;
          }

          .calendar {
            gap: 4px;
          }

          .day-number {
            padding: 4px;
            font-size: 0.9rem;
          }

          .day-content {
            padding: 2px;
            font-size: 0.7rem;
          }

          .moon-icon {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}