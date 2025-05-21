// components/AuspiciousTimeFinder.js
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuspiciousTimeFinder() {
  // Default date range: today to 30 days from now
  const today = new Date();
  const defaultEndDate = new Date();
  defaultEndDate.setDate(today.getDate() + 30);

  const [activityType, setActivityType] = useState("travel");
  const [dateRange, setDateRange] = useState({
    start: today.toISOString().split("T")[0],
    end: defaultEndDate.toISOString().split("T")[0],
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("asc");
  // Add new state for Mythra Muhurtham filter
  const [showOnlyMythraMuhurtham, setShowOnlyMythraMuhurtham] = useState(false);
  // Add new state for calendar export
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // List of RS Nakshatras to avoid
  const rsNakshatraList = [
    "Bharani",
    "Krittika",
    "Ardra",
    "Ashlesha",
    "Magha",
    "Purva Phalguni",
    "Chitra",
    "Swati",
    "Swathi",
    "Vishakha",
    "Jyeshtha",
    "Purva Ashadha",
    "Purva Bhadrapada",
    "பரணி",
    "கார்த்திகை",
    "திருவாதிரை",
    "ஆயில்யம்",
    "மகம்",
    "பூரம்",
    "சித்திரை",
    "சுவாதி",
    "ஸ்வாதி",
    "விசாகம்",
    "கேட்டை",
    "பூராடம்",
    "பூரட்டாதி",
  ];

  const findAuspiciousTimes = async () => {
    setLoading(true);

    try {
      // Setup the query
      let query = supabase
        .from("daily_panchangam")
        .select("*")
        .gte("date", dateRange.start)
        .lte("date", dateRange.end);

      // Add filter for Mythra Muhurtham if checkbox is selected
      if (showOnlyMythraMuhurtham) {
        query = query.eq("is_mythra_muhurtham", true);
      }

      // Execute the query with ordering
      const { data, error } = await query.order("date", { ascending: true });

      if (error) throw error;

      let processedResults = [];

      if (data && data.length > 0) {
        // Apply filters based on activity type
        processedResults = data.map((day) => {
          // Score calculation factors
          let score = day.cosmic_score || 5; // Base score
          let favorabilityLevel = "neutral";
          let bestTimeRange = "";
          let notes = [];

          // Check if it's an RS Nakshatra day - major factor
          const isRSNakshatra = rsNakshatraList.includes(day.main_nakshatra);
          if (isRSNakshatra) {
            score -= 3; // Big penalty for RS Nakshatra
            notes.push("RS Nakshatra day - unfavorable for most activities");
          }

          // Check for special days - generally positive
          if (day.is_pournami) {
            score += 0.5;
            notes.push("Full Moon day (பௌர்ணமி)");
          }

          // Check for Mythra Muhurtham - highly auspicious
          if (day.is_mythra_muhurtham) {
            score += 2; // Significant boost for Mythra Muhurtham
            notes.push(
              "Mythra Muhurtham - Making even small loan payments during this period can accelerate your loan closure. Consider scheduling a payment during this auspicious time.",
            );
          }

          // Activity-specific adjustments
          switch (activityType) {
            case "medical":
              // For medical, avoid RS Nakshatras and favor higher cosmic scores
              if (isRSNakshatra) {
                score -= 1; // Additional penalty for medical on RS day
                notes.push("Avoid medical procedures on RS Nakshatra days");
              }

              // Determine best time avoiding Rahu Kalam
              bestTimeRange = `Morning hours (avoid ${day.rahu_kalam || "Rahu Kalam"})`;
              break;

            case "travel":
              // For travel, check weekday and avoid Chandrashtama
              if (day.vaara === "ஞாயிற்றுக்கிழமை" || day.vaara === "Sunday") {
                score += 0.5; // Sunday is good for travel
              }

              if (day.chandrashtama_for && day.chandrashtama_for.length > 0) {
                notes.push(
                  "Check if your birth star is in Chandrashtama today",
                );
              }

              // Determine best time avoiding Rahu Kalam and Yamagandam
              bestTimeRange = `Early morning or afternoon (avoid ${day.rahu_kalam || "Rahu Kalam"} and ${day.yamagandam || "Yamagandam"})`;
              break;

            case "financial":
              // For financial, check weekday and avoid Rahu Kalam
              if (
                day.vaara === "வியாழக்கிழமை" ||
                day.vaara === "Thursday" ||
                day.vaara === "வெள்ளிக்கிழமை" ||
                day.vaara === "Friday"
              ) {
                score += 0.7; // Thursday/Friday good for financial
                notes.push(
                  "Thursday/Friday favorable for financial activities",
                );
              }

              if (isRSNakshatra) {
                score -= 1; // Additional penalty for financial on RS day
                notes.push("Avoid financial transactions on RS Nakshatra days");
              }

              // If it's Mythra Muhurtham, add extra score for financial activities
              if (day.is_mythra_muhurtham) {
                score += 1; // Additional bonus for financial on Mythra Muhurtham
              }

              // Abhijit Muhurta is good for financial transactions
              bestTimeRange = day.abhijit_muhurta || "Midday (Abhijit Muhurta)";
              break;

            default:
              bestTimeRange = "Morning hours preferred";
          }

          // Determine favorability level based on score
          if (score >= 7.5) {
            favorabilityLevel = "highly_favorable";
          } else if (score >= 6) {
            favorabilityLevel = "favorable";
          } else if (score <= 4) {
            favorabilityLevel = "unfavorable";
          } else {
            favorabilityLevel = "neutral";
          }

          // Format date for display
          const date = new Date(day.date);
          const formattedDate = date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          return {
            date: day.date,
            formattedDate,
            dayOfWeek: day.vaara || formattedDate.split(",")[0],
            nakshatra: day.main_nakshatra,
            score: parseFloat(score.toFixed(1)),
            favorabilityLevel,
            bestTimeRange,
            notes,
            isRSNakshatra,
            isMythraMuhurtham: day.is_mythra_muhurtham,
            rahuKalam: day.rahu_kalam,
            yamagandam: day.yamagandam,
            isChandrashtamaFor: day.chandrashtama_for,
          };
        });

        // Apply sorting
        processedResults.sort((a, b) => {
          if (sortBy === "date") {
            return sortDirection === "asc"
              ? new Date(a.date) - new Date(b.date)
              : new Date(b.date) - new Date(a.date);
          } else if (sortBy === "score") {
            return sortDirection === "asc"
              ? a.score - b.score
              : b.score - a.score;
          }
          return 0;
        });
      }

      setResults(processedResults);
    } catch (error) {
      console.error("Error finding auspicious times:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get appropriate label for activity type
  const getActivityLabel = () => {
    switch (activityType) {
      case "medical":
        return "🏥 Medical Procedures";
      case "travel":
        return "✈️ Travel & Journeys";
      case "financial":
        return "💰 Financial Transactions";
      default:
        return "Activity";
    }
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, reset to ascending
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  // Get arrow indicator for sort
  const getSortArrow = (field) => {
    if (sortBy !== field) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  // Check if user is on mobile device
  const isMobileDevice = () => {
    return (
      typeof window !== "undefined" &&
      (navigator.userAgent.match(/Android/i) ||
        navigator.userAgent.match(/webOS/i) ||
        navigator.userAgent.match(/iPhone/i) ||
        navigator.userAgent.match(/iPad/i) ||
        navigator.userAgent.match(/iPod/i) ||
        navigator.userAgent.match(/BlackBerry/i) ||
        navigator.userAgent.match(/Windows Phone/i))
    );
  };

  // Create iCalendar formatted date
  const formatICSDate = (dateString, includeTime = false) => {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    if (includeTime) {
      const hours = String(date.getUTCHours()).padStart(2, "0");
      const minutes = String(date.getUTCMinutes()).padStart(2, "0");
      const seconds = String(date.getUTCSeconds()).padStart(2, "0");
      return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    }

    return `${year}${month}${day}`;
  };

  // Create iCalendar event
  const createICSEvent = (result) => {
    const dateObj = new Date(result.date);

    // Get tomorrow's date for event end (all-day event)
    const endDateObj = new Date(dateObj);
    endDateObj.setDate(endDateObj.getDate() + 1);

    // Format dates for iCalendar
    const eventStart = formatICSDate(dateObj);
    const eventEnd = formatICSDate(endDateObj);

    // Create unique id for event
    const uuid = `event-${result.date}-${Math.random().toString(36).substring(2, 11)}`;

    // Create event title based on activity and favorability
    const activityEmoji =
      activityType === "medical"
        ? "🏥"
        : activityType === "travel"
          ? "✈️"
          : activityType === "financial"
            ? "💰"
            : "📅";

    const favorabilityEmoji =
      result.favorabilityLevel === "highly_favorable"
        ? "🟢"
        : result.favorabilityLevel === "favorable"
          ? "🟡"
          : "⚪";

    // Build descriptive event title
    let eventTitle = `${favorabilityEmoji} ${activityEmoji} Auspicious Time: ${activityType.charAt(0).toUpperCase() + activityType.slice(1)}`;

    if (result.isMythraMuhurtham) {
      eventTitle = `✨ ${eventTitle} (Mythra Muhurtham)`;
    }

    // Create detailed description
    let description = `Auspicious day for ${activityType}\n`;
    description += `Favorability: ${result.favorabilityLevel.replace("_", " ")}\n`;
    description += `Score: ${result.score}/10\n`;
    description += `Nakshatra: ${result.nakshatra}\n`;
    description += `Best Time: ${result.bestTimeRange}\n\n`;

    if (result.notes && result.notes.length > 0) {
      description += "Notes:\n";
      result.notes.forEach((note) => {
        description += `• ${note}\n`;
      });
    }

    description += `\nCaution Times:\n`;
    description += `• Rahu Kalam: ${result.rahuKalam || "N/A"}\n`;
    description += `• Yamagandam: ${result.yamagandam || "N/A"}\n`;

    // Create category based on activity type and special features
    let categories = [
      `Auspicious Day`,
      `${activityType.charAt(0).toUpperCase() + activityType.slice(1)}`,
    ];

    if (result.isMythraMuhurtham) {
      categories.push("Mythra Muhurtham");
    }

    // Assemble the iCalendar event
    let icsEvent = [
      "BEGIN:VEVENT",
      `UID:${uuid}`,
      `DTSTAMP:${formatICSDate(new Date(), true)}`,
      `DTSTART;VALUE=DATE:${eventStart}`,
      `DTEND;VALUE=DATE:${eventEnd}`,
      `SUMMARY:${eventTitle}`,
      `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
      `CATEGORIES:${categories.join(",")}`,
      // Add alarm/reminder for 8:00 AM on the event day
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder: Auspicious day today",
      "TRIGGER;VALUE=DATE-TIME:" +
        formatICSDate(new Date(dateObj.setHours(8, 0, 0)), true),
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");

    return icsEvent;
  };

  // Create iCalendar file content
  const createICSFile = (favorableDays) => {
    // File header
    let fileContent =
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//AuspiciousTimeFinder//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:Auspicious Times for ${activityType.charAt(0).toUpperCase() + activityType.slice(1)}`,
        "X-WR-TIMEZONE:UTC",
      ].join("\r\n") + "\r\n";

    // Add each event
    favorableDays.forEach((day) => {
      fileContent += createICSEvent(day) + "\r\n";
    });

    // File footer
    fileContent += "END:VCALENDAR";

    return fileContent;
  };

  // Helper function to download file
  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });

    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      // For IE
      window.navigator.msSaveOrOpenBlob(blob, filename);
    } else {
      // For other browsers
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    }
  };

  // For iOS devices - use webcal protocol
  const addToAppleCalendar = (content) => {
    const base64Content = btoa(unescape(encodeURIComponent(content)));
    const dataUri = `data:text/calendar;charset=utf-8;base64,${base64Content}`;
    window.open(dataUri);

    // Alternative approach using webcal protocol
    // const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    // const url = URL.createObjectURL(blob);
    // const webcalUrl = "webcal://" + window.location.host + url.substring(url.indexOf(":", "https:".length));
    // window.location.href = webcalUrl;
  };

  // For Android devices
  const addToGoogleCalendar = (events) => {
    // Create Google Calendar URL for the first event
    // Note: Google Calendar URL can only handle one event at a time
    if (events.length === 0) return;

    const event = events[0];
    const dateObj = new Date(event.date);

    // Format date for Google Calendar URL: YYYYMMDD
    const formattedDate = dateObj.toISOString().split("T")[0].replace(/-/g, "");

    // Create title and details
    const title = encodeURIComponent(`Auspicious Day for ${activityType}`);
    const details = encodeURIComponent(
      `Favorability: ${event.favorabilityLevel.replace("_", " ")}\n` +
        `Score: ${event.score}/10\n` +
        `Nakshatra: ${event.nakshatra}\n` +
        `Best Time: ${event.bestTimeRange}\n` +
        (event.notes ? event.notes.join("\n") : ""),
    );

    // Create Google Calendar URL
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formattedDate}/${formattedDate}&details=${details}`;

    // Open the URL in a new tab
    window.open(googleCalUrl, "_blank");

    // Show notification to user about adding more events
    if (events.length > 1) {
      alert(
        `You have ${events.length} favorable days. Only the first day was added to your calendar. Please repeat this process for additional days.`,
      );
    }
  };

  // Export results as calendar events
  const exportResults = () => {
    setExportLoading(true);
    setExportSuccess(false);

    try {
      // Filter only favorable days
      const favorableDays = results.filter(
        (result) =>
          result.favorabilityLevel === "highly_favorable" ||
          result.favorabilityLevel === "favorable",
      );

      if (favorableDays.length === 0) {
        alert("No favorable days found to export to calendar.");
        setExportLoading(false);
        return;
      }

      // Create iCalendar file content
      const icsContent = createICSFile(favorableDays);

      // Check device type
      if (isMobileDevice()) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isIOS) {
          // Use Apple Calendar approach
          addToAppleCalendar(icsContent);
        } else {
          // Use Google Calendar approach (Android)
          addToGoogleCalendar(favorableDays);
        }
      } else {
        // Desktop - download the file
        const filename = `auspicious-${activityType}-times.ics`;
        downloadFile(icsContent, filename);
      }

      setExportSuccess(true);
    } catch (error) {
      console.error("Error exporting calendar events:", error);
      alert("Failed to export calendar events. Please try again.");
    } finally {
      setExportLoading(false);

      // Reset success message after 3 seconds
      if (exportSuccess) {
        setTimeout(() => {
          setExportSuccess(false);
        }, 3000);
      }
    }
  };

  // Add a single day to calendar
  const addDayToCalendar = (day) => {
    try {
      // Create iCalendar content for single day
      const icsContent = createICSFile([day]);

      // Check device type
      if (isMobileDevice()) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isIOS) {
          // Use Apple Calendar approach
          addToAppleCalendar(icsContent);
        } else {
          // Use Google Calendar approach (Android)
          addToGoogleCalendar([day]);
        }
      } else {
        // Desktop - download the file
        const dateStr = new Date(day.date).toISOString().split("T")[0];
        const filename = `auspicious-${activityType}-${dateStr}.ics`;
        downloadFile(icsContent, filename);
      }

      // Show success message
      alert(`Added ${new Date(day.date).toLocaleDateString()} to calendar!`);
    } catch (error) {
      console.error("Error adding day to calendar:", error);
      alert("Failed to add day to calendar. Please try again.");
    }
  };

  return (
    <div className="auspicious-time-finder">
      <h1 className="header">🔍 Auspicious Time Finder</h1>

      <div className="search-panel">
        <div className="activity-selector">
          <h2>Activity Type:</h2>
          <div className="activity-buttons">
            <button
              className={`activity-button ${activityType === "medical" ? "selected" : ""}`}
              onClick={() => setActivityType("medical")}
            >
              <span role="img" aria-label="Medical">
                🏥
              </span>{" "}
              Medical
            </button>
            <button
              className={`activity-button ${activityType === "travel" ? "selected" : ""}`}
              onClick={() => setActivityType("travel")}
            >
              <span role="img" aria-label="Travel">
                ✈️
              </span>{" "}
              Travel
            </button>
            <button
              className={`activity-button ${activityType === "financial" ? "selected" : ""}`}
              onClick={() => setActivityType("financial")}
            >
              <span role="img" aria-label="Financial">
                💰
              </span>{" "}
              Financial
            </button>
          </div>
        </div>

        <div className="date-range">
          <h2>Date Range:</h2>
          <div className="date-inputs">
            <div className="date-input">
              <label htmlFor="start-date">From:</label>
              <input
                type="date"
                id="start-date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                min={today.toISOString().split("T")[0]}
              />
            </div>
            <div className="date-input">
              <label htmlFor="end-date">To:</label>
              <input
                type="date"
                id="end-date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                min={dateRange.start}
              />
            </div>
          </div>
        </div>

        {/* Add Mythra Muhurtham filter */}
        <div className="mythra-muhurtham-filter">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={showOnlyMythraMuhurtham}
              onChange={(e) => setShowOnlyMythraMuhurtham(e.target.checked)}
            />
            <span className="checkbox-text">
              Show only Mythra Muhurtham days
            </span>
            <span className="mythra-badge">✨</span>
          </label>
        </div>

        <button className="search-button" onClick={findAuspiciousTimes}>
          Search for Auspicious Times
        </button>
      </div>

      {loading ? (
        <div className="loading">Finding auspicious times...</div>
      ) : results.length > 0 ? (
        <div className="results-container">
          <div className="results-header">
            <h2>Results for {getActivityLabel()}</h2>
            <div className="sort-controls">
              <label>Sort by:</label>
              <button
                className={`sort-button ${sortBy === "date" ? "active" : ""}`}
                onClick={() => handleSortChange("date")}
              >
                Date {getSortArrow("date")}
              </button>
              <button
                className={`sort-button ${sortBy === "score" ? "active" : ""}`}
                onClick={() => handleSortChange("score")}
              >
                Score {getSortArrow("score")}
              </button>

              {/* Enhanced Export Button with Feedback */}
              <button
                className={`export-button ${exportLoading ? "loading" : ""} ${exportSuccess ? "success" : ""}`}
                onClick={exportResults}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <>
                    Exporting<span className="loading-dots">...</span>
                  </>
                ) : exportSuccess ? (
                  <>Exported ✓</>
                ) : (
                  <>Add to Calendar</>
                )}
              </button>
            </div>
          </div>

          <div className="results-list">
            {results.map((result) => (
              <div
                key={result.date}
                className={`result-card ${result.favorabilityLevel} ${result.isMythraMuhurtham ? "mythra-muhurtham" : ""}`}
              >
                <div className="result-header">
                  <div
                    className={`favorability-indicator ${result.favorabilityLevel}`}
                  >
                    {result.favorabilityLevel === "highly_favorable" &&
                      "🟢 Highly Favorable"}
                    {result.favorabilityLevel === "favorable" && "🟡 Favorable"}
                    {result.favorabilityLevel === "neutral" && "⚪ Neutral"}
                    {result.favorabilityLevel === "unfavorable" &&
                      "🔴 Unfavorable"}
                  </div>
                  <div className="date-score">
                    <span className="score">{result.score}/10</span>
                  </div>
                </div>

                <div className="result-details">
                  <h3 className="result-date">
                    {new Date(result.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {result.isMythraMuhurtham && (
                      <span className="mythra-indicator">
                        ✨ Mythra Muhurtham
                      </span>
                    )}
                  </h3>

                  <div className="detail-row">
                    <span className="detail-label">Nakshatra:</span>
                    <span
                      className={`detail-value ${result.isRSNakshatra ? "rs-nakshatra" : ""}`}
                    >
                      {result.nakshatra}
                      {result.isRSNakshatra && (
                        <span className="rs-badge">RS</span>
                      )}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Best Time:</span>
                    <span className="detail-value">{result.bestTimeRange}</span>
                  </div>

                  {result.notes.length > 0 && (
                    <div className="notes">
                      <span className="notes-label">Notes:</span>
                      <ul className="notes-list">
                        {result.notes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="caution-timings">
                    <div className="caution-time">
                      <span className="caution-label">Rahu Kalam:</span>
                      <span className="caution-value">
                        {result.rahuKalam || "N/A"}
                      </span>
                    </div>
                    <div className="caution-time">
                      <span className="caution-label">Yamagandam:</span>
                      <span className="caution-value">
                        {result.yamagandam || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Add single calendar button */}
                  {(result.favorabilityLevel === "highly_favorable" ||
                    result.favorabilityLevel === "favorable") && (
                    <button
                      className="add-to-calendar-button"
                      onClick={() => addDayToCalendar(result)}
                    >
                      <span className="calendar-icon">📅</span> Add this day to
                      calendar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-results">
          {results.length === 0 && !loading ? (
            <p>
              Select your criteria and click "Search" to find auspicious times.
            </p>
          ) : (
            <p>No suitable times found for the selected criteria.</p>
          )}
        </div>
      )}

      <style jsx>{`
        .auspicious-time-finder {
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

        .search-panel {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 15px;
          margin-bottom: 20px;
        }

        .activity-selector h2,
        .date-range h2 {
          font-size: 1.1rem;
          margin-top: 0;
          margin-bottom: 10px;
        }

        .activity-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 15px;
        }

        .activity-button {
          padding: 8px 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s;
        }

        .activity-button.selected {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .date-inputs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 15px;
        }

        .date-input {
          flex: 1;
          min-width: 120px;
        }

        .date-input label {
          display: block;
          margin-bottom: 5px;
          font-size: 0.9rem;
        }

        .date-input input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        /* Mythra Muhurtham filter styling */
        .mythra-muhurtham-filter {
          margin-bottom: 15px;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .checkbox-text {
          margin-left: 8px;
          font-weight: 500;
        }

        .mythra-badge {
          margin-left: 8px;
          color: #ca8a04;
          font-size: 1.2rem;
        }

        .search-button {
          width: 100%;
          padding: 10px;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .loading,
        .no-results {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .results-container {
          margin-bottom: 20px;
        }

        .results-header {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 15px;
        }

        .results-header h2 {
          margin: 0;
          font-size: 1.2rem;
        }

        .sort-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .sort-button {
          padding: 5px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
        }

        .sort-button.active {
          background: #f3f4f6;
          font-weight: bold;
        }

        .export-button {
          padding: 5px 10px;
          border: none;
          border-radius: 4px;
          background: #4f46e5;
          color: white;
          cursor: pointer;
          margin-left: auto;
          position: relative;
          min-width: 130px;
          text-align: center;
        }

        .export-button.loading {
          background: #818cf8;
          cursor: wait;
        }

        .export-button.success {
          background: #10b981;
        }

        .loading-dots {
          display: inline-block;
          animation: loadingDots 1.5s infinite;
        }

        @keyframes loadingDots {
          0%,
          20% {
            content: ".";
          }
          40% {
            content: "..";
          }
          60%,
          100% {
            content: "...";
          }
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .result-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 15px;
          border-left: 4px solid #9ca3af; /* Default border */
        }

        .result-card.highly_favorable {
          border-left-color: #22c55e; /* Green */
        }

        .result-card.favorable {
          border-left-color: #eab308; /* Yellow */
        }

        .result-card.unfavorable {
          border-left-color: #ef4444; /* Red */
        }

        /* Mythra Muhurtham specific styling */
        .result-card.mythra-muhurtham {
          border-left-width: 6px;
          border-left-color: #facc15; /* Gold/Yellow */
          background-color: #fffef0; /* Very light yellow */
        }

        .mythra-indicator {
          margin-left: 10px;
          font-size: 0.9rem;
          color: #ca8a04;
          font-weight: 500;
          vertical-align: middle;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .favorability-indicator {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .favorability-indicator.highly_favorable {
          background-color: rgba(34, 197, 94, 0.1);
          color: #15803d;
        }

        .favorability-indicator.favorable {
          background-color: rgba(234, 179, 8, 0.1);
          color: #854d0e;
        }

        .favorability-indicator.neutral {
          background-color: rgba(156, 163, 175, 0.1);
          color: #4b5563;
        }

        .favorability-indicator.unfavorable {
          background-color: rgba(239, 68, 68, 0.1);
          color: #b91c1c;
        }

        .date-score {
          display: flex;
          align-items: center;
        }

        .score {
          font-size: 1.1rem;
          font-weight: bold;
          color: #4b5563;
        }

        .result-date {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
        }

        .detail-row {
          display: flex;
          margin-bottom: 8px;
        }

        .detail-label {
          width: 100px;
          font-weight: 500;
        }

        .detail-value {
          flex: 1;
        }

        .rs-nakshatra {
          color: #ef4444;
        }

        .rs-badge {
          background-color: #ef4444;
          color: white;
          font-size: 0.7rem;
          padding: 1px 4px;
          border-radius: 3px;
          margin-left: 5px;
        }

        .notes {
          margin: 10px 0;
        }

        .notes-label {
          font-weight: 500;
        }

        .notes-list {
          margin: 5px 0 0;
          padding-left: 20px;
        }

        .notes-list li {
          margin-bottom: 3px;
          font-size: 0.9rem;
        }

        .caution-timings {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #eee;
        }

        .caution-time {
          background-color: #fff7ed;
          border: 1px solid #fdba74;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 0.85rem;
        }

        .caution-label {
          font-weight: 500;
          margin-right: 5px;
        }

        /* Add to Calendar Button */
        .add-to-calendar-button {
          margin-top: 15px;
          padding: 8px 12px;
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          color: #334155;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          transition: all 0.2s ease;
        }

        .add-to-calendar-button:hover {
          background-color: #f1f5f9;
          border-color: #94a3b8;
        }

        .calendar-icon {
          margin-right: 6px;
        }

        @media (min-width: 640px) {
          .results-header {
            flex-direction: row;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
