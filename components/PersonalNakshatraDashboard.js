// components/PersonalNakshatraDashboard.js
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function PersonalNakshatraDashboard() {
  // Helper function to safely parse JSON fields
  const parseJsonField = (field) => {
    if (field === null || field === undefined) return "Unknown";

    // If it's already a primitive string and not JSON-like, return it directly
    if (
      typeof field === "string" &&
      !field.startsWith("[") &&
      !field.startsWith("{")
    ) {
      return field;
    }

    // If it's already an object with a name property, return the name
    if (typeof field === "object" && field !== null) {
      if (field.name) return field.name;
      // Check for field.ame (common typo in the data)
      if (field.ame) return field.ame;
    }

    // If it's a string that looks like JSON (starts with [ or {)
    if (
      typeof field === "string" &&
      (field.startsWith("[") || field.startsWith("{"))
    ) {
      try {
        // Try to parse it
        const parsed = JSON.parse(field);

        // Handle array
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && parsed[0]) {
            // Return first element's name or ame (typo in some data)
            if (parsed[0].name) return parsed[0].name;
            if (parsed[0].ame) return parsed[0].ame;
            return "Unknown";
          }
          return "Unknown";
        }

        // Handle object
        if (parsed && typeof parsed === "object") {
          if (parsed.name) return parsed.name;
          // Check for parsed.ame (common typo in the data)
          if (parsed.ame) return parsed.ame;
          return "Unknown";
        }

        // Return original if parsing succeeded but format is unexpected
        return String(field);
      } catch (e) {
        // If parsing fails, try to extract name or ame using regex
        const nameMatch = String(field).match(
          /["'](?:n|)ame["']\s*:\s*["']([^"']+)["']/,
        );
        if (nameMatch && nameMatch[1]) {
          return nameMatch[1];
        }

        // Clean up escape characters and return
        return String(field)
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\")
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "\t")
          .replace(/\\([^"])/g, "$1");
      }
    }

    // Return stringified version for any other type
    return String(field);
  };

  const [birthNakshatra, setBirthNakshatra] = useState("");
  const [favorableDays, setFavorableDays] = useState([]);
  const [chandrashtamaDays, setChandrashtamaDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nakshatraInfo, setNakshatraInfo] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("month"); // "week", "month", "year"
  const [personalScores, setPersonalScores] = useState([]);
  const [showScoreDetails, setShowScoreDetails] = useState(null);
  const [error, setError] = useState(null);
  // Add new state for calendar export
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // List of all nakshatras
  const allNakshatras = [
    { english: "Ashwini", tamil: "அசுவினி" },
    { english: "Bharani", tamil: "பரணி" },
    { english: "Krittika", tamil: "கார்த்திகை" },
    { english: "Rohini", tamil: "ரோகிணி" },
    { english: "Mrigashira", tamil: "மிருகசீரிஷம்" },
    { english: "Ardra", tamil: "திருவாதிரை" },
    { english: "Punarvasu", tamil: "புனர்பூசம்" },
    { english: "Pushya", tamil: "பூசம்" },
    { english: "Ashlesha", tamil: "ஆயில்யம்" },
    { english: "Magha", tamil: "மகம்" },
    { english: "Purva Phalguni", tamil: "பூரம்" },
    { english: "Uttara Phalguni", tamil: "உத்திரம்" },
    { english: "Hasta", tamil: "ஹஸ்தம்" },
    { english: "Chitra", tamil: "சித்திரை" },
    { english: "Swati", tamil: "சுவாதி" },
    { english: "Vishakha", tamil: "விசாகம்" },
    { english: "Anuradha", tamil: "அனுஷம்" },
    { english: "Jyeshtha", tamil: "கேட்டை" },
    { english: "Mula", tamil: "மூலம்" },
    { english: "Purva Ashadha", tamil: "பூராடம்" },
    { english: "Uttara Ashadha", tamil: "உத்திராடம்" },
    { english: "Shravana", tamil: "திருவோணம்" },
    { english: "Dhanishta", tamil: "அவிட்டம்" },
    { english: "Shatabhisha", tamil: "சதயம்" },
    { english: "Purva Bhadrapada", tamil: "பூரட்டாதி" },
    { english: "Uttara Bhadrapada", tamil: "உத்திரட்டாதி" },
    { english: "Revati", tamil: "ரேவதி" },
  ];

  // Nakshatra characteristics and information
  const nakshatraCharacteristics = {
    Ashwini: {
      deity: "Ashwini Kumaras",
      symbol: "Horse's Head",
      ruler: "Ketu",
      element: "Fire",
      qualities: ["Swift", "Healing", "Youthful", "Energetic"],
      favorable: ["Medical profession", "Transportation", "Sports"],
      unfavorable: ["Procrastination", "Overexertion"],
    },
    Bharani: {
      deity: "Yama",
      symbol: "Yoni (Female Organ)",
      ruler: "Venus",
      element: "Earth",
      qualities: ["Restraint", "Bearing Burdens", "Transformation"],
      favorable: ["Medical/healthcare", "Research", "Transformation work"],
      unfavorable: ["Impulsiveness", "Recklessness"],
    },
    Pushya: {
      deity: "Brihaspati",
      symbol: "Flower or Circle",
      ruler: "Saturn",
      element: "Water",
      qualities: ["Nurturing", "Prosperity", "Growth", "Harmony"],
      favorable: ["Teaching", "Counseling", "Spirituality", "Farming"],
      unfavorable: ["Materialism", "Overindulgence"],
    },
    Magha: {
      deity: "Pitris (Ancestors)",
      symbol: "Throne",
      ruler: "Ketu",
      element: "Fire",
      qualities: ["Leadership", "Power", "Dignity", "Authority"],
      favorable: ["Leadership positions", "Government", "Fame"],
      unfavorable: ["Arrogance", "Stubbornness"],
    },
    Chitra: {
      deity: "Vishvakarma (Divine Architect)",
      symbol: "Pearl or Gem",
      ruler: "Mars",
      element: "Air",
      qualities: ["Creativity", "Beauty", "Skill", "Precision"],
      favorable: ["Arts", "Design", "Architecture", "Precision work"],
      unfavorable: ["Indecision", "Perfectionism"],
    },
    // Add more as needed
  };

  // Initialize from localStorage if available
  useEffect(() => {
    try {
      const savedNakshatra = localStorage.getItem("birthNakshatra");
      if (savedNakshatra) {
        setBirthNakshatra(savedNakshatra);
      }
    } catch (e) {
      console.error("Error reading from localStorage:", e);
    }
  }, []);

  // When birth nakshatra changes, save to localStorage and fetch data
  useEffect(() => {
    if (birthNakshatra) {
      try {
        localStorage.setItem("birthNakshatra", birthNakshatra);
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }

      // Get characteristics
      const fetchNakshatraInfo = async () => {
        const { data, error } = await supabase
          .from("nakshatra_characteristics")
          .select("*")
          .eq("english_name", birthNakshatra)
          .single();

        if (error) {
          console.error("Failed to fetch Nakshatra info from DB:", error);
          setNakshatraInfo(null);
        } else {
          setNakshatraInfo(data);
        }
      };

      fetchNakshatraInfo();

      // Fetch personalized data
      fetchPersonalizedData();
    }
  }, [birthNakshatra, selectedPeriod, fetchPersonalizedData]);

  // Format dates for database query
  const formatDateForDb = (date) => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return ""; // Return empty string on error
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateString, includeYear = false) => {
    try {
      const date = new Date(dateString);
      const options = {
        weekday: "long",
        month: "short",
        day: "numeric",
      };

      if (includeYear) {
        options.year = "numeric";
      }

      return date.toLocaleDateString("en-US", options);
    } catch (e) {
      console.error("Error formatting date for display:", e);
      return dateString || "Unknown date"; // Return original string or placeholder
    }
  };

  // Helper function to get date range for chandrashtama (typically 2-2.5 days)
  const getDayRange = (startDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(startDate);
      end.setDate(end.getDate() + 1); // Approximately

      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}-${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    } catch (e) {
      console.error("Error calculating day range:", e);
      return "Date range unavailable"; // Return placeholder on error
    }
  };

  const fetchPersonalizedData = async () => {
    if (!birthNakshatra) return;

    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const endDate = new Date();

      switch (selectedPeriod) {
        case "week":
          endDate.setDate(today.getDate() + 7);
          break;
        case "month":
          endDate.setDate(today.getDate() + 30);
          break;
        case "year":
          endDate.setDate(today.getDate() + 365);
          break;
        default:
          endDate.setDate(today.getDate() + 30);
      }

      const formattedToday = formatDateForDb(today);
      const formattedEndDate = formatDateForDb(endDate);

      if (!formattedToday || !formattedEndDate) {
        throw new Error("Invalid date format");
      }

      // Fetch Panchangam data for range
      const { data, error } = await supabase
        .from("daily_panchangam")
        .select("*")
        .gte("date", formattedToday)
        .lte("date", formattedEndDate)
        .order("date");

      if (error) throw error;

      if (!data || data.length === 0) {
        setError("No panchang data available for the selected period");
        setLoading(false);
        return;
      }

      // Personal Score Calculation
      const processedDays = await Promise.all(
        data.map(async (day) => {
          try {
            const { data: scoreData, error: scoreError } = await supabase.rpc(
              "calculate_personal_score",
              {
                input_date: day.date,
                user_nakshatra: birthNakshatra,
              },
            );
            if (scoreError || !scoreData) return null;

            return {
              day,
              personalScore: scoreData,
            };
          } catch (err) {
            console.error("Error calculating score for", day.date, err);
            return null;
          }
        }),
      );

      const validProcessedDays = processedDays.filter(Boolean);

      if (validProcessedDays.length === 0) {
        setError("Could not calculate personal scores for any days");
        setLoading(false);
        return;
      }

      // Build final datasets
      const allPersonalScores = validProcessedDays.map((item) => ({
        date: item.day.date,
        personalScoreData: item.personalScore,
      }));

      const favorableResults = validProcessedDays
        .filter(
          (item) =>
            item.personalScore &&
            typeof item.personalScore.score === "number" &&
            item.personalScore.score >= 7.0,
        )
        .map((item) => ({
          date: item.day.date,
          formattedDate: formatDateForDisplay(item.day.date),
          nakshatra:
            item.day.main_nakshatra ||
            (item.day.nakshatra?.[0]?.name ?? "Unknown"),
          score: item.personalScore.score,
          personalScoreData: item.personalScore,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      // ✅ New Optimized: Fetch Chandrashtama Days via DB RPC
      const { data: chandraFromDb, error: chandraErr } = await supabase.rpc(
        "get_chandrashtama_days",
        {
          user_nakshatra: birthNakshatra,
          start_date: formattedToday,
          end_date: formattedEndDate,
        },
      );

      let chandrashtamaResults = [];

      if (chandraErr) {
        console.error("Error fetching Chandrashtama days:", chandraErr);
      } else {
        chandrashtamaResults = chandraFromDb.map((item) => ({
          date: item.date,
          formattedDate: formatDateForDisplay(item.date, true),
          dayRange: getDayRange(item.date),
          nakshatra: item.formatted_nakshatra,
        }));
      }

      setFavorableDays(favorableResults);
      setChandrashtamaDays(chandrashtamaResults);
      setPersonalScores(allPersonalScores);
    } catch (error) {
      console.error("Error fetching personalized data:", error);
      setError("Failed to fetch your personalized data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle nakshatra selection change
  const handleNakshatraChange = (e) => {
    setBirthNakshatra(e.target.value);
  };

  // Toggle score details view
  const toggleScoreDetails = (date) => {
    if (showScoreDetails === date) {
      setShowScoreDetails(null);
    } else {
      setShowScoreDetails(date);
    }
  };

  // Get color based on score
  const getScoreColor = (score) => {
    if (!score || typeof score !== "number") return "text-gray-600";
    if (score >= 7.0) return "text-green-600";
    if (score >= 5.0) return "text-amber-600";
    return "text-red-600";
  };

  // Get background color based on score
  const getScoreBgColor = (score) => {
    if (!score || typeof score !== "number") return "bg-gray-50";
    if (score >= 7.0) return "bg-green-50";
    if (score >= 5.0) return "bg-amber-50";
    return "bg-red-50";
  };

  // Safely get value from breakdown item
  const getBreakdownItemValue = (personalScoreData, itemPath) => {
    if (!personalScoreData || !personalScoreData.scoreBreakdown)
      return { name: "Unknown", score: 0 };

    const pathParts = itemPath.split(".");
    let current = personalScoreData.scoreBreakdown;

    for (const part of pathParts) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== "object"
      ) {
        return { name: "Unknown", score: 0 };
      }
      current = current[part];
    }

    if (current === null || current === undefined) {
      return { name: "Unknown", score: 0 };
    }

    return current;
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

  // Create favorable day iCalendar event
  const createFavorableDayEvent = (day) => {
    const dateObj = new Date(day.date);

    // Get tomorrow's date for event end (all-day event)
    const endDateObj = new Date(dateObj);
    endDateObj.setDate(endDateObj.getDate() + 1);

    // Format dates for iCalendar
    const eventStart = formatICSDate(dateObj);
    const eventEnd = formatICSDate(endDateObj);

    // Create unique id for event
    const uuid = `favorable-${day.date}-${Math.random().toString(36).substring(2, 11)}`;

    // Format the nakshatra
    const formattedNakshatra = parseJsonField(day.nakshatra);

    // Build event title
    const eventTitle = `🟢 Favorable Day (Score: ${day.score.toFixed(1)})`;

    // Build detailed description
    let description = `This is a favorable day for you based on your birth star ${birthNakshatra}.\n\n`;
    description += `Favorability Score: ${day.score.toFixed(1)}/10\n`;
    description += `Nakshatra: ${formattedNakshatra}\n\n`;

    if (day.personalScoreData && day.personalScoreData.tarabalamType) {
      description += `Tarabalam: ${day.personalScoreData.tarabalamType}\n`;
      if (day.personalScoreData.tarabalamExplanation?.en) {
        description += `${day.personalScoreData.tarabalamExplanation.en}\n\n`;
      }
    }

    if (day.personalScoreData?.recommendations?.activities?.favorable?.en) {
      description += "Favorable Activities:\n";
      const favorableActivities =
        day.personalScoreData.recommendations.activities.favorable.en;
      if (Array.isArray(favorableActivities)) {
        favorableActivities.forEach((activity) => {
          description += `• ${activity}\n`;
        });
      } else {
        description += `• ${favorableActivities}\n`;
      }
      description += "\n";
    }

    if (day.personalScoreData?.recommendations?.activities?.unfavorable?.en) {
      description += "Activities to Avoid:\n";
      const unfavorableActivities =
        day.personalScoreData.recommendations.activities.unfavorable.en;
      if (Array.isArray(unfavorableActivities)) {
        unfavorableActivities.forEach((activity) => {
          description += `• ${activity}\n`;
        });
      } else {
        description += `• ${unfavorableActivities}\n`;
      }
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
      "CATEGORIES:Favorable Day,Personal Calendar",
      // Add alarm/reminder for 8:00 AM on the event day
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder: This is a favorable day for you!",
      "TRIGGER;VALUE=DATE-TIME:" +
        formatICSDate(new Date(dateObj.setHours(8, 0, 0)), true),
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");

    return icsEvent;
  };

  // Create Chandrashtama day iCalendar event
  const createChandrashtamaEvent = (day) => {
    const dateObj = new Date(day.date);

    // Get tomorrow's date for event end (all-day event)
    const endDateObj = new Date(dateObj);
    endDateObj.setDate(endDateObj.getDate() + 1);

    // Format dates for iCalendar
    const eventStart = formatICSDate(dateObj);
    const eventEnd = formatICSDate(endDateObj);

    // Create unique id for event
    const uuid = `chandrashtama-${day.date}-${Math.random().toString(36).substring(2, 11)}`;

    // Build event title
    const eventTitle = `⚠️ Chandrashtama Day - Caution`;

    // Build detailed description
    let description = `This is a Chandrashtama day for your birth star ${birthNakshatra}.\n\n`;
    description += `During Chandrashtama periods, it's advisable to avoid important activities and decisions.\n\n`;
    description += `Affected Nakshatra: ${day.nakshatra}\n`;
    description += `Approximate Period: ${day.dayRange}\n\n`;
    description += `Recommendations:\n`;
    description += `• Avoid major financial decisions\n`;
    description += `• Postpone beginning new ventures\n`;
    description += `• Focus on routine tasks\n`;
    description += `• Take extra care of your health\n`;
    description += `• Practice meditation and spiritual activities`;

    // Assemble the iCalendar event
    let icsEvent = [
      "BEGIN:VEVENT",
      `UID:${uuid}`,
      `DTSTAMP:${formatICSDate(new Date(), true)}`,
      `DTSTART;VALUE=DATE:${eventStart}`,
      `DTEND;VALUE=DATE:${eventEnd}`,
      `SUMMARY:${eventTitle}`,
      `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
      "CATEGORIES:Chandrashtama,Caution,Personal Calendar",
      // Add alarm/reminder for 8:00 AM on the event day
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Caution: This is a Chandrashtama day for you!",
      "TRIGGER;VALUE=DATE-TIME:" +
        formatICSDate(new Date(dateObj.setHours(8, 0, 0)), true),
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");

    return icsEvent;
  };

  // Create iCalendar file content
  const createICSFile = (favorableDays, chandrashtamaDays) => {
    // File header
    let fileContent =
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//PersonalNakshatraDashboard//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:Personal Nakshatra Calendar for ${birthNakshatra}`,
        "X-WR-TIMEZONE:UTC",
      ].join("\r\n") + "\r\n";

    // Add favorable day events
    favorableDays.forEach((day) => {
      fileContent += createFavorableDayEvent(day) + "\r\n";
    });

    // Add Chandrashtama day events
    chandrashtamaDays.forEach((day) => {
      fileContent += createChandrashtamaEvent(day) + "\r\n";
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

  // For iOS devices - UPDATED iOS CALENDAR FUNCTION (Solution 1)
  // For iOS devices - IMPROVED iOS CALENDAR FUNCTION
  const addToAppleCalendar = (content) => {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      try {
        // Method 1: Try the Web Share API first (iOS 12+)
        if (navigator.share && navigator.canShare) {
          const blob = new Blob([content], {
            type: "text/calendar;charset=utf-8",
          });
          const file = new File(
            [blob],
            `personal-nakshatra-calendar-${new Date().toISOString().split("T")[0]}.ics`,
            {
              type: "text/calendar",
            },
          );

          // Check if we can share files
          if (navigator.canShare({ files: [file] })) {
            navigator
              .share({
                files: [file],
                title: "Personal Nakshatra Calendar",
                text: "Your personalized astrological calendar",
              })
              .then(() => {
                setTimeout(() => {
                  alert(
                    "Calendar shared! Please select 'Add to Calendar' or 'Save to Files' and then open the file to add to your calendar.",
                  );
                }, 500);
              })
              .catch((error) => {
                console.log("Share failed, trying alternative method");
                useDataUriMethod(content);
              });
            return;
          }
        }

        // Method 2: Data URI approach for older iOS or when share fails
        useDataUriMethod(content);
      } catch (error) {
        console.error("iOS calendar export error:", error);
        // Method 3: Fall back to individual event creation
        useCalendarUrlMethod();
      }
    } else {
      // Fallback for other browsers
      const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  };

  // Helper function for data URI method
  const useDataUriMethod = (content) => {
    // Create data URI with proper MIME type
    const dataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;

    // Try opening in a new window first
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Calendar Export</title></head>
          <body>
            <h2>Calendar Export</h2>
            <p>Tap the link below to add events to your calendar:</p>
            <a href="${dataUri}" download="personal-nakshatra-calendar.ics" style="
              display: inline-block;
              padding: 12px 20px;
              background: #007AFF;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-size: 16px;
            ">Download Calendar File</a>
            <br><br>
            <p><small>After downloading, tap the file to add events to your calendar app.</small></p>
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      // Fallback: Direct data URI
      window.location.href = dataUri;
    }

    // Show improved instructions
    setTimeout(() => {
      alert(`Calendar export initiated!

  iOS Instructions:
  1. Tap the "Download Calendar File" link
  2. Look for download notification in Safari
  3. Tap the downloaded .ics file
  4. Choose "Add All" to add to calendar

  Alternative: Use individual day buttons (📅) to add events one by one.`);
    }, 2000);
  };

  // Helper function for calendar URL method (fallback)
  const useCalendarUrlMethod = () => {
    if (favorableDays.length === 0 && chandrashtamaDays.length === 0) return;

    const firstEvent = favorableDays[0] || chandrashtamaDays[0];
    const dateObj = new Date(firstEvent.date);

    // Format for iOS calendar URL
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const formattedDate = `${year}${month}${day}`;

    const title = favorableDays[0]
      ? `Favorable Day (Score: ${favorableDays[0].score.toFixed(1)})`
      : `Chandrashtama Day - Caution`;

    const notes = favorableDays[0]
      ? `Favorable day for ${birthNakshatra}. Score: ${favorableDays[0].score.toFixed(1)}/10`
      : `Chandrashtama day for ${birthNakshatra}. Avoid important activities.`;

    // iOS calendar URL scheme
    const calendarUrl = `calshow:?title=${encodeURIComponent(title)}&notes=${encodeURIComponent(notes)}&startdate=${formattedDate}&enddate=${formattedDate}`;

    window.location.href = calendarUrl;

    setTimeout(() => {
      const totalEvents = favorableDays.length + chandrashtamaDays.length;
      const message =
        totalEvents > 1
          ? `Added first event. You have ${totalEvents} total events. Use individual 📅 buttons for more events.`
          : `Event added to calendar!`;

      alert(message);
    }, 2000);
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
    const title = encodeURIComponent(`Favorable Day for ${birthNakshatra}`);
    const details = encodeURIComponent(
      `Personal Score: ${event.score.toFixed(1)}/10\nNakshatra: ${parseJsonField(event.nakshatra)}`,
    );

    // Create Google Calendar URL
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formattedDate}/${formattedDate}&details=${details}`;

    // Open the URL in a new tab
    window.open(googleCalUrl, "_blank");

    // Show notification to user about adding more events
    if (events.length > 1 || chandrashtamaDays.length > 0) {
      alert(
        `You have ${events.length} favorable days and ${chandrashtamaDays.length} Chandrashtama days. Only the first favorable day was added to your calendar. Please use the 'Export All to Calendar' option to add all days.`,
      );
    }
  };

  // Export personalized calendar
  const exportAllToCalendar = () => {
    setExportLoading(true);
    setExportSuccess(false);

    try {
      if (favorableDays.length === 0 && chandrashtamaDays.length === 0) {
        alert(
          "No calendar events to export. Please wait for the data to load or try a different date range.",
        );
        setExportLoading(false);
        return;
      }

      // Create iCalendar file content
      const icsContent = createICSFile(favorableDays, chandrashtamaDays);

      // Check device type
      if (isMobileDevice()) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isIOS) {
          // Use Apple Calendar approach
          addToAppleCalendar(icsContent);
        } else {
          // Use Google Calendar approach for first event, recommend download for rest
          if (favorableDays.length > 0) {
            addToGoogleCalendar(favorableDays);
          } else if (chandrashtamaDays.length > 0) {
            alert(
              "On Android, we can only add one event at a time to Google Calendar. Please use the desktop version to download all events at once.",
            );
          }
        }
      } else {
        // Desktop - download the file
        const filename = `personal-nakshatra-calendar-${birthNakshatra.toLowerCase().replace(/\s+/g, "-")}.ics`;
        downloadFile(icsContent, filename);
      }

      setExportSuccess(true);
    } catch (error) {
      console.error("Error exporting calendar events:", error);
      alert("Failed to export calendar events. Please try again.");
    } finally {
      setExportLoading(false);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
    }
  };

  // Add a single day to calendar
  const addDayToCalendar = (day, type) => {
    try {
      // Create iCalendar content for single day
      let icsContent;

      if (type === "favorable") {
        icsContent = createICSFile([day], []);
      } else if (type === "chandrashtama") {
        icsContent = createICSFile([], [day]);
      } else {
        throw new Error("Invalid event type");
      }

      // Check device type
      if (isMobileDevice()) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isIOS) {
          // Use Apple Calendar approach
          addToAppleCalendar(icsContent);
        } else {
          // Use Google Calendar approach (Android)
          if (type === "favorable") {
            addToGoogleCalendar([day]);
          } else {
            // For Chandrashtama days on Android
            const dateObj = new Date(day.date);
            const formattedDate = dateObj
              .toISOString()
              .split("T")[0]
              .replace(/-/g, "");
            const title = encodeURIComponent(
              `⚠️ Chandrashtama Day - ${birthNakshatra}`,
            );
            const details = encodeURIComponent(
              `Caution: This is a Chandrashtama day for your birth star.\nAffected Nakshatra: ${day.nakshatra}`,
            );
            const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formattedDate}/${formattedDate}&details=${details}`;
            window.open(googleCalUrl, "_blank");
          }
        }
      } else {
        // Desktop - download the file
        const dateStr = new Date(day.date).toISOString().split("T")[0];
        const eventType = type === "favorable" ? "favorable" : "chandrashtama";
        const filename = `${eventType}-day-${dateStr}.ics`;
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
    <div className="personal-nakshatra-dashboard">
      <h1 className="header">👤 My Nakshatra Dashboard</h1>

      {!birthNakshatra ? (
        <div className="nakshatra-selector-container">
          <h2>Select Your Birth Star (Janma Nakshatra)</h2>
          <p className="selection-info">
            Your birth star determines your cosmic influences and helps provide
            personalized astrological guidance.
          </p>

          <div className="nakshatra-selector">
            <select
              value={birthNakshatra}
              onChange={handleNakshatraChange}
              className="nakshatra-dropdown"
            >
              <option value="">-- Select Your Birth Star --</option>
              {allNakshatras.map((nakshatra) => (
                <option key={nakshatra.english} value={nakshatra.english}>
                  {nakshatra.english} ({nakshatra.tamil})
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="dashboard-content">
          <div className="birth-star-display">
            <h2>Your Birth Star</h2>
            <div className="birth-star-info">
              <div className="birth-star-name">
                {birthNakshatra}
                <span className="tamil-name">
                  {
                    allNakshatras.find((n) => n.english === birthNakshatra)
                      ?.tamil
                  }
                </span>
              </div>
              <div className="controls">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="period-dropdown"
                >
                  <option value="week">Next 7 Days</option>
                  <option value="month">Next 30 Days</option>
                  <option value="year">Next 365 Days</option>
                </select>
                <button
                  className="edit-button"
                  onClick={() => setBirthNakshatra("")}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchPersonalizedData} className="retry-button">
                Retry
              </button>
            </div>
          )}

          {/* Add Export All to Calendar Button */}
          {!loading &&
            (favorableDays.length > 0 || chandrashtamaDays.length > 0) && (
              <div className="export-all-container">
                <button
                  className={`export-all-button ${exportLoading ? "loading" : ""} ${exportSuccess ? "success" : ""}`}
                  onClick={exportAllToCalendar}
                  disabled={exportLoading}
                >
                  {exportLoading ? (
                    <>
                      Exporting<span className="loading-dots">...</span>
                    </>
                  ) : exportSuccess ? (
                    <>Exported ✓</>
                  ) : (
                    <>📅 Export All to Calendar</>
                  )}
                </button>
                <p className="export-info">
                  Export all favorable days and Chandrashtama days to your
                  calendar
                </p>

                {/* iOS Instructions */}
                {isMobileDevice() &&
                  /iPad|iPhone|iPod/.test(navigator.userAgent) && (
                    <div className="ios-instructions">
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#666",
                          marginTop: "8px",
                          textAlign: "center",
                        }}
                      >
                        📱 iOS: After clicking, the calendar file will download.
                        Tap the downloaded file in Safari's downloads to add to
                        your calendar.
                      </p>
                    </div>
                  )}
              </div>
            )}

          {loading ? (
            <div className="loading">Loading your personalized forecast...</div>
          ) : (
            <>
              <div className="forecast-section favorable-days">
                <h2>
                  <span role="img" aria-label="Star">
                    ✅
                  </span>{" "}
                  Most Favorable Days
                </h2>

                {favorableDays.length > 0 ? (
                  <div className="days-list">
                    {favorableDays.map((day) => (
                      <div key={day.date} className="favorable-day-item">
                        <div className="day-content">
                          <div className="day-date">{day.formattedDate}</div>
                          <div className="day-details">
                            <span className="day-nakshatra">
                              {parseJsonField(day.nakshatra)}
                            </span>
                            <span
                              className={`personal-day-score ${getScoreColor(day.score)}`}
                            >
                              {day.score ? day.score.toFixed(1) : "?"}/10
                            </span>

                            {/* Add Calendar button for favorable day */}
                            <button
                              className="day-calendar-button"
                              onClick={() => addDayToCalendar(day, "favorable")}
                              title="Add this day to your calendar"
                            >
                              📅
                            </button>
                          </div>
                        </div>
                        <button
                          className="view-details-btn"
                          onClick={() => toggleScoreDetails(day.date)}
                        >
                          {showScoreDetails === day.date
                            ? "Hide Details"
                            : "View Details"}
                        </button>

                        {showScoreDetails === day.date &&
                          day.personalScoreData && (
                            <div className="score-details">
                              {/* Score Summary Section - NEW */}
                              <div className="score-summary">
                                <h3>Score Summary</h3>
                                <div className="score-overview">
                                  <div className="score-item">
                                    <span>Cosmic Score (General):</span>
                                    <span>
                                      {day.personalScoreData.cosmicScore || "?"}
                                      /10
                                    </span>
                                  </div>
                                  <div className="score-item">
                                    <span>Calculated Weighted Score:</span>
                                    <span>
                                      {day.personalScoreData.calculatedScore ||
                                        "?"}
                                      /10
                                    </span>
                                  </div>
                                  <div className="score-item">
                                    <span>Tarabalam Adjustment:</span>
                                    <span
                                      className={
                                        day.personalScoreData.adjustment >= 0
                                          ? "positive-adj"
                                          : "negative-adj"
                                      }
                                    >
                                      {day.personalScoreData.adjustment > 0
                                        ? "+"
                                        : ""}
                                      {day.personalScoreData.adjustment}
                                    </span>
                                  </div>
                                  <div className="score-item total-score">
                                    <span>Final Personal Score:</span>
                                    <span
                                      className={`${getScoreColor(day.personalScoreData.score)}`}
                                    >
                                      {day.personalScoreData.score
                                        ? day.personalScoreData.score.toFixed(1)
                                        : "?"}
                                      /10
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="score-breakdown">
                                <h3>Score Breakdown</h3>
                                {day.personalScoreData.scoreBreakdown && (
                                  <>
                                    <div className="breakdown-item">
                                      <span>
                                        Tithi:{" "}
                                        {parseJsonField(
                                          day.personalScoreData.scoreBreakdown
                                            .tithi?.name,
                                        )}
                                      </span>
                                      <span>
                                        {day.personalScoreData.scoreBreakdown
                                          .tithi?.score || 0}
                                        /10
                                        <small className="weight">
                                          (
                                          {day.personalScoreData.scoreBreakdown
                                            .tithi?.weight || 0}
                                          %)
                                        </small>
                                      </span>
                                    </div>
                                    <div className="breakdown-item">
                                      <span>
                                        Nakshatra:{" "}
                                        {parseJsonField(
                                          day.personalScoreData.scoreBreakdown
                                            .nakshatra?.name,
                                        )}
                                      </span>
                                      <span>
                                        {day.personalScoreData.scoreBreakdown
                                          .nakshatra?.score || 0}
                                        /10
                                        <small className="weight">
                                          (
                                          {day.personalScoreData.scoreBreakdown
                                            .nakshatra?.weight || 0}
                                          %)
                                        </small>
                                      </span>
                                    </div>
                                    <div className="breakdown-item">
                                      <span>
                                        Vara:{" "}
                                        {parseJsonField(
                                          day.personalScoreData.scoreBreakdown
                                            .vara?.name,
                                        )}
                                      </span>
                                      <span>
                                        {day.personalScoreData.scoreBreakdown
                                          .vara?.score || 0}
                                        /10
                                        <small className="weight">
                                          (
                                          {day.personalScoreData.scoreBreakdown
                                            .vara?.weight || 0}
                                          %)
                                        </small>
                                      </span>
                                    </div>
                                    <div className="breakdown-item">
                                      <span>
                                        Yoga:{" "}
                                        {parseJsonField(
                                          day.personalScoreData.scoreBreakdown
                                            .yoga?.name,
                                        )}
                                      </span>
                                      <span>
                                        {day.personalScoreData.scoreBreakdown
                                          .yoga?.score || 0}
                                        /10
                                        <small className="weight">
                                          (
                                          {day.personalScoreData.scoreBreakdown
                                            .yoga?.weight || 0}
                                          %)
                                        </small>
                                      </span>
                                    </div>
                                    <div className="breakdown-item">
                                      <span>
                                        Karana:{" "}
                                        {parseJsonField(
                                          day.personalScoreData.scoreBreakdown
                                            .karana?.name,
                                        )}
                                      </span>
                                      <span>
                                        {day.personalScoreData.scoreBreakdown
                                          .karana?.score || 0}
                                        /10
                                        <small className="weight">
                                          (
                                          {day.personalScoreData.scoreBreakdown
                                            .karana?.weight || 0}
                                          %)
                                        </small>
                                      </span>
                                    </div>
                                  </>
                                )}
                                <div className="tarabalam-info">
                                  <h4>
                                    Tarabalam:{" "}
                                    {day.personalScoreData.tarabalamType ||
                                      "Unknown"}
                                  </h4>
                                  <p>
                                    {day.personalScoreData.tarabalamExplanation
                                      ?.en || "No explanation available"}
                                  </p>
                                  <p>
                                    Adjustment:{" "}
                                    {day.personalScoreData.adjustment > 0
                                      ? "+"
                                      : ""}
                                    {day.personalScoreData.adjustment}
                                  </p>
                                </div>
                              </div>

                              <div className="recommendations">
                                <h3>Recommendations</h3>
                                {day.personalScoreData.recommendations && (
                                  <>
                                    <div className="recommendation-section">
                                      <h4>Favorable Activities</h4>
                                      <ul>
                                        {day.personalScoreData.recommendations
                                          .activities?.favorable?.en ? (
                                          Array.isArray(
                                            day.personalScoreData
                                              .recommendations.activities
                                              .favorable.en,
                                          ) ? (
                                            day.personalScoreData.recommendations.activities.favorable.en.map(
                                              (activity, index) => (
                                                <li key={index}>{activity}</li>
                                              ),
                                            )
                                          ) : (
                                            <li>
                                              {String(
                                                day.personalScoreData
                                                  .recommendations.activities
                                                  .favorable.en,
                                              )}
                                            </li>
                                          )
                                        ) : (
                                          <li>
                                            No specific recommendations
                                            available
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                    <div className="recommendation-section">
                                      <h4>Activities to Avoid</h4>
                                      <ul>
                                        {day.personalScoreData.recommendations
                                          .activities?.unfavorable?.en ? (
                                          Array.isArray(
                                            day.personalScoreData
                                              .recommendations.activities
                                              .unfavorable.en,
                                          ) ? (
                                            day.personalScoreData.recommendations.activities.unfavorable.en.map(
                                              (activity, index) => (
                                                <li key={index}>{activity}</li>
                                              ),
                                            )
                                          ) : (
                                            <li>
                                              {String(
                                                day.personalScoreData
                                                  .recommendations.activities
                                                  .unfavorable.en,
                                              )}
                                            </li>
                                          )
                                        ) : (
                                          <li>
                                            No specific cautions available
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data-message">
                    No particularly favorable days found in the selected period.
                  </p>
                )}
              </div>

              <div className="forecast-section chandrashtama-days">
                <h2>
                  <span role="img" aria-label="Warning">
                    ⚠️
                  </span>{" "}
                  Chandrashtama Days
                </h2>
                <p className="section-info">
                  During Chandrashtama periods, it's advisable to avoid
                  important activities and decisions.
                </p>

                {chandrashtamaDays.length > 0 ? (
                  <div className="days-list">
                    {chandrashtamaDays.map((day) => (
                      <div key={day.date} className="day-item caution">
                        <div className="day-date">{day.formattedDate}</div>
                        <div className="day-details">
                          <span className="day-range">{day.dayRange}</span>
                          {day.nakshatra && (
                            <div className="day-nakshatra">
                              🌙 Chandrashtama: <strong>{day.nakshatra}</strong>
                              {/* Add Calendar button for chandrashtama day */}
                              <button
                                className="day-calendar-button"
                                onClick={() =>
                                  addDayToCalendar(day, "chandrashtama")
                                }
                                title="Add this day to your calendar"
                              >
                                📅
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    No Chandrashtama days found for your birth star in the
                    selected period.
                  </div>
                )}

                {nakshatraInfo ? (
                  <div className="characteristics-container">
                    <div className="characteristics-grid">
                      <div className="characteristic-item">
                        <span className="characteristic-label">Deity:</span>
                        <span className="characteristic-value">
                          {nakshatraInfo.deity}
                        </span>
                      </div>
                      <div className="characteristic-item">
                        <span className="characteristic-label">Symbol:</span>
                        <span className="characteristic-value">
                          {nakshatraInfo.symbol}
                        </span>
                      </div>
                      <div className="characteristic-item">
                        <span className="characteristic-label">Ruler:</span>
                        <span className="characteristic-value">
                          {nakshatraInfo.ruler}
                        </span>
                      </div>
                      <div className="characteristic-item">
                        <span className="characteristic-label">Element:</span>
                        <span className="characteristic-value">
                          {nakshatraInfo.element}
                        </span>
                      </div>
                    </div>

                    <div className="characteristics-strengths">
                      <h3>Strengths & Qualities</h3>
                      <ul className="qualities-list">
                        {nakshatraInfo.qualities.map((quality, index) => (
                          <li key={index}>{quality}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="characteristics-favorable">
                      <h3>Favorable Activities</h3>
                      <ul className="favorable-list">
                        {nakshatraInfo.favorable_activities?.map(
                          (item, index) => (
                            <li key={index}>{item}</li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div className="characteristics-unfavorable">
                      <h3>Challenges to Watch For</h3>
                      <ul className="unfavorable-list">
                        {nakshatraInfo.unfavorable_qualities?.length > 0 ? (
                          nakshatraInfo.unfavorable_qualities.map(
                            (item, index) => <li key={index}>{item}</li>,
                          )
                        ) : (
                          <li>No specific challenges listed.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="no-data-message">
                    Detailed information about {birthNakshatra} is not
                    available.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .personal-nakshatra-dashboard {
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

        .nakshatra-selector-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 20px;
          text-align: center;
        }

        .nakshatra-selector-container h2 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 1.2rem;
        }

        .selection-info {
          color: #666;
          margin-bottom: 20px;
        }

        .nakshatra-selector {
          display: flex;
          justify-content: center;
        }

        .nakshatra-dropdown,
        .period-dropdown {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }

        .nakshatra-dropdown {
          width: 100%;
          max-width: 350px;
        }

        .period-dropdown {
          margin-right: 10px;
        }

        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .birth-star-display {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 15px;
        }

        .birth-star-display h2 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 1.2rem;
        }

        .birth-star-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .controls {
          display: flex;
          align-items: center;
        }

        .birth-star-name {
          font-size: 1.3rem;
          font-weight: 600;
          color: #4f46e5;
        }

        .tamil-name {
          display: block;
          font-size: 1rem;
          color: #666;
          margin-top: 5px;
        }

        .edit-button {
          padding: 5px 10px;
          background: #f3f4f6;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }

        /* Export All to Calendar section */
        .export-all-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 15px;
          margin-bottom: 0;
        }

        .export-all-button {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          background: #4f46e5;
          color: white;
          cursor: pointer;
          font-size: 1rem;
          position: relative;
          min-width: 230px;
          text-align: center;
        }

        .export-all-button.loading {
          background: #818cf8;
          cursor: wait;
        }

        .export-all-button.success {
          background: #10b981;
        }

        .export-info {
          font-size: 0.9rem;
          color: #666;
          margin-top: 8px;
          text-align: center;
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

        .loading {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .error-message {
          padding: 15px;
          background: #fff5f5;
          border-left: 4px solid #f56565;
          color: #c53030;
          border-radius: 4px;
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .retry-button {
          padding: 5px 10px;
          background: #fff;
          border: 1px solid #f56565;
          color: #f56565;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .retry-button:hover {
          background: #f56565;
          color: white;
        }

        .forecast-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 15px;
        }

        .forecast-section h2 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-info {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 15px;
        }

        .days-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .day-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 4px;
          border-left: 3px solid #22c55e;
        }

        .favorable-day-item {
          display: flex;
          flex-direction: column;
          background: #f9fafb;
          border-radius: 4px;
          border-left: 3px solid #22c55e;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .day-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
        }

        .day-item.caution {
          border-left-color: #f59e0b;
          background: #fffbeb;
        }

        .day-date {
          font-weight: 500;
        }

        .day-details {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .day-nakshatra,
        .day-range {
          font-size: 0.9rem;
          color: #666;
        }

        .day-score {
          background: #dcfce7;
          color: #15803d;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .personal-day-score {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: 600;
          background: #f0f9ff;
        }

        /* Add to Calendar Button for individual days */
        .day-calendar-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.1rem;
          padding: 0 5px;
          margin-left: 5px;
          transition: all 0.2s;
        }

        .day-calendar-button:hover {
          transform: scale(1.2);
        }

        .text-green-600 {
          color: #16a34a;
        }

        .text-amber-600 {
          color: #d97706;
        }

        .text-red-600 {
          color: #dc2626;
        }

        .view-details-btn {
          background: #f3f4f6;
          border: none;
          border-top: 1px solid #e5e7eb;
          padding: 8px;
          width: 100%;
          text-align: center;
          cursor: pointer;
          font-size: 0.9rem;
          color: #4b5563;
        }

        .view-details-btn:hover {
          background: #e5e7eb;
        }

        .score-details {
          padding: 15px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        /* New Score Summary Styles */
        .score-summary {
          margin-bottom: 20px;
          padding: 12px;
          background: #f3f4f7;
          border-radius: 8px;
          border: 1px solid #e2e4e8;
        }

        .score-overview {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .score-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
        }

        .score-item.total-score {
          font-weight: 600;
          border-top: 1px solid #e2e4e8;
          padding-top: 8px;
          margin-top: 4px;
        }

        .positive-adj {
          color: #16a34a;
        }

        .negative-adj {
          color: #dc2626;
        }

        .weight {
          font-size: 0.8rem;
          color: #666;
          margin-left: 4px;
        }

        .score-breakdown {
          margin-bottom: 20px;
        }

        .score-breakdown h3,
        .recommendations h3,
        .score-summary h3 {
          font-size: 1.1rem;
          margin-top: 0;
          margin-bottom: 10px;
          color: #4f46e5;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .tarabalam-info {
          margin-top: 15px;
          padding: 10px;
          background: #f0f9ff;
          border-radius: 4px;
        }

        .tarabalam-info h4 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 1rem;
        }

        .tarabalam-info p {
          margin: 5px 0;
          font-size: 0.9rem;
        }

        .recommendations {
          margin-top: 20px;
        }

        .recommendation-section {
          margin-bottom: 15px;
        }

        .recommendation-section h4 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 1rem;
        }

        .recommendation-section ul {
          margin: 0;
          padding-left: 20px;
        }

        .recommendation-section li {
          margin-bottom: 4px;
          font-size: 0.9rem;
        }

        .no-data-message {
          color: #666;
          text-align: center;
          padding: 15px;
          font-style: italic;
        }

        .characteristics-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .characteristics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .characteristic-item {
          padding: 8px;
          background: #f9fafb;
          border-radius: 4px;
        }

        .characteristic-label {
          font-weight: 600;
          margin-right: 5px;
        }

        .characteristics-strengths,
        .characteristics-favorable,
        .characteristics-unfavorable {
          padding: 10px;
          border-radius: 4px;
        }

        .characteristics-strengths {
          background: #f0f9ff;
        }

        .characteristics-favorable {
          background: #f0fdf4;
        }

        .characteristics-unfavorable {
          background: #fff1f2;
        }

        .characteristics-strengths h3,
        .characteristics-favorable h3,
        .characteristics-unfavorable h3 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 1rem;
        }

        .qualities-list,
        .favorable-list,
        .unfavorable-list {
          margin: 0;
          padding-left: 20px;
        }

        .qualities-list li,
        .favorable-list li,
        .unfavorable-list li {
          margin-bottom: 4px;
        }

        @media (max-width: 480px) {
          .birth-star-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .controls {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
