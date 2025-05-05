// public/app.js
let notes = []; // Array to store notes

const callNebiAPI = async (type, input) => {
    try {
        const res = await fetch('/api/nebius', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, input })
        });

        if (!res.ok) {
            const errorText = await res.text(); // Get the error response as text
            console.error("Error calling Nebius API:", errorText);
            throw new Error(`API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        return data; // Return the response data
    } catch (error) {
        console.error("Error calling Nebius API:", error);
        return null; // Handle error appropriately
    }
};

// Add Note
document.getElementById("add-note-btn").addEventListener("click", async () => {
    const title = document.getElementById("note-title").value;
    const text = document.getElementById("note-text").value;
    if (!title || !text) {
        alert("Please enter both title and text before adding a note.");
        return;
    }
    // Save the note
    const note = { title, text };
    notes.push(note); // Add note to the array
    displayNotes(); // Update the UI to show the notes
    document.getElementById("note-title").value = ""; // Clear input fields
    document.getElementById("note-text").value = "";
});

// Display Notes
const displayNotes = () => {
    const notesContainer = document.querySelector(".notes-container");
    const noteSelect = document.getElementById("note-select");
    const reminderNoteSelect = document.getElementById("reminder-note-select");

    notesContainer.innerHTML = ""; // Clear existing notes
    noteSelect.innerHTML = '<option value="">Select a note</option>'; // Clear and reset dropdown
    reminderNoteSelect.innerHTML = '<option value="">Select a note</option>'; // Clear and reset dropdown

    notes.forEach((note, index) => {
        // Display notes in the notes container
        const noteElement = document.createElement("div");
        noteElement.className = "note";
        noteElement.innerHTML = `<h4>${note.title}</h4><p>${note.text}</p>`;
        notesContainer.appendChild(noteElement);

        // Populate the dropdowns
        const option = document.createElement("option");
        option.value = index; // Use index as value
        option.textContent = note.title; // Display note title
        noteSelect.appendChild(option);
        reminderNoteSelect.appendChild(option.cloneNode(true)); // Clone option for reminders
    });
};

// Tab Switching Logic
const tabs = document.querySelectorAll('.tab-content');
const sidebarItems = document.querySelectorAll('.sidebar-item');

sidebarItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        // Hide all tabs
        tabs.forEach(tab => tab.classList.add('hidden'));
        // Show the selected tab
        tabs[index].classList.remove('hidden');
        
        // Highlight the active sidebar item
        sidebarItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
    });
});

// Summarize Selected Note
document.getElementById("summarize-btn").addEventListener("click", async () => {
    const selectedNoteIndex = document.getElementById("note-select").value; // Get selected note index
    if (selectedNoteIndex === "") {
        alert("Please select a note to summarize.");
        return;
    }
    const response = await callNebiAPI('summarize', notes[selectedNoteIndex].text);
    
    // Check if response is valid and extract content
    if (response && response.choices && response.choices.length > 0) {
        const summaryContent = response.choices[0].message.content; // Extract the summary content
        document.getElementById("summary-result").innerText = summaryContent; // Display summary
    } else {
        document.getElementById("summary-result").innerText = "No summary available."; // Handle no summary case
    }
});

// Generate Image
document.getElementById("generate-image-btn").addEventListener("click", async () => {
    const prompt = document.getElementById("image-prompt").value;
    if (!prompt) {
        alert("Please enter a prompt before generating an image.");
        return;
    }

    const imageResponse = await callNebiAPI('image', prompt); // Just send the prompt string

    if (imageResponse && imageResponse.data && imageResponse.data[0] && imageResponse.data[0].b64_json) {
        const imageData = imageResponse.data[0].b64_json;
        const imageSrc = `data:image/png;base64,${imageData}`;
        document.getElementById("image-generation-result").innerHTML = `<img src="${imageSrc}" alt="Generated Image">`;
    } else {
        document.getElementById("image-generation-result").innerText = "Image generation failed.";
    }
});

// Image to Text using Tesseract.js
document.getElementById("generate-text-btn").addEventListener("click", async () => {
    const imageInput = document.getElementById("image-upload");
    if (imageInput.files.length === 0) {
        alert("Please upload an image before generating a description.");
        return;
    }

    const file = imageInput.files[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
        const base64data = reader.result; // Get the base64 string
        console.log("Base64 Data:", base64data); // Log the base64 data

        // Use Tesseract.js to perform OCR
        Tesseract.recognize(
            base64data,
            'eng',
            {
                logger: info => console.log(info)
            }
        ).then(result => {
            if (result && result.text) {
                const extractedText = result.text.trim();
                console.log("Extracted Text:", extractedText);
                document.getElementById("image-description-result").innerText = extractedText;
            } else {
                console.error("No text found in the image or unexpected result structure:", result);
                document.getElementById("image-description-result").innerText = "No text found in the image.";
            }
        }).catch(error => {
            console.error("OCR error:", error);
            document.getElementById("image-description-result").innerText = "Image description generation failed.";
        });        
    };

    reader.readAsDataURL(file); // Convert the image file to base64
});


// Extract Reminder from Selected Note
document.getElementById("extract-reminder-btn").addEventListener("click", async () => {
    const selectedNoteIndex = document.getElementById("reminder-note-select").value; // Get selected note index
    if (selectedNoteIndex === "") {
        alert("Please select a note to extract reminders.");
        return;
    }
    const reminder = await callNebiAPI('reminder', notes[selectedNoteIndex].text); // Call the API with the note text
    // Check if response is valid and extract content
    if (reminder && reminder.choices && reminder.choices.length > 0) {
        const reminderContent = reminder.choices[0].message.content; // Extract the reminder content
        document.getElementById("reminder-result").innerText = reminderContent; // Display reminder
    } else {
        document.getElementById("reminder-result").innerText = "No reminder available."; // Handle no reminder case
    }
});