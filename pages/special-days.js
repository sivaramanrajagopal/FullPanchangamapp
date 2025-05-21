
// pages/special-days.js
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function SpecialDays() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("all"); // "all" or 1-12
  const [specialDays, setSpecialDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPaksham, setSelectedPaksham] = useState("all");
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    fetchSpecialDays(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, selectedCategory, selectedPaksham]);

  // Function to parse tithi data and determine paksham for filtering
  const getTithiInfo = (tithiData) => {
    if (!tithiData) return { isShukla: false, isKrishna: false };

    try {
      let tithiArray;
      if (typeof tithiData === "string") {
        tithiArray = JSON.parse(tithiData);
      } else {
        tithiArray = tithiData;
      }

      if (!Array.isArray(tithiArray) || tithiArray.length === 0) {
        return { isShukla: false, isKrishna: false };
      }

      // Get the current date for comparison
      const now = new Date();

      // Find the current or first tithi
      let currentTithi = tithiArray[0];
      for (const tithi of tithiArray) {
        const startTime = new Date(tithi.start);
        const endTime = new Date(tithi.end);

        if (now >= startTime && now <= endTime) {
          currentTithi = tithi;
          break;
        }
      }

      return {
        isShukla: currentTithi.paksha.includes("சுக்ல"),
        isKrishna: currentTithi.paksha.includes("கிருஷ்ண"),
      };
    } catch (error) {
      console.error("Error parsing tithi data:", error);
      return { isShukla: false, isKrishna: false };
    }
  };

  const fetchSpecialDays = async (year, month) => {
    setLoading(true);

    try {
      // Create date range based on year and month
      let startDate, endDate;

      if (month === "all") {
        // If "all months" is selected, get the entire year
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
      } else {
        // If a specific month is selected, get just that month
        const monthNum = parseInt(month);
        // Create date for first day of selected month
        startDate = `${year}-${monthNum.toString().padStart(2, "0")}-01`;

        // Calculate the last day of the selected month
        // By getting first day of next month and subtracting 1 day
        const lastDay = new Date(year, monthNum, 0).getDate();
        endDate = `${year}-${monthNum.toString().padStart(2, "0")}-${lastDay}`;
      }

      const { data, error } = await supabase
        .from("daily_panchangam")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date");

      if (error) throw error;
      setDebug(data.slice(0, 3));

      let filteredData = data;

      const categoryMap = {
        pournami: "is_pournami",
        amavasai: "is_amavasai",
        ekadashi: "is_ekadashi",
        ashtami: "is_ashtami",
        navami: "is_navami",
        trayodashi: "is_trayodashi",
        sashti: "is_sashti",
        dwadashi: "is_dwadashi",
        "rs-nakshatra": "is_rs_nakshatra",
      };

      // Filter by category
      if (selectedCategory === "all") {
        filteredData = data.filter(
          (item) =>
            item.is_pournami ||
            item.is_amavasai ||
            item.is_ekadashi ||
            item.is_ashtami ||
            item.is_navami ||
            item.is_trayodashi ||
            item.is_sashti ||
            item.is_dwadashi ||
            item.is_rs_nakshatra,
        );
      } else if (selectedCategory === "dwadashi") {
        filteredData = data.filter((item) => Boolean(item.is_dwadashi));
      } else {
        const columnName = categoryMap[selectedCategory];
        if (columnName) {
          filteredData = data.filter((item) => Boolean(item[columnName]));
        }
      }

      // Additional filter for Paksham
      if (selectedPaksham !== "all") {
        filteredData = filteredData.filter((day) => {
          const tithiInfo = getTithiInfo(day.tithi);
          if (selectedPaksham === "shukla") {
            return tithiInfo.isShukla;
          } else if (selectedPaksham === "krishna") {
            return tithiInfo.isKrishna;
          }
          return true;
        });
      }

      setSpecialDays(filteredData);
    } catch (error) {
      console.error("Error fetching special days:", error);
      setSpecialDays([]);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handlePakshamChange = (e) => {
    setSelectedPaksham(e.target.value);
  };

  const getSpecialDayType = (day) => {
    if (selectedCategory !== "all") {
      const labelMap = {
        pournami: "பௌர்ணமி (Full Moon)",
        amavasai: "அமாவாசை (New Moon)",
        ekadashi: "ஏகாதசி (Ekadashi)",
        ashtami: "அஷ்டமி (Ashtami)",
        navami: "நவமி (Navami)",
        trayodashi: "திரயோதசி (Trayodashi)",
        sashti: "சஷ்டி (Sashti)",
        dwadashi: "துவாதசி (Dwadashi)",
        "rs-nakshatra": "ராக்ஷஸ நட்சத்திரம் (RS Nakshatra)",
      };
      return labelMap[selectedCategory] || "Special Day";
    } else {
      if (day.is_dwadashi) return "துவாதசி (Dwadashi)";
      if (day.is_pournami) return "பௌர்ணமி (Full Moon)";
      if (day.is_amavasai) return "அமாவாசை (New Moon)";
      if (day.is_ekadashi) return "ஏகாதசி (Ekadashi)";
      if (day.is_ashtami) return "அஷ்டமி (Ashtami)";
      if (day.is_navami) return "நவமி (Navami)";
      if (day.is_trayodashi) return "திரயோதசி (Trayodashi)";
      if (day.is_sashti) return "சஷ்டி (Sashti)";
      if (day.is_rs_nakshatra) return "ராக்ஷஸ நட்சத்திரம் (RS Nakshatra)";
      return "Special Day";
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getWeekdayName = (day) => {
    if (day.vaara) {
      return day.vaara;
    }

    const date = new Date(day.date);
    const englishWeekday = date.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const weekdayMap = {
      Sunday: "ஞாயிற்றுக்கிழமை",
      Monday: "திங்கட்கிழமை",
      Tuesday: "செவ்வாய்க்கிழமை",
      Wednesday: "புதன்கிழமை",
      Thursday: "வியாழக்கிழமை",
      Friday: "வெள்ளிக்கிழமை",
      Saturday: "சனிக்கிழமை",
    };

    return weekdayMap[englishWeekday] || englishWeekday;
  };

  // Get Tamil month names
  const getMonthName = (monthNum) => {
    const tamilMonthNames = {
      1: "தை (January)",
      2: "மாசி (February)",
      3: "பங்குனி (March)",
      4: "சித்திரை (April)",
      5: "வைகாசி (May)",
      6: "ஆனி (June)",
      7: "ஆடி (July)",
      8: "ஆவணி (August)",
      9: "புரட்டாசி (September)",
      10: "ஐப்பசி (October)",
      11: "கார்த்திகை (November)",
      12: "மார்கழி (December)",
    };

    return tamilMonthNames[monthNum] || `Month ${monthNum}`;
  };

  return (
    <div className="special-days-page">
      <h1 className="page-title">Special Days Calendar</h1>

      <div className="filters-container">
        <div className="filters">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="year-select">Year:</label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={handleYearChange}
                className="select-input"
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={new Date().getFullYear() - 5 + i}>
                    {new Date().getFullYear() - 5 + i}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="month-select">Month:</label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={handleMonthChange}
                className="select-input"
              >
                <option value="all">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {getMonthName(i + 1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="category-select">Category:</label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="select-input"
              >
                <option value="all">All Special Days</option>
                <option value="pournami">பௌர்ணமி (Full Moon)</option>
                <option value="amavasai">அமாவாசை (New Moon)</option>
                <option value="ekadashi">ஏகாதசி (Ekadashi)</option>
                <option value="ashtami">அஷ்டமி (Ashtami)</option>
                <option value="navami">நவமி (Navami)</option>
                <option value="trayodashi">திரயோதசி (Trayodashi)</option>
                <option value="sashti">சஷ்டி (Sashti)</option>
                <option value="dwadashi">துவாதசி (Dwadashi)</option>
                <option value="rs-nakshatra">
                  ராக்ஷஸ நட்சத்திரம் (RS Nakshatra)
                </option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="paksham-select">Paksham:</label>
              <select
                id="paksham-select"
                value={selectedPaksham}
                onChange={handlePakshamChange}
                className="select-input"
              >
                <option value="all">All Paksham</option>
                <option value="shukla">சுக்ல பக்ஷ (Waxing/Bright)</option>
                <option value="krishna">கிருஷ்ண பக்ஷ (Waning/Dark)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <div>Loading special days...</div>
        </div>
      ) : specialDays.length === 0 ? (
        <div className="no-data">
          No special days found for the selected criteria
        </div>
      ) : (
        <div className="special-days-grid">
          {specialDays.map((day, index) => (
            <div key={index} className="special-day-card">
              <div className="special-day-date">{formatDate(day.date)}</div>
              <div className="special-day-weekday">{getWeekdayName(day)}</div>
              <div className="special-day-type">{getSpecialDayType(day)}</div>
              {day.main_nakshatra && (
                <div className="special-day-nakshatra">
                  Nakshatra: {day.main_nakshatra}
                  {day.is_rs_nakshatra && <span className="rs-badge">RS</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {false && debug && (
        <div className="debug-section">
          <h3>Debug Info:</h3>
          <pre>{JSON.stringify(debug, null, 2)}</pre>
        </div>
      )}

      <style jsx>{`
        .special-days-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .page-title {
          text-align: center;
          margin-bottom: 24px;
          color: #4f46e5;
          font-size: 2rem;
          font-weight: 700;
        }

        .filters-container {
          background: #f8fafc;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }

        .filters {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        .filter-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          width: 100%;
        }

        .filter-group {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 8px;
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .filter-group label {
          font-weight: 500;
          color: #1e293b;
          min-width: 80px;
          margin-right: 12px;
        }

        .select-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 1rem;
          color: #334155;
          background-color: #f8fafc;
          transition: all 0.2s;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 12px top 50%;
          background-size: 12px auto;
          padding-right: 28px;
        }

        .select-input:hover, .select-input:focus {
          border-color: #cbd5e1;
          outline: none;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .loading, .no-data {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 1.1rem;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .special-days-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .special-day-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .special-day-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        }

        .special-day-date {
          font-weight: bold;
          color: #4f46e5;
          font-size: 1.1rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
        }

        .special-day-weekday {
          font-size: 0.95rem;
          color: #64748b;
          margin: 4px 0;
        }

        .special-day-type {
          font-size: 1.05rem;
          color: #0f172a;
          font-weight: 600;
          margin: 8px 0;
          padding: 4px 8px;
          background: #f1f5f9;
          border-radius: 4px;
          display: inline-block;
        }

        .special-day-nakshatra {
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          color: #475569;
          margin-top: 4px;
        }

        .rs-badge {
          background-color: #ef4444;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: 8px;
          display: inline-block;
          vertical-align: middle;
          font-weight: bold;
        }

        .debug-section {
          margin-top: 30px;
          padding: 15px;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .debug-section pre {
          white-space: pre-wrap;
          font-size: 12px;
          overflow-x: auto;
        }

        @media (max-width: 768px) {
          .filters-container {
            padding: 16px;
          }

          .filter-group {
            flex-direction: row;
            align-items: center;
            padding: 8px 12px;
          }

          .filter-group label {
            min-width: 70px;
            margin-right: 8px;
            margin-bottom: 0;
          }

          .select-input {
            flex: 1;
            width: auto;
          }

          .special-days-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .filter-row {
            grid-template-columns: 1fr;
          }

          .filter-group {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .filter-group label {
            margin-bottom: 4px;
          }

          .select-input {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}