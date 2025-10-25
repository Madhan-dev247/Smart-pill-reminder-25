// SMART PILL REMINDER – Advanced Voice Fill Version
// ✅ Auto Suggest + Dosage + Sound Alert + Voice Command Parsing

const allMedicines = [
  "Paracetamol", "Pantoprazole", "Amoxicillin", "Metformin",
  "Atorvastatin", "Amlodipine", "Cetirizine", "Azithromycin",
  "Losartan", "Omeprazole", "Dolo 650", "Crocin", "Ibuprofen",
  "Levothyroxine", "Vitamin D3", "Calcium Tablet", "Insulin",
  "Metoprolol", "Aspirin", "Clopidogrel", "Domperidone",
  "Folic Acid", "Multivitamin", "Cough Syrup", "Dextromethorphan"
];

// Load suggestions
const datalist = document.getElementById("medicineNames");
allMedicines.forEach(name => {
  const option = document.createElement("option");
  option.value = name;
  datalist.appendChild(option);
});

// Medicine list
let medicines = JSON.parse(localStorage.getItem("medicines")) || [];

function renderMedicines() {
  const list = document.getElementById("medicineList");
  list.innerHTML = "";
  medicines.forEach((m) => {
    const li = document.createElement("li");
    li.textContent = `${m.name} - ${m.dosage} at ${m.time}`;
    list.appendChild(li);
  });
}
renderMedicines();

// Add medicine manually
document.getElementById("addBtn").addEventListener("click", () => {
  const name = document.getElementById("medicineName").value.trim();
  const dosage = document.getElementById("medicineDosage").value.trim();
  const time = document.getElementById("medicineTime").value.trim();

  if (!name || !time || !dosage) {
    alert("Please fill all fields!");
    return;
  }

  const med = { name, dosage, time };
  medicines.push(med);
  localStorage.setItem("medicines", JSON.stringify(medicines));
  renderMedicines();
  scheduleReminder(med);

  document.getElementById("medicineName").value = "";
  document.getElementById("medicineDosage").value = "";
  document.getElementById("medicineTime").value = "";
});

// Schedule reminder (sound only)
function scheduleReminder(medicine) {
  const now = new Date();
  const [hours, minutes] = medicine.time.split(":").map(Number);
  const reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);

  if (reminderTime < now) reminderTime.setDate(reminderTime.getDate() + 1);
  const delay = reminderTime - now;

  setTimeout(() => {
    showNotification(medicine);
  }, delay);
}

// Show reminder with sound
function showNotification(med) {
  const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
  audio.play();

  if (Notification.permission === "granted") {
    new Notification("💊 Medicine Reminder", {
      body: `Time to take ${med.name} - ${med.dosage}`,
      icon: "icon.png"
    });
  } else {
    alert(`Time to take ${med.name} - ${med.dosage}`);
  }
}

if ("Notification" in window) {
  Notification.requestPermission();
}

// 🎙️ Voice recognition setup
const voiceBtn = document.getElementById("voiceBtn");
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";

  voiceBtn.addEventListener("click", () => {
    recognition.start();
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    console.log("Voice input:", transcript);
    processVoiceCommand(transcript);
  };

  recognition.onerror = () => {
    alert("Voice recognition failed. Please try again.");
  };
} else {
  voiceBtn.disabled = true;
  voiceBtn.textContent = "🎤 Voice not supported";
}

// 🧠 Process voice command and fill fields
function processVoiceCommand(text) {
  // Extract medicine name from known list
  let foundMedicine = allMedicines.find(med => text.includes(med.toLowerCase()));
  if (!foundMedicine) {
    // fallback: try first capitalized word as medicine
    foundMedicine = text.split(" ").find(word => /^[A-Z]/.test(word)) || "";
  }

  // Extract dosage
  const dosageMatch = text.match(/(\d+|one|two|three|four|five|half)\s*(tablet|tablets|ml|capsule|capsules|drop|drops|mg)?/);
  const dosage = dosageMatch ? dosageMatch[0] : "";

  // Extract time (e.g., 9 am, 8:30 pm)
  const timeMatch = text.match(/(\d{1,2})(?:[:.](\d{1,2}))?\s*(am|pm)?/);
  let formattedTime = "";
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    let minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const ampm = timeMatch[3];
    if (ampm && ampm.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (ampm && ampm.toLowerCase() === "am" && hours === 12) hours = 0;
    formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  // Fill in fields for review
  document.getElementById("medicineName").value = foundMedicine || "";
  document.getElementById("medicineDosage").value = dosage || "";
  document.getElementById("medicineTime").value = formattedTime || "";

  if (foundMedicine) {
    alert(`Recognized: ${foundMedicine} ${dosage ? "- " + dosage : ""} ${formattedTime ? "at " + formattedTime : ""}`);
  } else {
    alert("Couldn't detect medicine name clearly. Please check fields.");
  }
    }
