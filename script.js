// ===== LOAD SAVED DATA =====
let courses = JSON.parse(localStorage.getItem("courses")) || [];
let sessions = JSON.parse(localStorage.getItem("sessions")) || [];

let timerInterval;
let startTime = null;
let activeCourse = "";
let activeTopic = "";

// Restore an active timer after refreshing the page
let savedTimer = JSON.parse(localStorage.getItem("activeTimer"));

if (savedTimer) {
    startTime = savedTimer.startTime;
    activeCourse = savedTimer.course;
    activeTopic = savedTimer.topic;
}


// ===== SAVE DATA =====
function saveData() {
    localStorage.setItem("courses", JSON.stringify(courses));
    localStorage.setItem("sessions", JSON.stringify(sessions));
}


// ===== DISPLAY COURSES =====
function displayCourses() {
    let courseList = document.getElementById("course-list");
    courseList.innerHTML = "";

    document.getElementById("empty-courses").style.display =
        courses.length === 0 ? "block" : "none";

    courses.forEach(function(course, courseIndex) {
        let completed = course.topics.filter(function(topic) {
            return topic.done;
        }).length;

        let total = course.topics.length;
        let progress = total === 0 ? 0 : Math.round(completed / total * 100);

        let card = document.createElement("div");
        card.className = "course-card";

        card.innerHTML = `
            <h3>${course.name}</h3>
            <p class="course-code">${course.code}</p>

            <div class="course-progress-info">
                <span>${completed} of ${total} topics completed</span>
                <span>${progress}%</span>
            </div>

            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>

            <ul class="topic-list">
                ${course.topics.map(function(topic, topicIndex) {
                    return `
                        <li class="topic-item ${topic.done ? "completed" : ""}">
                            <input type="checkbox"
                                ${topic.done ? "checked" : ""}
                                onchange="toggleTopic(${courseIndex}, ${topicIndex})">

                            <span>${topic.name}</span>

                            <div class="topic-actions">
                                <button onclick="renameTopic(${courseIndex}, ${topicIndex})">
                                    Edit
                                </button>
                                <button onclick="deleteTopic(${courseIndex}, ${topicIndex})">
                                    Delete
                                </button>
                            </div>
                        </li>
                    `;
                }).join("")}
            </ul>

            <form class="add-topic-form" onsubmit="addTopic(event, ${courseIndex})">
                <input type="text" name="topic"
                    placeholder="Add a syllabus topic..." required>
                <button type="submit">+ Add</button>
            </form>

            <div class="course-footer">
               <p>📖 ${total} syllabus topics</p>

            <div>
                 <button onclick="editCourse(${courseIndex})">Edit</button>
                 <button class="course-delete-btn"
                 onclick="deleteCourse(${courseIndex})">
                   Delete
                 </button>
           </div>
        </div>
        `;

        courseList.appendChild(card);
    });

    updateStats();
    updateCourseOptions();
}


// ===== ADD A COURSE =====
document.getElementById("course-form").addEventListener("submit", function(event) {
    event.preventDefault();

    let name = document.getElementById("course-name").value.trim();
    let code = document.getElementById("course-code").value.trim();

    if (name === "" || code === "") return;

    courses.push({
        name: name,
        code: code,
        topics: []
    });

    saveData();
    displayCourses();
    this.reset();
});


// ===== ADD A TOPIC =====
function addTopic(event, courseIndex) {
    event.preventDefault();

    let topicName = event.target.elements.topic.value.trim();

    if (topicName === "") return;

    courses[courseIndex].topics.push({
        name: topicName,
        done: false
    });

    saveData();
    displayCourses();
}


// ===== CHECK OR UNCHECK A TOPIC =====
function toggleTopic(courseIndex, topicIndex) {
    courses[courseIndex].topics[topicIndex].done =
        !courses[courseIndex].topics[topicIndex].done;

    saveData();
    displayCourses();
}


// ===== RENAME A TOPIC =====
function renameTopic(courseIndex, topicIndex) {
    let oldName = courses[courseIndex].topics[topicIndex].name;
    let newName = prompt("Enter the new topic name:", oldName);

    if (newName === null || newName.trim() === "") return;

    courses[courseIndex].topics[topicIndex].name = newName.trim();

    saveData();
    displayCourses();
}


// ===== DELETE A TOPIC =====
function deleteTopic(courseIndex, topicIndex) {
    if (confirm("Delete this topic?")) {
        courses[courseIndex].topics.splice(topicIndex, 1);
        saveData();
        displayCourses();
    }
}

// Edit course name and code
function editCourse(index) {
    let name = prompt("Enter course name:", courses[index].name);
    if (name === null || name.trim() === "") return;

    let code = prompt("Enter course code:", courses[index].code);
    if (code === null || code.trim() === "") return;

    courses[index].name = name.trim();
    courses[index].code = code.trim();

    saveData();
    displayCourses();
}

// ===== DELETE A COURSE =====
function deleteCourse(courseIndex) {
    if (confirm("Delete this course and its topics?")) {
        let deletedCourse = courses[courseIndex].name;

        if (activeCourse === deletedCourse) {
            stopTimer(false);
        }

        courses.splice(courseIndex, 1);
        saveData();
        displayCourses();
    }
}


// ===== UPDATE DASHBOARD STATISTICS =====
function updateStats() {
    let totalCourses = courses.length;
    let completedTopics = 0;
    let totalTopics = 0;

    courses.forEach(function(course) {
        totalTopics += course.topics.length;

        course.topics.forEach(function(topic) {
            if (topic.done) {
                completedTopics++;
            }
        });
    });

    let progress = totalTopics === 0
        ? 0
        : Math.round(completedTopics / totalTopics * 100);

    document.getElementById("total-courses").textContent = totalCourses;
    document.getElementById("completed-topics").textContent = completedTopics;
    document.getElementById("overall-progress").textContent = progress + "%";
}


// ===== UPDATE TIMER COURSE OPTIONS =====
function updateCourseOptions() {
    let courseSelect = document.getElementById("timer-course");
    let previousValue = courseSelect.value;

    courseSelect.innerHTML = '<option value="">Select a course</option>';

    courses.forEach(function(course) {
        let option = document.createElement("option");
        option.value = course.name;
        option.textContent = course.name;
        courseSelect.appendChild(option);
    });

    if (courses.some(function(course) {
        return course.name === previousValue;
    })) {
        courseSelect.value = previousValue;
    }

    updateTopicOptions();
}


// ===== UPDATE TIMER TOPIC OPTIONS =====
function updateTopicOptions() {
    let courseName = document.getElementById("timer-course").value;
    let topicSelect = document.getElementById("timer-topic");

    topicSelect.innerHTML = '<option value="">Select a topic</option>';

    let course = courses.find(function(item) {
        return item.name === courseName;
    });

    if (course) {
        course.topics.forEach(function(topic) {
            let option = document.createElement("option");
            option.value = topic.name;
            option.textContent = topic.name;
            topicSelect.appendChild(option);
        });
    }
}

document.getElementById("timer-course").addEventListener("change", updateTopicOptions);


// ===== START THE TIMER =====
function startTimer() {
    if (startTime !== null) return;

    activeCourse = document.getElementById("timer-course").value;
    activeTopic = document.getElementById("timer-topic").value;

    if (!activeCourse || !activeTopic) {
        document.getElementById("timer-message").textContent =
            "Please select a course and topic first.";
        return;
    }

    startTime = Date.now();

    localStorage.setItem("activeTimer", JSON.stringify({
        startTime: startTime,
        course: activeCourse,
        topic: activeTopic
    }));

    document.getElementById("timer-course").disabled = true;
    document.getElementById("timer-topic").disabled = true;
    document.getElementById("start-timer").disabled = true;
    document.getElementById("stop-timer").disabled = false;

    document.getElementById("timer-message").textContent =
        "Your study session is running. Keep going! 🌷";

    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}


// ===== UPDATE TIMER DISPLAY =====
function updateTimer() {
    if (startTime === null) return;

    let seconds = Math.floor((Date.now() - startTime) / 1000);

    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let remainingSeconds = seconds % 60;

    document.getElementById("timer-display").textContent =
        String(hours).padStart(2, "0") + ":" +
        String(minutes).padStart(2, "0") + ":" +
        String(remainingSeconds).padStart(2, "0");
}


// ===== STOP AND SAVE THE TIMER =====
function stopTimer(saveSession = true) {
    if (startTime === null) return;

    let duration = Math.floor((Date.now() - startTime) / 1000);

    clearInterval(timerInterval);

    if (saveSession && duration > 0) {
        sessions.push({
            course: activeCourse,
            topic: activeTopic,
            duration: duration,
            date: new Date().toDateString()
        });

        saveData();
    }

    startTime = null;
    activeCourse = "";
    activeTopic = "";

    localStorage.removeItem("activeTimer");

    document.getElementById("timer-display").textContent = "00:00:00";
    document.getElementById("timer-course").disabled = false;
    document.getElementById("timer-topic").disabled = false;
    document.getElementById("start-timer").disabled = false;
    document.getElementById("stop-timer").disabled = true;

    document.getElementById("timer-message").textContent =
        saveSession ? "Study session saved. Well done! 🌸" :
        "Timer stopped because its course was deleted.";

    displayStudySummary();
    displayHistory();
}

document.getElementById("start-timer").addEventListener("click", startTimer);
document.getElementById("stop-timer").addEventListener("click", function() {
    stopTimer();
});


// ===== DISPLAY STUDY SUMMARY =====
function displayStudySummary() {
    let today = new Date().toDateString();
    let todaySeconds = 0;

    sessions.forEach(function(session) {
        if (session.date === today) {
            todaySeconds += session.duration;
        }
    });

    let todayMinutes = Math.floor(todaySeconds / 60);

    document.getElementById("today-study-time").textContent =
        todayMinutes + " min";

    document.getElementById("total-sessions").textContent = sessions.length;
}


// ===== DISPLAY STUDY HISTORY =====
function displayHistory() {
    let history = document.getElementById("study-history");
    history.innerHTML = "";

    if (sessions.length === 0) {
        history.innerHTML =
            '<p class="empty-message">Your completed study sessions will appear here.</p>';
        return;
    }

    sessions.slice().reverse().forEach(function(session) {
        let minutes = Math.floor(session.duration / 60);
        let seconds = session.duration % 60;

        let item = document.createElement("div");
        item.className = "history-item";

        let details = document.createElement("div");

        let title = document.createElement("h4");
        title.textContent = session.topic;

        let info = document.createElement("p");
        info.textContent = session.course + " • " + session.date;

        let duration = document.createElement("span");
        duration.className = "history-duration";
        duration.textContent = minutes + "m " + seconds + "s";

        details.appendChild(title);
        details.appendChild(info);
        item.appendChild(details);
        item.appendChild(duration);
        history.appendChild(item);
    });
}


// ===== INITIALIZE THE WEBSITE =====
displayCourses();
displayStudySummary();
displayHistory();

if (startTime !== null) {
    document.getElementById("timer-course").value = activeCourse;
    updateTopicOptions();
    document.getElementById("timer-topic").value = activeTopic;

    document.getElementById("timer-course").disabled = true;
    document.getElementById("timer-topic").disabled = true;
    document.getElementById("start-timer").disabled = true;
    document.getElementById("stop-timer").disabled = false;

    document.getElementById("timer-message").textContent =
        "Your study session is still running. 🌷";

    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}