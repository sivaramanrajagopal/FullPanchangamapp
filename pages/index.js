// pages/index.js
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [panchangamData, setPanchangamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsNakshatraInfo, setRsNakshatraInfo] = useState(null);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  // Preload voices on iOS
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const dummy = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(dummy);
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    fetchPanchangamData(selectedDate);
  }, [selectedDate]);

  // Complete mapping of English to Tamil nakshatra names, including alternatives
  const nakshatraEnglishToTamil = {
    Ashwini: "அசுவினி",
    Bharani: "பரணி",
    Krittika: "கார்த்திகை",
    Rohini: "ரோகிணி",
    Mrigasira: "மிருகசீரிஷம்",
    Ardra: "திருவாதிரை",
    Punarvasu: "புனர்பூசம்",
    Pushya: "பூசம்",
    Ashlesha: "ஆயில்யம்",
    Magha: "மகம்",
    "Purva Phalguni": "பூரம்",
    "Uttara Phalguni": "உத்திரம்",
    Hasta: "ஹஸ்தம்",
    Chitra: "சித்திரை",
    Swati: "சுவாதி",
    Swathi: "ஸ்வாதி", // Added specific mapping for Swathi with alternative spelling
    Vishakha: "விசாகம்",
    Anuradha: "அனுஷம்",
    Jyeshtha: "கேட்டை",
    Mula: "மூலம்",
    "Purva Ashadha": "பூராடம்",
    "Uttara Ashadha": "உத்திராடம்",
    Shravana: "திருவோணம்",
    Dhanishta: "அவிட்டம்",
    Shatabhisha: "சதயம்",
    "Purva Bhadrapada": "பூரட்டாதி",
    "Uttara Bhadrapada": "உத்திரட்டாதி",
    Revati: "ரேவதி",
  };

  // Reverse mapping for Tamil to English (helpful for detection)
  const nakshatraTamilToEnglish = {};
  Object.entries(nakshatraEnglishToTamil).forEach(([english, tamil]) => {
    nakshatraTamilToEnglish[tamil] = english;
  });

  // Alternative spellings for each nakshatra
  const nakshatraAlternatives = {
    // Primary Tamil : [Alternative spellings]
    அசுவினி: ["அஸ்வினி", "அச்வினி"],
    பரணி: ["பரநி"],
    கார்த்திகை: ["கிருத்திகை", "கிருத்திகா", "கார்திகை"],
    திருவாதிரை: ["திருவாதிரா", "ஆர்திரா", "ஆர்த்ரா"],
    ஆயில்யம்: ["ஆஷ்லேஷா", "ஆஸ்லேஷா", "அஸ்லேசா"],
    ஹஸ்தம்: ["அஸ்தம்", "ஹஸ்த"],
    சித்திரை: ["சித்ரா", "சித்ர"],
    சுவாதி: ["ஸ்வாதி", "ஸ்வாதீ"],
    ஸ்வாதி: ["சுவாதி", "ஸ்வாதீ", "Swati", "Swathi"], // Added key for the alternative
    விசாகம்: ["விசாக", "விசாகா", "விஷாகம்"],
    கேட்டை: ["ஜ்யேஷ்டா", "ஜேஷ்டா", "ஜ்யேஷ்ட"],
    பூராடம்: ["பூர்வாஷாடா", "பூர்வாஷாட", "பூர்வ அஷாடா"],
    உத்திராடம்: ["உத்தராஷாடா", "உத்தராஷாட", "உத்தர அஷாடா"],
    பூரட்டாதி: ["பூர்வ பத்ரபதா", "பூர்வா பாத்ரபதா"],
    உத்திரட்டாதி: ["உத்தர பத்ரபதா", "உத்தரா பாத்ரபதா"],
  };

  // Mapping for RS Nakshatra group - the nakshatras that should show warnings
  const rsNakshatraGroup = [
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
  ];

  // Tamil names for RS Nakshatras
  const rsNakshatraTamilNames = [
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

  // All alternative spellings for RS Nakshatras, flattened into one array
  const rsNakshatraAlternatives = rsNakshatraTamilNames
    .map((name) => nakshatraAlternatives[name] || [])
    .flat();

  // Function to format Tithi data from JSON string
  const formatTithiData = (tithiStr) => {
    if (!tithiStr) return "N/A";

    try {
      let tithiData;
      if (typeof tithiStr === "string") {
        tithiData = JSON.parse(tithiStr);
      } else {
        tithiData = tithiStr;
      }

      if (!Array.isArray(tithiData) || tithiData.length === 0) {
        return "No Tithi data available";
      }

      return (
        <div className="tithi-container">
          {tithiData.map((tithi, index) => {
            // Format start and end times
            const startDate = new Date(tithi.start);
            const endDate = new Date(tithi.end);

            // Check if this is the currently active tithi
            const now = new Date();
            const isActive = now >= startDate && now <= endDate;

            return (
              <div
                key={index}
                className={`tithi-item ${isActive ? "active-tithi" : ""}`}
              >
                <div className="tithi-name">
                  <div className="tithi-name-content">
                    <span className="tithi-main-name">{tithi.name}</span>
                    <span className="tithi-paksha">({tithi.paksha})</span>
                  </div>
                  {isActive && <span className="active-badge">Current</span>}
                </div>
                <div className="tithi-time">
                  {startDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {endDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    } catch (error) {
      console.error("Error parsing Tithi JSON:", error);
      return "Error displaying Tithi data";
    }
  };

  const fetchPanchangamData = async (date) => {
    setLoading(true);
    const formattedDate = date.toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("daily_panchangam")
      .select("*")
      .eq("date", formattedDate)
      .single();

    if (error) {
      console.error("Error fetching panchangam:", error);
      setLoading(false);
      setPanchangamData(null);
      return;
    }

    if (!data) {
      setLoading(false);
      setPanchangamData(null);
      return;
    }

    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
    try {
      const { data: yogamData, error: yogamError } = await supabase.rpc(
        "get_nakshatra_yogam",
        {
          nakshatra_name: data.main_nakshatra,
          day_name: dayOfWeek,
        },
      );

      if (yogamError) throw yogamError;

      // Extract nakshatra names from the data
      const mainNakshatra = data.main_nakshatra;

      // Check if the nakshatra is in Tamil or English
      const isTamilNakshatra = /[\u0B80-\u0BFF]/.test(mainNakshatra);

      // Get appropriate name equivalents
      let englishNakshatraName = "";
      let tamilNakshatraName = "";

      if (isTamilNakshatra) {
        // It's in Tamil
        tamilNakshatraName = mainNakshatra;
        englishNakshatraName = nakshatraTamilToEnglish[mainNakshatra] || "";
      } else {
        // It's in English
        englishNakshatraName = mainNakshatra;
        tamilNakshatraName = nakshatraEnglishToTamil[mainNakshatra] || "";
      }

      // Determine if this is an RS Nakshatra
      let isRSNakshatra = false;

      // Check all possible ways
      if (
        // 1. Check against English list
        rsNakshatraGroup.includes(englishNakshatraName) ||
        rsNakshatraGroup.includes(mainNakshatra) ||
        // 2. Check against Tamil list
        rsNakshatraTamilNames.includes(tamilNakshatraName) ||
        rsNakshatraTamilNames.includes(mainNakshatra) ||
        // 3. Special case for Swati/Swathi
        mainNakshatra === "Swati" ||
        mainNakshatra === "Swathi" ||
        mainNakshatra === "ஸ்வாதி" ||
        mainNakshatra === "சுவாதி" ||
        // 4. Check against alternative spellings
        rsNakshatraAlternatives.includes(mainNakshatra)
      ) {
        isRSNakshatra = true;
      }

      // Set RS Nakshatra info if found
      if (isRSNakshatra) {
        setRsNakshatraInfo({
          is_rs_nakshatra: true,
          avoid_medical: true,
          avoid_travel: true,
          avoid_financial: true,
          rs_nakshatra_short_desc:
            "தவிர்க்க வேண்டியவை: மருத்துவ சிகிச்சை, பயணம், நிதி பரிவர்த்தனைகள்",
          nakshatra_name: mainNakshatra,
          nakshatra_name_tamil: isTamilNakshatra
            ? mainNakshatra
            : tamilNakshatraName,
        });
      } else {
        setRsNakshatraInfo(null);
      }

      // Check moon phase from tithi
      let moonPhase = {
        is_valar_pirai: false,
        is_thei_pirai: false,
      };

      // Parse tithi data to determine moon phase
      if (data.tithi) {
        let tithiData;
        if (typeof data.tithi === "string") {
          try {
            tithiData = JSON.parse(data.tithi);
          } catch (e) {
            console.error("Error parsing tithi JSON:", e);
          }
        } else {
          tithiData = data.tithi;
        }

        if (Array.isArray(tithiData)) {
          // Check for Shukla Paksha (growing moon)
          moonPhase.is_valar_pirai = tithiData.some(
            (t) => t.paksha === "சுக்ல பக்ஷ",
          );

          // Check for Krishna Paksha (waning moon)
          moonPhase.is_thei_pirai = tithiData.some(
            (t) => t.paksha === "கிருஷ்ண பக்ஷ",
          );
        }
      }

      setPanchangamData({
        ...data,
        nakshatra_yogam: yogamData,
        is_valar_pirai: moonPhase.is_valar_pirai,
        is_thei_pirai: moonPhase.is_thei_pirai,
      });
    } catch (e) {
      console.error("Error fetching nakshatra yogam:", e);
      setPanchangamData(data);
    }

    setLoading(false);
  };

  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
  };

  const formatDate = (date) => date.toISOString().split("T")[0];

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getSpecialDay = (data) => {
    if (!data) return "Normal Day";
    if (data.is_pournami) return "பௌர்ணமி (Full Moon Day)";
    if (data.is_amavasai) return "அமாவாசை (New Moon Day)";
    if (data.is_ekadashi) return "ஏகாதசி (Ekadashi)";
    if (data.is_dwadashi) return "துவாதசி (Dwadashi)";
    if (data.is_ashtami) return "அஷ்டமி (Ashtami)";
    if (data.is_navami) return "நவமி (Navami)";
    if (data.is_trayodashi) return "திரயோதசி (Trayodashi)";
    if (data.is_sashti) return "சஷ்டி (Sashti)";
    return "Normal Day";
  };

  // Component for moon phase indicator
  const MoonPhaseIndicator = ({ isValarPirai, isTheiPirai }) => {
    if (isValarPirai) {
      return (
        <div className="moon-phase valar-pirai">
          <div className="moon-icon waxing-moon"></div>
          <span className="moon-text">வளர்பிறை</span>
        </div>
      );
    } else if (isTheiPirai) {
      return (
        <div className="moon-phase thei-pirai">
          <div className="moon-icon waning-moon"></div>
          <span className="moon-text">தேய்பிறை</span>
        </div>
      );
    }
    return null;
  };

  const speakContent = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Text-to-speech is not supported in your browser");
      return;
    }
    if (!panchangamData) return;

    // Toggle voice playing state
    if (isVoicePlaying) {
      window.speechSynthesis.cancel();
      setIsVoicePlaying(false);
      return;
    }

    setIsVoicePlaying(true);
    window.speechSynthesis.cancel();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    const createTextChunks = () => {
      const today = new Date(panchangamData.date);
      const day = today.getDate();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const formattedDate = `${day} ${month} ${year}`;

      const chunks = [
        `இன்றைய பஞ்சாங்கம் ${formattedDate}.`,
        `கிழமை: ${panchangamData.vaara}.`,
        `நட்சத்திரம்: ${panchangamData.main_nakshatra || ""}.`,
        `நட்சத்திர யோகம்: ${panchangamData.nakshatra_yogam || ""}.`,
        `திதி: ${(panchangamData.tithi && getFirstItem(panchangamData.tithi)?.name) || ""}.`,
      ];

      // Add moon phase info to speech
      if (panchangamData.is_valar_pirai) {
        chunks.push(`சந்திரன் நிலை: வளர்பிறை.`);
      } else if (panchangamData.is_thei_pirai) {
        chunks.push(`சந்திரன் நிலை: தேய்பிறை.`);
      }

      chunks.push(
        `ராகு காலம்: ${panchangamData.rahu_kalam || ""}.`,
        `எமகண்டம்: ${panchangamData.yamagandam || ""}.`,
        `சந்திராஷ்டமம்: ${convertChandrashtamaToTamil(panchangamData.chandrashtama_for) || ""}.`,
        `விசேஷ நாள்: ${getSpecialDay(panchangamData)}.`,
      );

      // Add RS Nakshatra warning if applicable
      if (rsNakshatraInfo) {
        chunks.push(
          `கவனம்! இன்று ${rsNakshatraInfo.nakshatra_name_tamil || rsNakshatraInfo.nakshatra_name} தீதுரு நட்சத்திரம்.`,
          `இந்த நட்சத்திரத்தில் மருத்துவ சிகிச்சை, பயணம், மற்றும் பண பரிவர்த்தனை தவிர்க்க வேண்டும்.`,
        );
      }

      return chunks;
    };

    const speakInSequence = () => {
      const chunks = createTextChunks();
      const voices = window.speechSynthesis.getVoices();

      let tamilVoice = voices.find(
        (v) =>
          (v.lang === "ta-IN" || v.lang.startsWith("ta")) &&
          v.name.toLowerCase().includes("female"),
      );

      if (!tamilVoice) {
        tamilVoice = voices.find(
          (v) =>
            (v.lang === "hi-IN" || v.lang.startsWith("en")) &&
            v.name.toLowerCase().includes("female"),
        );
      }

      if (!tamilVoice) {
        console.warn("Tamil voice not available. Using default voice.");
      }

      let chunkIndex = 0;
      const speakNextChunk = () => {
        if (chunkIndex < chunks.length) {
          const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
          utterance.lang = tamilVoice?.lang || "ta-IN";
          utterance.rate = isMobile ? 0.7 : 0.8;

          if (tamilVoice) {
            utterance.voice = tamilVoice;
            utterance.voiceURI = tamilVoice.voiceURI;
          }

          utterance.onend = () => {
            chunkIndex++;
            setTimeout(speakNextChunk, 300);
          };

          utterance.onerror = (e) => {
            console.error("Speech error:", e);
            chunkIndex++;
            setTimeout(speakNextChunk, 300);
          };

          window.speechSynthesis.speak(utterance);
        } else {
          setIsVoicePlaying(false);
        }
      };

      speakNextChunk();
    };

    if (isiOS) {
      setTimeout(speakInSequence, 300);
    } else {
      speakInSequence();
    }
  };

  const parseJsonField = (field) => {
    if (!field) return null;
    if (typeof field === "object") return field;
    if (typeof field === "string") {
      try {
        return JSON.parse(field);
      } catch (e) {
        console.error("Error parsing JSON string:", e);
        return null;
      }
    }
    return null;
  };

  const getFirstItem = (field) => {
    const parsed = parseJsonField(field);
    if (!parsed) return null;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    if (typeof parsed === "object" && parsed !== null) {
      if (parsed[0]) return parsed[0];
      const firstKey = Object.keys(parsed)[0];
      if (firstKey) return parsed[firstKey];
    }
    return null;
  };

  // Convert English nakshatra names to Tamil
  const convertChandrashtamaToTamil = (englishNames) => {
    if (!englishNames) return "N/A";

    if (Array.isArray(englishNames)) {
      return englishNames
        .map((name) => nakshatraEnglishToTamil[name] || name)
        .join(", ");
    }

    if (typeof englishNames === "string") {
      return nakshatraEnglishToTamil[englishNames] || englishNames;
    }

    return "N/A";
  };

  // Function to render cosmic score with visual indicator
  const renderCosmicScore = (score) => {
    if (!score) return <span>N/A</span>;

    const numericScore = parseFloat(score);
    let scoreColor = "#f59e0b"; // Default amber

    if (numericScore >= 8) {
      scoreColor = "#10b981"; // Green
    } else if (numericScore <= 4) {
      scoreColor = "#ef4444"; // Red
    }

    return (
      <div className="cosmic-score-display">
        <div className="cosmic-score-number">{score}/10</div>
        <div className="cosmic-score-bar">
          <div
            className="cosmic-score-fill"
            style={{
              width: `${numericScore * 10}%`,
              backgroundColor: scoreColor,
            }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <Head>
        <title>TamilJyotish Daily Panchangam</title>
        <meta
          name="description"
          content="Daily panchangam information for auspicious timing"
        />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <header className="header">
        <div className="header-content">
          <h1>✨ விஸ்வாவசு தமிழ் பஞ்சாங்கம் ✨</h1>

          <div className="date-controls">
            <div className="date-selector">
              <input
                type="date"
                value={formatDate(selectedDate)}
                onChange={handleDateChange}
              />
            </div>

            <button
              onClick={speakContent}
              className={`speak-button ${isVoicePlaying ? "playing" : ""}`}
              disabled={loading || !panchangamData}
            >
              <span className="speak-icon" role="img" aria-hidden="true">
                {isVoicePlaying ? "⏹️" : "🔊"}
              </span>
              <span className="speak-text">
                {isVoicePlaying
                  ? "நிறுத்து (Stop)"
                  : "தமிழில் வாசிக்க (Read in Tamil)"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>பஞ்சாங்க தகவல்களைப் பெறுகிறது...</p>
          </div>
        ) : !panchangamData ? (
          <div className="no-data">
            <div className="no-data-icon">📅</div>
            <p>இந்த தேதிக்கான பஞ்சாங்க தகவல் இல்லை</p>
            <p>No data available for this date</p>
          </div>
        ) : (
          <div className="main-content">
            {/* RS Nakshatra Warning Section */}
            {rsNakshatraInfo && (
              <div className="card rs-nakshatra-warning">
                <div className="warning-header">
                  <div className="warning-icon-container">
                    <span
                      role="img"
                      aria-label="Warning"
                      className="warning-icon"
                    >
                      ⚠️
                    </span>
                  </div>
                  <h3>தீதுரு நட்சத்திர எச்சரிக்கை</h3>
                </div>
                <p className="warning-text">
                  இன்று{" "}
                  <strong className="highlight">
                    {rsNakshatraInfo.nakshatra_name_tamil ||
                      rsNakshatraInfo.nakshatra_name}
                  </strong>{" "}
                  நட்சத்திரம் தீதுரு நட்சத்திரமாக கருதப்படுகிறது.
                </p>
                <div className="warning-items">
                  {rsNakshatraInfo.avoid_medical && (
                    <div className="warning-item">
                      <div className="warning-item-icon">
                        <span role="img" aria-label="Medical">
                          💊
                        </span>
                      </div>
                      <span className="warning-item-text">
                        மருத்துவ சிகிச்சை அல்லது புதிய மருந்துகள் தொடங்குவதை
                        தவிர்க்கவும்
                      </span>
                    </div>
                  )}

                  {rsNakshatraInfo.avoid_travel && (
                    <div className="warning-item">
                      <div className="warning-item-icon">
                        <span role="img" aria-label="Travel">
                          ✈️
                        </span>
                      </div>
                      <span className="warning-item-text">
                        பயணம் மேற்கொள்வதை தவிர்க்கவும்
                      </span>
                    </div>
                  )}

                  {rsNakshatraInfo.avoid_financial && (
                    <div className="warning-item">
                      <div className="warning-item-icon">
                        <span role="img" aria-label="Financial">
                          💰
                        </span>
                      </div>
                      <span className="warning-item-text">
                        கடன் வாங்குதல் அல்லது கொடுத்தல் போன்ற பண பரிவர்த்தனைகளை
                        தவிர்க்கவும்
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Basic date and day */}
            <div className="card primary-info">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-icon">📅</div>
                  <div className="info-content">
                    <div className="info-label">Date</div>
                    <div className="info-value">
                      {new Date(panchangamData.date).toLocaleDateString([], {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">📆</div>
                  <div className="info-content">
                    <div className="info-label">Day</div>
                    <div className="info-value">
                      {panchangamData.vaara ||
                        new Date(panchangamData.date).toLocaleDateString([], {
                          weekday: "long",
                        })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nakshatra & Yogam */}
            <div className="card">
              <h3 className="card-title">
                நட்சத்திர தகவல்கள்{" "}
                <span className="subtitle">(Star Information)</span>
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-icon">🌟</div>
                  <div className="info-content">
                    <div className="info-label">Main Nakshatra</div>
                    <div className="info-value nakshatra-value">
                      {panchangamData.main_nakshatra || "N/A"}
                      {rsNakshatraInfo && <span className="rs-badge">RS</span>}
                    </div>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">🔮</div>
                  <div className="info-content">
                    <div className="info-label">Nakshatra Yogam</div>
                    <div className="info-value">
                      {panchangamData.nakshatra_yogam || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tithi, Yogam, Karanam */}
            <div className="card">
              <h3 className="card-title">
                திதி & யோகம் <span className="subtitle">(Tithi & Yogam)</span>
              </h3>

              <div className="info-item tithi-section">
                <div className="info-icon">🌓</div>
                <div className="info-content full-width">
                  <div className="info-label">Tithi</div>
                  <div className="info-value">
                    {formatTithiData(panchangamData.tithi)}
                  </div>
                  {(panchangamData.is_valar_pirai ||
                    panchangamData.is_thei_pirai) && (
                    <MoonPhaseIndicator
                      isValarPirai={panchangamData.is_valar_pirai}
                      isTheiPirai={panchangamData.is_thei_pirai}
                    />
                  )}
                </div>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <div className="info-icon">✨</div>
                  <div className="info-content">
                    <div className="info-label">Yogam</div>
                    <div className="info-value">
                      {(panchangamData.yoga &&
                        getFirstItem(panchangamData.yoga)?.name) ||
                        "N/A"}
                    </div>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">🌗</div>
                  <div className="info-content">
                    <div className="info-label">Karanam</div>
                    <div className="info-value">
                      {(panchangamData.karana &&
                        getFirstItem(panchangamData.karana)?.name) ||
                        "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sun/Moon times */}
            <div className="card">
              <h3 className="card-title">
                சூரிய-சந்திர நேரங்கள்{" "}
                <span className="subtitle">(Sun-Moon Times)</span>
              </h3>
              <div className="times-grid">
                <div className="time-item">
                  <div className="time-icon">🌅</div>
                  <div className="time-content">
                    <div className="time-label">Sunrise</div>
                    <div className="time-value">
                      {formatTime(panchangamData.sunrise)}
                    </div>
                  </div>
                </div>

                <div className="time-item">
                  <div className="time-icon">🌇</div>
                  <div className="time-content">
                    <div className="time-label">Sunset</div>
                    <div className="time-value">
                      {formatTime(panchangamData.sunset)}
                    </div>
                  </div>
                </div>

                <div className="time-item">
                  <div className="time-icon">🌕</div>
                  <div className="time-content">
                    <div className="time-label">Moonrise</div>
                    <div className="time-value">
                      {formatTime(panchangamData.moonrise)}
                    </div>
                  </div>
                </div>

                <div className="time-item">
                  <div className="time-icon">🌑</div>
                  <div className="time-content">
                    <div className="time-label">Moonset</div>
                    <div className="time-value">
                      {formatTime(panchangamData.moonset)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Important times */}
            <div className="card important-times">
              <h3 className="card-title">
                <span className="title-icon">⚠️</span>
                முக்கியமான நேரங்கள்{" "}
                <span className="subtitle">(Important Times)</span>
              </h3>

              <div className="info-grid">
                <div className="info-item">
                  <div className="info-icon">⏰</div>
                  <div className="info-content">
                    <div className="info-label">Rahu Kalam</div>
                    <div className="info-value">
                      {panchangamData.rahu_kalam || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">⏱️</div>
                  <div className="info-content">
                    <div className="info-label">Yamagandam</div>
                    <div className="info-value">
                      {panchangamData.yamagandam || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">⏳</div>
                  <div className="info-content">
                    <div className="info-label">Kuligai</div>
                    <div className="info-value">
                      {panchangamData.kuligai || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">✅</div>
                  <div className="info-content">
                    <div className="info-label">Abhijit Muhurta</div>
                    <div className="info-value">
                      {panchangamData.abhijit_muhurta || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Special information */}
            <div className="card special-info">
              <h3 className="card-title">
                சிறப்பு தகவல்கள்{" "}
                <span className="subtitle">(Special Information)</span>
              </h3>

              <div className="info-grid">
                <div className="info-item">
                  <div className="info-icon">🎉</div>
                  <div className="info-content">
                    <div className="info-label">Special Day</div>
                    <div className="info-value special-day">
                      {getSpecialDay(panchangamData)}
                    </div>
                  </div>
                </div>

                {panchangamData.chandrashtama_for && (
                  <div className="info-item">
                    <div className="info-icon">🔄</div>
                    <div className="info-content">
                      <div className="info-label">Chandrashtama for</div>
                      <div className="info-value">
                        {convertChandrashtamaToTamil(
                          panchangamData.chandrashtama_for,
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="cosmic-score-container">
                <div className="cosmic-score-header">
                  <div className="info-icon">🌿</div>
                  <div className="info-label">Cosmic Score</div>
                </div>
                <div className="cosmic-score-value">
                  {renderCosmicScore(panchangamData.cosmic_score)}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p> Creation {new Date().getFullYear()} Sivaraman Rajagopal</p>
      </footer>

      <style jsx>{`
        /* Basic styling */
        :root {
          --primary-color: #FF9800;
          --primary-dark: #F57C00;
          --primary-light: #FFE0B2;
          --accent-color: #4f46e5;
          --warning-color: #d32f2f;
          --success-color: #22c55e;
          --text-color: #333;
          --text-secondary: #666;
          --background-color: #f5f7fa;
          --card-background: #ffffff;
          --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          --border-radius: 14px;
          --card-border: 1px solid rgba(234, 234, 242, 0.6);
          --special-gradient: linear-gradient(135deg, #FF9A9E 0%, #FAD0C4 100%);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background-color: var(--background-color);
          color: var(--text-color);
          line-height: 1.6;
        }

        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* Header Styles */
        .header {
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .header-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        h1 {
          color: var(--primary-dark);
          margin-bottom: 10px;
          font-size: 1.6rem;
          text-align: center;
          font-weight: 700;
          background: linear-gradient(90deg, #FF8E53 0%, #FE6B8B 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          position: relative;
          line-height: 1.4;
        }

        h1::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: linear-gradient(90deg, #FF8E53 0%, #FE6B8B 100%);
          border-radius: 2px;
        }

        .date-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .date-selector {
          width: 100%;
          max-width: 240px;
        }

        .date-selector input {
          padding: 12px 15px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          font-size: 16px;
          width: 100%;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .date-selector input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.2);
        }

        .speak-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          color: white;
          background: #1976D2;
          linear-gradient(135deg, var(--accent-color), #1976D2;);
          color: White;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          max-width: 240px;
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
        }

        .speak-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        }

        .speak-button:active {
          transform: translateY(0);
        }

        .speak-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .speak-button.playing {
          background: linear-gradient(135deg, #f43f5e, #ec4899);
          box-shadow: 0 2px 8px rgba(244, 63, 94, 0.3);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(244, 63, 94, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(244, 63, 94, 0);
          }
        }

        .speak-icon {
          font-size: 18px;
        }

        /* Loading & No Data */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: var(--border-radius);
          padding: 40px 20px;
          box-shadow: var(--card-shadow);
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 152, 0, 0.2);
          border-top: 3px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .no-data {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: var(--border-radius);
          padding: 40px 20px;
          box-shadow: var(--card-shadow);
          text-align: center;
        }

        .no-data-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .no-data p {
          margin-bottom: 8px;
          color: var(--text-secondary);
        }

        /* Main Content */
        .main-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .card {
          background: var(--card-background);
          border-radius: var(--border-radius);
          box-shadow: var(--card-shadow);
          padding: 18px;
          border: var(--card-border);
          overflow: hidden;
        }

        .card-title {
          font-size: 1.1rem;
          color: var(--text-color);
          margin-bottom: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
          padding-bottom: 8px;
        }

        .card-title::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 2px;
          background-color: var(--primary-color);
          border-radius: 2px;
        }

        .title-icon {
          font-size: 1.2rem;
        }

        .subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 400;
          margin-left: 5px;
        }

        /* Primary Info */
.primary-info {
  background: linear-gradient(135deg, #f8c84d 0%, #ff9966 100%); /* Brighter gold-to-orange gradient */
  color: #fff;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

        .primary-info::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.12);
          z-index: -1;
        }

.primary-info .info-label {
  color: #ffff00; /* Bright yellow for the "Date" and "Day" labels */
  font-weight: 700;
  font-size: 1rem;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}

.primary-info .info-value {
  background-color: rgba(255, 255, 255, 0.15); /* Slightly more visible background */
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-weight: 700;
  font-size: 1.25rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

        .primary-info .info-icon {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Important Times */
        .important-times {
          border-left: 3px solid #fbbf24;
        }

        /* Special Info */
        .special-info {
          border-bottom: 3px solid var(--primary-color);
        }

        .special-day {
          font-weight: 500;
        }

        /* Info Grids */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .info-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .info-item.full-width {
          grid-column: span 2;
        }

        .info-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 50%;
          font-size: 16px;
        }

        .info-content {
          flex: 1;
        }

        .info-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }

        .info-value {
          font-weight: 500;
        }

.nakshatra-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1.1rem;
  color: #1e293b; /* Darker text color */
}

        /* Times Grid */
        .times-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .time-item {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .time-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 50%;
          font-size: 18px;
        }

        .time-content {
          flex: 1;
        }

        .time-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .time-value {
          font-weight: 500;
        }

        /* RS Nakshatra Warning */
        .rs-nakshatra-warning {
          background-color: #fff5f5;
          border: none;
          border-left: 4px solid var(--warning-color);
          margin-bottom: 0;
          position: relative;
          overflow: hidden;
        }

        .rs-nakshatra-warning::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at top right, rgba(253, 164, 175, 0.2), transparent 70%);
          z-index: 0;
        }

        .warning-header {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          position: relative;
          z-index: 1;
        }

        .warning-icon-container {
          position: relative;
        }

        .warning-icon {
          font-size: 24px;
          margin-right: 12px;
          position: relative;
          animation: pulse-warning 2s infinite;
        }

        @keyframes pulse-warning {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        .warning-header h3 {
          margin: 0;
          color: var(--warning-color);
          font-size: 18px;
          font-weight: 600;
        }

        .warning-text {
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
          font-size: 15px;
        }

        .highlight {
          background-color: rgba(253, 164, 175, 0.2);
          padding: 2px 5px;
          border-radius: 4px;
        }

        .warning-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          z-index: 1;
          background-color: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          padding: 12px;
        }

        .warning-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 8px 12px;
          background-color: rgba(255, 255, 255, 0.8);
          border-radius: 8px;
          border-left: 2px solid var(--warning-color);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }

        .warning-item-icon {
          font-size: 18px;
          min-width: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .warning-item-text {
          flex: 1;
          font-size: 14px;
        }

        /* RS Badge */
.rs-badge {
  background-color: #f44336; /* Brighter red */
  color: white;
  font-size: 11px;
  padding: 3px 7px;
  border-radius: 10px;
  display: inline-block;
  vertical-align: middle;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(244, 67, 54, 0.4);
  margin-left: 8px;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

        /* Tithi Styles */
        .tithi-section {
          margin-bottom: 16px;
        }

        .tithi-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        .tithi-item {
          padding: 10px 14px;
          background-color: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
          border-left: 3px solid #9ca3af;
          transition: all 0.2s ease;
        }

        .tithi-item:hover {
          background-color: rgba(0, 0, 0, 0.03);
          transform: translateX(2px);
        }

        .active-tithi {
          border-left-color: var(--success-color);
          background-color: rgba(34, 197, 94, 0.08);
        }

        .tithi-name {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .tithi-name-content {
          display: flex;
          align-items: center;
        }

        .tithi-main-name {
          font-weight: 500;
        }

        .tithi-paksha {
          font-weight: normal;
          color: var(--text-secondary);
          margin-left: 6px;
          font-size: 0.9em;
        }

        .active-badge {
          background-color: var(--success-color);
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          display: inline-block;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
        }

        .tithi-time {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        /* Moon Phase */
        .moon-phase {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          margin-top: 10px;
          background-color: rgba(0, 0, 0, 0.03);
          border-radius: 8px;
          gap: 10px;
          width: fit-content;
        }

        .moon-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          position: relative;
          overflow: hidden;
        }

        .waxing-moon {
          background: linear-gradient(90deg, #f8fafc 0%, #f8fafc 50%, #94a3b8 50%, #94a3b8 100%);
        }

        .waning-moon {
          background: linear-gradient(270deg, #f8fafc 0%, #f8fafc 50%, #94a3b8 50%, #94a3b8 100%);
        }

        .valar-pirai .moon-icon {
          box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.3);
        }

        .thei-pirai .moon-icon {
          box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.3);
        }

        .moon-text {
          font-size: 14px;
          font-weight: 500;
        }

        .valar-pirai .moon-text {
          color: var(--success-color);
        }

        .thei-pirai .moon-text {
          color: var(--warning-color);
        }

        /* Cosmic Score */
        .cosmic-score-container {
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .cosmic-score-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .cosmic-score-display {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
        }

        .cosmic-score-number {
          font-size: 1.8rem;
          font-weight: 600;
          text-align: center;
          margin-bottom: 5px;
        }

        .cosmic-score-bar {
          height: 8px;
          background-color: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
          overflow: hidden;
        }

        .cosmic-score-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 1s ease-out;
        }

        /* Footer */
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          font-size: 14px;
          color: var(--text-secondary);
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        /* Media Queries */
        @media (max-width: 500px) {
          .container {
            padding: 15px 10px;
          }

          .info-grid, .times-grid {
            grid-template-columns: 1fr;
          }

          .card {
            padding: 16px;
          }

          h1 {
            font-size: 1.4rem;
          }

          .card-title {
            font-size: 1rem;
          }

          .info-icon, .time-icon {
            min-width: 32px;
            height: 32px;
          }

          .speak-button {
            padding: 10px 15px;
          }

          .cosmic-score-number {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
