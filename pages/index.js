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
    Swathi: "ஸ்வாதி",
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

  // Reverse mapping for Tamil to English
  const nakshatraTamilToEnglish = {};
  Object.entries(nakshatraEnglishToTamil).forEach(([english, tamil]) => {
    nakshatraTamilToEnglish[tamil] = english;
  });

  // Alternative spellings for each nakshatra
  const nakshatraAlternatives = {
    அசுவினி: ["அஸ்வினி", "அச்வினி"],
    பரணி: ["பரநி"],
    கார்த்திகை: ["கிருத்திகை", "கிருத்திகா", "கார்திகை"],
    திருவாதிரை: ["திருவாதிரா", "ஆர்திரா", "ஆர்த்ரா"],
    ஆயில்யம்: ["ஆஷ்லேஷா", "ஆஸ்லேஷா", "அஸ்லேசா"],
    ஹஸ்தம்: ["அஸ்தம்", "ஹஸ்த"],
    சித்திரை: ["சித்ரா", "சித்ர"],
    சுவாதி: ["ஸ்வாதி", "ஸ்வாதீ"],
    ஸ்வாதி: ["சுவாதி", "ஸ்வாதீ", "Swati", "Swathi"],
    விசாகம்: ["விசாக", "விசாகா", "விஷாகம்"],
    கேட்டை: ["ஜ்யேஷ்டா", "ஜேஷ்டா", "ஜ்யேஷ்ட"],
    பூராடம்: ["பூர்வாஷாடா", "பூர்வாஷாட", "பூர்வ அஷாடா"],
    உத்திராடம்: ["உத்தராஷாடா", "உத்தராஷாட", "உத்தர அஷாடா"],
    பூரட்டாதி: ["பூர்வ பத்ரபதா", "பூர்வா பாத்ரபதா"],
    உத்திரட்டாதி: ["உத்தர பத்ரபதா", "உத்தரா பாத்ரபதா"],
  };

  // Mapping for RS Nakshatra group
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

  // All alternative spellings for RS Nakshatras
  const rsNakshatraAlternatives = rsNakshatraTamilNames
    .map((name) => nakshatraAlternatives[name] || [])
    .flat();

  // Navigation functions
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(selectedDate.getDate() - 1);
    setSelectedDate(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);
    setSelectedDate(nextDay);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

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
        <div className="tithi-timeline">
          {tithiData.map((tithi, index) => {
            const startDate = new Date(tithi.start);
            const endDate = new Date(tithi.end);
            const now = new Date();
            const isActive = now >= startDate && now <= endDate;

            return (
              <div
                key={index}
                className={`tithi-block ${isActive ? "current" : ""}`}
              >
                <div className="tithi-indicator">
                  <div
                    className={`tithi-dot ${isActive ? "active" : ""}`}
                  ></div>
                  {isActive && <div className="pulse-ring"></div>}
                </div>
                <div className="tithi-info">
                  <div className="tithi-header">
                    <span className="tithi-name">{tithi.name}</span>
                    {isActive && <span className="current-badge">Live</span>}
                  </div>
                  <div className="tithi-details">
                    <span className="paksha">{tithi.paksha}</span>
                    <span className="timing">
                      {startDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {endDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
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

      const mainNakshatra = data.main_nakshatra;
      const isTamilNakshatra = /[\u0B80-\u0BFF]/.test(mainNakshatra);

      let englishNakshatraName = "";
      let tamilNakshatraName = "";

      if (isTamilNakshatra) {
        tamilNakshatraName = mainNakshatra;
        englishNakshatraName = nakshatraTamilToEnglish[mainNakshatra] || "";
      } else {
        englishNakshatraName = mainNakshatra;
        tamilNakshatraName = nakshatraEnglishToTamil[mainNakshatra] || "";
      }

      let isRSNakshatra = false;

      if (
        rsNakshatraGroup.includes(englishNakshatraName) ||
        rsNakshatraGroup.includes(mainNakshatra) ||
        rsNakshatraTamilNames.includes(tamilNakshatraName) ||
        rsNakshatraTamilNames.includes(mainNakshatra) ||
        mainNakshatra === "Swati" ||
        mainNakshatra === "Swathi" ||
        mainNakshatra === "ஸ்வாதி" ||
        mainNakshatra === "சுவாதி" ||
        rsNakshatraAlternatives.includes(mainNakshatra)
      ) {
        isRSNakshatra = true;
      }

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

      let moonPhase = {
        is_valar_pirai: false,
        is_thei_pirai: false,
      };

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
          moonPhase.is_valar_pirai = tithiData.some(
            (t) => t.paksha === "சுக்ல பக்ஷ",
          );
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
    if (data.is_pournami) return "பௌர்ணமி";
    if (data.is_amavasai) return "அமாவாசை";
    if (data.is_ekadashi) return "ஏகாதசி";
    if (data.is_dwadashi) return "துவாதசி";
    if (data.is_ashtami) return "அஷ்டமி";
    if (data.is_navami) return "நவமி";
    if (data.is_trayodashi) return "திரயோதசி";
    if (data.is_sashti) return "சஷ்டி";
    return "Normal Day";
  };

  const speakContent = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Text-to-speech is not supported in your browser");
      return;
    }
    if (!panchangamData) return;

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

  const renderCosmicScore = (score) => {
    if (!score) return <span className="score-na">N/A</span>;

    const numericScore = parseFloat(score);
    let scoreLevel = "average";
    let scoreColor = "#f59e0b";

    if (numericScore >= 8) {
      scoreLevel = "excellent";
      scoreColor = "#10b981";
    } else if (numericScore <= 4) {
      scoreLevel = "poor";
      scoreColor = "#ef4444";
    }

    return (
      <div className={`cosmic-score ${scoreLevel}`}>
        <div className="score-circle">
          <svg className="score-ring" width="120" height="120">
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke={scoreColor}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${numericScore * 31.4} 314`}
              className="score-progress"
            />
          </svg>
          <div className="score-text">
            <span className="score-number">{score}</span>
            <span className="score-total">/10</span>
          </div>
        </div>
        <div className="score-label">Cosmic Energy</div>
      </div>
    );
  };

  return (
    <div className="panchangam-app">
      <Head>
        <title>Tamil Panchangam - Daily Vedic Calendar</title>
        <meta
          name="description"
          content="Daily panchangam information for auspicious timing"
        />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Hero Header */}
      <div className="hero-header">
        <div className="hero-bg"></div>
        <div className="hero-content">
          <h1 className="app-title">
            <span className="title-icon">🕉️</span>
            Tamil Panchangam
            <span className="title-subtitle">Daily Vedic Calendar</span>
          </h1>

          {/* Date Navigator */}
          <div className="date-navigator">
            <button onClick={goToPreviousDay} className="date-nav-btn prev">
              <span>←</span>
            </button>

            <div className="date-center">
              <input
                type="date"
                value={formatDate(selectedDate)}
                onChange={handleDateChange}
                className="date-input"
              />
              <div className="selected-date">
                <div className="date-main">
                  {selectedDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                  })}
                </div>
                <div className="date-year">
                  {selectedDate.getFullYear()} •{" "}
                  {selectedDate.toLocaleDateString("en-IN", {
                    weekday: "long",
                  })}
                </div>
              </div>
            </div>

            <button onClick={goToNextDay} className="date-nav-btn next">
              <span>→</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <button onClick={goToToday} className="action-btn today">
              <span>📅</span>
              Today
            </button>
            <button
              onClick={speakContent}
              className={`action-btn voice ${isVoicePlaying ? "playing" : ""}`}
              disabled={loading || !panchangamData}
            >
              <span>{isVoicePlaying ? "⏹️" : "🔊"}</span>
              {isVoicePlaying ? "Stop" : "Listen"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-animation">
              <div className="loading-circle"></div>
              <div className="loading-circle"></div>
              <div className="loading-circle"></div>
            </div>
            <h3>Loading Panchangam...</h3>
            <p>பஞ்சாங்க தகவல்களைப் பெறுகிறது</p>
          </div>
        ) : !panchangamData ? (
          <div className="no-data-state">
            <div className="no-data-icon">🗓️</div>
            <h3>No Data Available</h3>
            <p>இந்த தேதிக்கான பஞ்சாங்க தகவல் இல்லை</p>
          </div>
        ) : (
          <div className="content-grid">
            {/* RS Nakshatra Alert */}
            {rsNakshatraInfo && (
              <div className="alert-card rs-warning">
                <div className="alert-icon">
                  <span className="warning-symbol">⚠️</span>
                </div>
                <div className="alert-content">
                  <h3>RS Nakshatra Alert</h3>
                  <p className="alert-subtitle">தீதுரு நட்சத்திர எச்சரிக்கை</p>
                  <div className="alert-message">
                    Today's nakshatra{" "}
                    <strong>
                      {rsNakshatraInfo.nakshatra_name_tamil ||
                        rsNakshatraInfo.nakshatra_name}
                    </strong>{" "}
                    is considered inauspicious.
                  </div>
                  <div className="warning-tags">
                    <span className="warning-tag">💊 Avoid Medical</span>
                    <span className="warning-tag">✈️ No Travel</span>
                    <span className="warning-tag">💰 No Finance</span>
                  </div>
                </div>
              </div>
            )}

            {/* Today's Overview */}
            <div className="overview-card">
              <div className="card-header">
                <h2>Today's Overview</h2>
                <span className="header-icon">📊</span>
              </div>
              <div className="overview-content">
                <div className="overview-item primary">
                  <div className="item-label">Date</div>
                  <div className="item-value">
                    {new Date(panchangamData.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="overview-item">
                  <div className="item-label">Day</div>
                  <div className="item-value">
                    {panchangamData.vaara ||
                      new Date(panchangamData.date).toLocaleDateString(
                        "en-IN",
                        { weekday: "long" },
                      )}
                  </div>
                </div>
                <div className="overview-item special">
                  <div className="item-label">Special Day</div>
                  <div className="item-value">
                    {getSpecialDay(panchangamData)}
                  </div>
                </div>
              </div>
            </div>

            {/* Nakshatra Card */}
            <div className="feature-card nakshatra">
              <div className="card-header">
                <h2>Nakshatra</h2>
                <span className="header-icon">⭐</span>
              </div>
              <div className="feature-content">
                <div className="main-nakshatra">
                  <div className="nakshatra-name">
                    {panchangamData.main_nakshatra || "N/A"}
                    {rsNakshatraInfo && (
                      <span className="rs-indicator">RS</span>
                    )}
                  </div>
                  <div className="nakshatra-yogam">
                    {panchangamData.nakshatra_yogam || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Tithi & Moon Phase */}
            <div className="feature-card tithi">
              <div className="card-header">
                <h2>Tithi</h2>
                <span className="header-icon">🌙</span>
              </div>
              <div className="feature-content">
                {formatTithiData(panchangamData.tithi)}
                {panchangamData.is_valar_pirai && (
                  <div className="moon-phase waxing">
                    <span className="moon-icon">🌔</span>
                    <span>வளர்பிறை (Waxing Moon)</span>
                  </div>
                )}
                {panchangamData.is_thei_pirai && (
                  <div className="moon-phase waning">
                    <span className="moon-icon">🌖</span>
                    <span>தேய்பிறை (Waning Moon)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cosmic Score */}
            <div className="feature-card cosmic">
              <div className="card-header">
                <h2>Cosmic Energy</h2>
                <span className="header-icon">🌌</span>
              </div>
              <div className="feature-content cosmic-content">
                {renderCosmicScore(panchangamData.cosmic_score)}
              </div>
            </div>

            {/* Sun & Moon Times */}
            <div className="times-card">
              <div className="card-header">
                <h2>Celestial Times</h2>
                <span className="header-icon">🌅</span>
              </div>
              <div className="times-grid">
                <div className="time-block sunrise">
                  <div className="time-icon">🌅</div>
                  <div className="time-info">
                    <div className="time-label">Sunrise</div>
                    <div className="time-value">
                      {formatTime(panchangamData.sunrise)}
                    </div>
                  </div>
                </div>
                <div className="time-block sunset">
                  <div className="time-icon">🌇</div>
                  <div className="time-info">
                    <div className="time-label">Sunset</div>
                    <div className="time-value">
                      {formatTime(panchangamData.sunset)}
                    </div>
                  </div>
                </div>
                <div className="time-block moonrise">
                  <div className="time-icon">🌕</div>
                  <div className="time-info">
                    <div className="time-label">Moonrise</div>
                    <div className="time-value">
                      {formatTime(panchangamData.moonrise)}
                    </div>
                  </div>
                </div>
                <div className="time-block moonset">
                  <div className="time-icon">🌑</div>
                  <div className="time-info">
                    <div className="time-label">Moonset</div>
                    <div className="time-value">
                      {formatTime(panchangamData.moonset)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inauspicious Times */}
            <div className="warning-times-card">
              <div className="card-header">
                <h2>Avoid These Times</h2>
                <span className="header-icon">⚠️</span>
              </div>
              <div className="warning-times-grid">
                <div className="warning-time">
                  <div className="warning-time-label">Rahu Kalam</div>
                  <div className="warning-time-value">
                    {panchangamData.rahu_kalam || "N/A"}
                  </div>
                </div>
                <div className="warning-time">
                  <div className="warning-time-label">Yamagandam</div>
                  <div className="warning-time-value">
                    {panchangamData.yamagandam || "N/A"}
                  </div>
                </div>
                <div className="warning-time">
                  <div className="warning-time-label">Kuligai</div>
                  <div className="warning-time-value">
                    {panchangamData.kuligai || "N/A"}
                  </div>
                </div>
                <div className="warning-time auspicious">
                  <div className="warning-time-label">Abhijit Muhurta</div>
                  <div className="warning-time-value">
                    {panchangamData.abhijit_muhurta || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="additional-card">
              <div className="card-header">
                <h2>Additional Info</h2>
                <span className="header-icon">ℹ️</span>
              </div>
              <div className="additional-content">
                <div className="additional-item">
                  <div className="item-label">Yoga</div>
                  <div className="item-value">
                    {(panchangamData.yoga &&
                      getFirstItem(panchangamData.yoga)?.name) ||
                      "N/A"}
                  </div>
                </div>
                <div className="additional-item">
                  <div className="item-label">Karana</div>
                  <div className="item-value">
                    {(panchangamData.karana &&
                      getFirstItem(panchangamData.karana)?.name) ||
                      "N/A"}
                  </div>
                </div>
                {panchangamData.chandrashtama_for && (
                  <div className="additional-item">
                    <div className="item-label">Chandrashtama for</div>
                    <div className="item-value">
                      {convertChandrashtamaToTamil(
                        panchangamData.chandrashtama_for,
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .panchangam-app {
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: #1a1a1a;
        }

        /* Hero Header */
        .hero-header {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem 1rem 3rem;
          text-align: center;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="white" opacity="0.1"/><circle cx="80" cy="40" r="0.5" fill="white" opacity="0.1"/><circle cx="40" cy="80" r="1.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
          margin: 0 auto;
        }

        .app-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .title-icon {
          font-size: 3rem;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }

        .title-subtitle {
          font-size: 1rem;
          font-weight: 400;
          opacity: 0.9;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        /* Date Navigator */
        .date-navigator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          margin: 2rem 0;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .date-nav-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .date-nav-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .date-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .date-input {
          opacity: 0;
          position: absolute;
          pointer-events: none;
        }

        .selected-date {
          text-align: center;
          color: white;
          cursor: pointer;
          padding: 1rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          min-width: 200px;
        }

        .selected-date:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .date-main {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .date-year {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        /* Quick Actions */
        .quick-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .action-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn.playing {
          background: rgba(239, 68, 68, 0.3);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        /* Main Container */
        .main-container {
          max-width: 1400px;
          margin: -2rem auto 0;
          padding: 0 1rem 2rem;
          position: relative;
          z-index: 3;
        }

        /* Loading State */
        .loading-state {
          background: white;
          border-radius: 20px;
          padding: 4rem 2rem;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .loading-animation {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }

        .loading-circle {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #667eea;
          animation: loading-bounce 1.4s ease-in-out infinite both;
        }

        .loading-circle:nth-child(1) {
          animation-delay: -0.32s;
        }
        .loading-circle:nth-child(2) {
          animation-delay: -0.16s;
        }
        .loading-circle:nth-child(3) {
          animation-delay: 0;
        }

        @keyframes loading-bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        .loading-state h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .loading-state p {
          color: #666;
        }

        /* No Data State */
        .no-data-state {
          background: white;
          border-radius: 20px;
          padding: 4rem 2rem;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .no-data-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .no-data-state h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .no-data-state p {
          color: #666;
        }

        /* Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }

        /* Card Base Styles */
        .feature-card,
        .overview-card,
        .times-card,
        .warning-times-card,
        .additional-card {
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .feature-card:hover,
        .overview-card:hover,
        .times-card:hover,
        .warning-times-card:hover,
        .additional-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f0f0f0;
        }

        .card-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #333;
        }

        .header-icon {
          font-size: 1.5rem;
          opacity: 0.7;
        }

        /* Alert Card */
        .alert-card {
          grid-column: 1 / -1;
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          color: white;
          border-radius: 20px;
          padding: 2rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          box-shadow: 0 15px 35px rgba(255, 107, 107, 0.3);
          border: none;
        }

        .alert-icon {
          flex-shrink: 0;
        }

        .warning-symbol {
          font-size: 3rem;
          animation: shake 0.5s ease-in-out infinite alternate;
        }

        @keyframes shake {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(5px);
          }
        }

        .alert-content h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }

        .alert-subtitle {
          opacity: 0.9;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .alert-message {
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .warning-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .warning-tag {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 0.5rem 1rem;
          border-radius: 25px;
          font-size: 0.85rem;
          font-weight: 500;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        /* Overview Card */
        .overview-card {
          grid-column: 1 / -1;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .overview-card .card-header {
          border-bottom-color: rgba(255, 255, 255, 0.3);
        }

        .overview-card .card-header h2,
        .overview-card .header-icon {
          color: white;
        }

        .overview-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .overview-item {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .overview-item.primary {
          background: rgba(255, 255, 255, 0.25);
        }

        .overview-item.special {
          background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.3),
            rgba(5, 150, 105, 0.3)
          );
        }

        .item-label {
          font-size: 0.85rem;
          opacity: 0.8;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 500;
        }

        .item-value {
          font-size: 1.1rem;
          font-weight: 600;
        }

        /* Nakshatra Card */
        .feature-card.nakshatra {
          background: linear-gradient(135deg, #ffecd2, #fcb69f);
        }

        .main-nakshatra {
          text-align: center;
        }

        .nakshatra-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #d63031;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .rs-indicator {
          background: #d63031;
          color: white;
          font-size: 0.7rem;
          padding: 0.3rem 0.6rem;
          border-radius: 20px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .nakshatra-yogam {
          font-size: 1rem;
          color: #636e72;
          font-weight: 500;
        }

        /* Tithi Card */
        .feature-card.tithi {
          background: linear-gradient(135deg, #a8edea, #fed6e3);
        }

        .tithi-timeline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .tithi-block {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .tithi-block.current {
          background: rgba(16, 185, 129, 0.2);
          border-left: 4px solid #10b981;
        }

        .tithi-indicator {
          position: relative;
          flex-shrink: 0;
        }

        .tithi-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ddd;
          transition: all 0.3s ease;
        }

        .tithi-dot.active {
          background: #10b981;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
        }

        .pulse-ring {
          position: absolute;
          top: -6px;
          left: -6px;
          width: 24px;
          height: 24px;
          border: 2px solid #10b981;
          border-radius: 50%;
          animation: pulse-ring 2s ease-out infinite;
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .tithi-info {
          flex-grow: 1;
        }

        .tithi-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .tithi-name {
          font-weight: 600;
          color: #2d3436;
        }

        .current-badge {
          background: #10b981;
          color: white;
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          border-radius: 10px;
          font-weight: 600;
        }

        .tithi-details {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.85rem;
          color: #636e72;
        }

        .paksha {
          font-weight: 500;
        }

        .timing {
          font-weight: 400;
        }

        /* Moon Phase */
        .moon-phase {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          margin-top: 1rem;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 12px;
          font-weight: 600;
        }

        .moon-phase.waxing {
          color: #00b894;
        }

        .moon-phase.waning {
          color: #e17055;
        }

        .moon-icon {
          font-size: 1.5rem;
        }

        /* Cosmic Card */
        .feature-card.cosmic {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .cosmic-content {
          display: flex;
          justify-content: center;
        }

        .cosmic-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .score-circle {
          position: relative;
          width: 120px;
          height: 120px;
        }

        .score-ring {
          transform: rotate(-90deg);
        }

        .score-progress {
          transition: stroke-dasharray 2s ease-out;
        }

        .score-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .score-number {
          font-size: 2rem;
          font-weight: 700;
          display: block;
        }

        .score-total {
          font-size: 1rem;
          opacity: 0.7;
        }

        .score-label {
          font-weight: 600;
          text-align: center;
          opacity: 0.9;
        }

        .score-na {
          font-size: 1.2rem;
          color: #666;
        }

        /* Times Card */
        .times-card {
          grid-column: span 2;
        }

        .times-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .time-block {
          background: linear-gradient(135deg, #ffecd2, #fcb69f);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .time-block:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .time-block.sunrise {
          background: linear-gradient(135deg, #fd79a8, #fdcb6e);
        }
        .time-block.sunset {
          background: linear-gradient(135deg, #e17055, #fdcb6e);
        }
        .time-block.moonrise {
          background: linear-gradient(135deg, #74b9ff, #0984e3);
        }
        .time-block.moonset {
          background: linear-gradient(135deg, #636e72, #2d3436);
          color: white;
        }

        .time-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          display: block;
        }

        .time-label {
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.8;
        }

        .time-value {
          font-size: 1.1rem;
          font-weight: 700;
        }

        /* Warning Times Card */
        .warning-times-card {
          grid-column: span 2;
          background: linear-gradient(135deg, #fab1a0, #e17055);
          color: white;
        }

        .warning-times-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .warning-time {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .warning-time.auspicious {
          background: rgba(16, 185, 129, 0.3);
          border-color: rgba(16, 185, 129, 0.5);
        }

        .warning-time-label {
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.9;
        }

        .warning-time-value {
          font-size: 1.1rem;
          font-weight: 700;
        }

        /* Additional Card */
        .additional-content {
          display: grid;
          gap: 1rem;
        }

        .additional-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .additional-item .item-label {
          font-weight: 500;
          color: #666;
        }

        .additional-item .item-value {
          font-weight: 600;
          color: #333;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .app-title {
            font-size: 2rem;
          }

          .date-navigator {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
          }

          .quick-actions {
            flex-direction: column;
            align-items: center;
          }

          .content-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .times-card,
          .warning-times-card {
            grid-column: span 1;
          }

          .times-grid,
          .warning-times-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .overview-content {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .hero-header {
            padding: 1.5rem 0.5rem 2rem;
          }

          .app-title {
            font-size: 1.5rem;
          }

          .title-icon {
            font-size: 2rem;
          }

          .main-container {
            padding: 0 0.5rem 1rem;
          }

          .times-grid,
          .warning-times-grid {
            grid-template-columns: 1fr;
          }

          .alert-card {
            flex-direction: column;
            text-align: center;
          }

          .warning-tags {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
