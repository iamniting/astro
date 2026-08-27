const dateInput = document.querySelector("#dateInput");
const calendarButton = document.querySelector("#calendarButton");
const calendarPopup = document.querySelector("#calendarPopup");
const cityInput = document.querySelector("#cityInput");
const cityResults = document.querySelector("#cityResults");
const locationButton = document.querySelector("#locationButton");
const homePanel = document.querySelector("#home");
const raahuPanel = document.querySelector("#raahu-kaal");
const homeNav = document.querySelector("#homeNav");
const raahuNav = document.querySelector("#raahuNav");
const output = {
  weekday: document.querySelector("#weekday"),
  location: document.querySelector("#locationName"),
  raahu: document.querySelector("#raahuTime"),
  sunrise: document.querySelector("#sunrise"),
  sunset: document.querySelector("#sunset"),
  zone: document.querySelector("#timezone"),
};

// The Raahu Kaal segment, counting from sunrise (0–7), for Sunday through Saturday.
const rahuSegments = [7, 1, 6, 4, 5, 3, 2];
let selectedLocation = {
  lat: 28.6139,
  lng: 77.209,
  name: "New Delhi, India",
  timezone: "Asia/Kolkata",
};
let calendarCursor = new Date();

function saveLocation() {
  const value = encodeURIComponent(JSON.stringify(selectedLocation));
  document.cookie = `raahu_location=${value}; max-age=31536000; path=/; SameSite=Lax`;
  try {
    localStorage.setItem("raahu_location", value);
  } catch {
    /* Cookie storage remains available. */
  }
}
function restoreLocation() {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith("raahu_location="));
  let value = cookie?.slice("raahu_location=".length);
  if (!value) {
    try {
      value = localStorage.getItem("raahu_location");
    } catch {
      /* No local-storage access. */
    }
  }
  if (!value) return;
  try {
    const location = JSON.parse(decodeURIComponent(value));
    if (
      typeof location.lat === "number" &&
      typeof location.lng === "number" &&
      location.name &&
      location.timezone
    ) {
      selectedLocation = location;
      cityInput.value = location.name.replace(/, India$/, "");
    }
  } catch {
    /* Ignore an invalid or outdated location cookie. */
  }
}

function pad(n) {
  return String(n).padStart(2, "0");
}
function localDateValue(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}
function parseDateValue(value) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}
function calendarDateValue(date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}
function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const selected = parseDateValue(dateInput.value);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  const blankDays = Array.from(
    { length: firstDay },
    () => '<span class="calendar-day blank"></span>',
  );
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const isSelected =
      selected &&
      selected.getFullYear() === year &&
      selected.getMonth() === month &&
      selected.getDate() === day;
    return `<button class="calendar-day${isSelected ? " selected" : ""}" type="button" data-calendar-day="${day}">${day}</button>`;
  });
  const months = Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat("en-IN", { month: "short" }).format(
      new Date(2000, index, 1),
    ),
  );
  const monthOptions = months
    .map(
      (name, index) =>
        `<option value="${index}"${index === month ? " selected" : ""}>${name}</option>`,
    )
    .join("");
  const yearOptions = Array.from({ length: 201 }, (_, index) => index + 1900)
    .map(
      (optionYear) =>
        `<option value="${optionYear}"${optionYear === year ? " selected" : ""}>${optionYear}</option>`,
    )
    .join("");
  calendarPopup.innerHTML = `<div class="calendar-header"><button type="button" data-calendar-action="previous" aria-label="Previous month">‹</button><span class="calendar-selects"><select data-calendar-month aria-label="Choose month">${monthOptions}</select><select data-calendar-year aria-label="Choose year">${yearOptions}</select></span><button type="button" data-calendar-action="next" aria-label="Next month">›</button></div><div class="calendar-grid">${weekdays.map((day) => `<span class="calendar-weekday">${day}</span>`).join("")}${blankDays.join("")}${days.join("")}</div>`;
  calendarPopup.querySelectorAll("[data-calendar-action]").forEach((button) =>
    button.addEventListener("click", () => {
      calendarCursor = new Date(
        year,
        month + (button.dataset.calendarAction === "next" ? 1 : -1),
        1,
      );
      renderCalendar();
    }),
  );
  calendarPopup
    .querySelector("[data-calendar-month]")
    .addEventListener("change", (event) => {
      calendarCursor = new Date(year, Number(event.target.value), 1);
      renderCalendar();
    });
  calendarPopup
    .querySelector("[data-calendar-year]")
    .addEventListener("change", (event) => {
      calendarCursor = new Date(Number(event.target.value), month, 1);
      renderCalendar();
    });
  calendarPopup.querySelectorAll("[data-calendar-day]").forEach((button) =>
    button.addEventListener("click", () => {
      const date = new Date(year, month, Number(button.dataset.calendarDay));
      dateInput.value = calendarDateValue(date);
      calendarCursor = date;
      closeCalendar();
      calculate();
    }),
  );
}
function closeCalendar() {
  calendarPopup.classList.remove("open");
  dateInput.setAttribute("aria-expanded", "false");
}
function toggleCalendar() {
  const isOpen = calendarPopup.classList.toggle("open");
  dateInput.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) {
    calendarCursor = parseDateValue(dateInput.value) || new Date();
    renderCalendar();
  }
}
function formatTime(utcMinutes, date, timezone) {
  const instant = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) +
      Math.round(utcMinutes) * 60000,
  );
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(instant)
    .toUpperCase();
}
function timeWithMeridiem(time) {
  return time.replace(/ (AM|PM)$/, ' <span class="meridiem">$1</span>');
}

// NOAA sunrise/sunset approximation. Returns local clock minutes for the selected coordinates.
function solarTime(date, lat, lng, rising) {
  const rad = Math.PI / 180,
    day = Math.floor(
      (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
        Date.UTC(date.getFullYear(), 0, 0)) /
        86400000,
    );
  const lngHour = lng / 15,
    approx = day + ((rising ? 6 : 18) - lngHour) / 24;
  const mean = 0.9856 * approx - 3.289;
  let sunLng =
    mean +
    1.916 * Math.sin(mean * rad) +
    0.02 * Math.sin(2 * mean * rad) +
    282.634;
  sunLng = (sunLng + 360) % 360;
  let ra = Math.atan(0.91764 * Math.tan(sunLng * rad)) / rad;
  ra = (ra + 360) % 360;
  ra += Math.floor(sunLng / 90) * 90 - Math.floor(ra / 90) * 90;
  ra /= 15;
  const sinDec = 0.39782 * Math.sin(sunLng * rad),
    cosDec = Math.cos(Math.asin(sinDec));
  const cosH =
    (Math.cos(90.833 * rad) - sinDec * Math.sin(lat * rad)) /
    (cosDec * Math.cos(lat * rad));
  if (cosH > 1 || cosH < -1) return null;
  let h = Math.acos(cosH) / rad;
  if (rising) h = 360 - h;
  h /= 15;
  const localMean = h + ra - 0.06571 * approx - 6.622;
  const utcHours = (localMean - lngHour + 24) % 24;
  return utcHours * 60;
}
function locationData() {
  return selectedLocation;
}
function showCityResults(query) {
  const search = query.trim().toLocaleLowerCase("en-IN");
  if (search.length < 2) {
    cityResults.classList.remove("open");
    cityInput.setAttribute("aria-expanded", "false");
    return;
  }
  const matches = INDIA_CITIES.filter(([name]) =>
    name.toLocaleLowerCase("en-IN").includes(search),
  ).slice(0, 8);
  cityResults.innerHTML = matches.length
    ? matches
        .map(
          ([name, lat, lng], index) =>
            `<button class="city-option" type="button" role="option" data-index="${index}">${name}, India</button>`,
        )
        .join("")
    : '<span class="city-option">No matching city found</span>';
  cityResults.classList.toggle("open", matches.length > 0);
  cityInput.setAttribute("aria-expanded", String(matches.length > 0));
  cityResults.querySelectorAll("[data-index]").forEach((button) =>
    button.addEventListener("click", () => {
      const [name, lat, lng] = matches[Number(button.dataset.index)];
      selectedLocation = {
        lat,
        lng,
        name: `${name}, India`,
        timezone: "Asia/Kolkata",
      };
      cityInput.value = name;
      saveLocation();
      cityResults.classList.remove("open");
      cityInput.setAttribute("aria-expanded", "false");
      calculate();
    }),
  );
}
function selectTypedCity() {
  const match = INDIA_CITIES.find(
    ([name]) =>
      name.toLocaleLowerCase("en-IN") ===
      cityInput.value.trim().toLocaleLowerCase("en-IN"),
  );
  if (!match) return;
  const [name, lat, lng] = match;
  selectedLocation = {
    lat,
    lng,
    name: `${name}, India`,
    timezone: "Asia/Kolkata",
  };
  cityInput.value = name;
  saveLocation();
  calculate();
}
function updateSection() {
  const homeOpen = window.location.hash !== "#raahu-kaal";
  homePanel.hidden = !homeOpen;
  raahuPanel.hidden = homeOpen;
  homeNav.classList.toggle("active", homeOpen);
  raahuNav.classList.toggle("active", !homeOpen);
  if (homeOpen) {
    homeNav.setAttribute("aria-current", "page");
    raahuNav.removeAttribute("aria-current");
  } else {
    raahuNav.setAttribute("aria-current", "page");
    homeNav.removeAttribute("aria-current");
  }
}
function calculate() {
  const date = parseDateValue(dateInput.value);
  const place = locationData();
  if (!date) {
    dateInput.setAttribute("aria-invalid", "true");
    output.weekday.textContent = "";
    output.location.textContent = place.name;
    output.raahu.textContent = "Enter a valid date";
    output.sunrise.textContent = "—";
    output.sunset.textContent = "—";
    output.zone.textContent = "Use the format DD/MM/YYYY.";
    return;
  }
  dateInput.removeAttribute("aria-invalid");
  const rise = solarTime(date, place.lat, place.lng, true),
    set = solarTime(date, place.lat, place.lng, false);
  const prettyDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
  output.weekday.textContent = date
    .toLocaleDateString(undefined, { weekday: "long" })
    .toUpperCase();
  output.location.textContent = place.name;
  if (rise == null || set == null) {
    output.raahu.textContent = "Unavailable";
    output.sunrise.textContent = "—";
    output.sunset.textContent = "—";
    output.zone.textContent =
      "No sunrise or sunset at this latitude on this date.";
    return;
  }
  const segment = (set - rise) / 8,
    start = rise + segment * rahuSegments[date.getDay()],
    end = start + segment;
  output.raahu.innerHTML = `${timeWithMeridiem(formatTime(start, date, place.timezone))} – ${timeWithMeridiem(formatTime(end, date, place.timezone))}`;
  output.sunrise.textContent = formatTime(rise, date, place.timezone);
  output.sunset.textContent = formatTime(set, date, place.timezone);
  output.zone.textContent = `${place.timezone.replace("_", " ").toUpperCase()} · ${prettyDate}`;
}
dateInput.value = localDateValue();
dateInput.addEventListener("change", () => {
  const date = parseDateValue(dateInput.value);
  if (date) {
    calendarCursor = date;
    renderCalendar();
  }
  calculate();
});
calendarButton.addEventListener("click", toggleCalendar);
cityInput.addEventListener("input", () => showCityResults(cityInput.value));
cityInput.addEventListener("focus", () => showCityResults(cityInput.value));
cityInput.addEventListener("change", selectTypedCity);
document.addEventListener("click", (event) => {
  if (!event.target.closest(".city-picker")) {
    cityResults.classList.remove("open");
    cityInput.setAttribute("aria-expanded", "false");
  }
  if (
    !event
      .composedPath()
      .some((node) => node.classList?.contains("date-picker"))
  ) {
    closeCalendar();
  }
});
window.addEventListener("hashchange", updateSection);
locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    output.zone.textContent = "Location is not supported by this browser.";
    return;
  }
  locationButton.textContent = "Finding location…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      selectedLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        name: "Your current location",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      cityInput.value = "Your current location";
      saveLocation();
      locationButton.innerHTML = "<span>⌖</span> Current location";
      calculate();
    },
    () => {
      locationButton.innerHTML = "<span>⌖</span> Location unavailable";
      output.zone.textContent = "Location permission was not granted.";
    },
    { enableHighAccuracy: false, timeout: 8000 },
  );
});
restoreLocation();
updateSection();
renderCalendar();
calculate();
