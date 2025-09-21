// Study Planner & Grade Calculator Application
// CS50x Final Project - Demonstrates HTML, CSS, JavaScript, Data Structures, and Algorithms

class StudyPlanner {
    constructor() {
        this.courses = JSON.parse(localStorage.getItem('courses')) || [];
        this.assignments = JSON.parse(localStorage.getItem('assignments')) || [];
        this.grades = JSON.parse(localStorage.getItem('grades')) || [];
        this.studySessions = JSON.parse(localStorage.getItem('studySessions')) || [];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboard();
        this.updateStats();
        this.setupModals();
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Add buttons
        document.getElementById('add-course-btn').addEventListener('click', () => this.openModal('course-modal'));
        document.getElementById('add-assignment-btn').addEventListener('click', () => this.openModal('assignment-modal'));
        document.getElementById('add-study-session-btn').addEventListener('click', () => this.openModal('study-session-modal'));
        document.getElementById('add-grade-btn').addEventListener('click', () => this.addGrade());

        // Forms
        document.getElementById('course-form').addEventListener('submit', (e) => this.addCourse(e));
        document.getElementById('assignment-form').addEventListener('submit', (e) => this.addAssignment(e));
        document.getElementById('study-session-form').addEventListener('submit', (e) => this.addStudySession(e));
    }

    // Tab Management
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Load specific tab data
        this.loadTabContent(tabName);
    }

    loadTabContent(tabName) {
        switch(tabName) {
            case 'courses':
                this.loadCourses();
                break;
            case 'assignments':
                this.loadAssignments();
                break;
            case 'grades':
                this.loadGrades();
                break;
            case 'planner':
                this.loadStudyPlanner();
                break;
        }
    }

    // Modal Management
    setupModals() {
        document.querySelectorAll('.close-modal').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => this.closeModal());
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        });
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        document.body.style.overflow = 'hidden';

        if (modalId === 'assignment-modal') {
            this.populateCourseSelect('assignment-course');
        }
        if (modalId === 'study-session-modal') {
            this.populateCourseSelect('session-course');
        }
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }

    populateCourseSelect(selectId) {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Select Course</option>';

        this.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.code} - ${course.name}`;
            select.appendChild(option);
        });
    }

    // Dashboard
    loadDashboard() {
        this.updateStats();
        this.loadRecentActivity();
    }

    updateStats() {
        document.getElementById('total-courses').textContent = this.courses.length;
        document.getElementById('current-gpa').textContent = this.calculateGPA().toFixed(2);
        document.getElementById('pending-assignments').textContent = this.assignments.filter(a => !a.completed).length;
        document.getElementById('study-hours').textContent = this.calculateStudyHours();
    }

    loadRecentActivity() {
        const recentList = document.getElementById('recent-list');
        const recent = [];

        // Get recent assignments
        this.assignments.slice(-3).forEach(assignment => {
            recent.push({
                type: 'assignment',
                text: `Assignment: ${assignment.title}`,
                date: assignment.dueDate,
                icon: 'fas fa-tasks'
            });
        });

        // Get recent study sessions
        this.studySessions.slice(-3).forEach(session => {
            const course = this.courses.find(c => c.id === session.courseId);
            recent.push({
                type: 'study',
                text: `Studied ${course?.name || 'Unknown'} for ${session.duration} hours`,
                date: session.date,
                icon: 'fas fa-book'
            });
        });

        recent.sort((a, b) => new Date(b.date) - new Date(a.date));

        recentList.innerHTML = recent.slice(0, 5).map(item => `
            <div class="recent-item">
                <i class="${item.icon}"></i>
                <span>${item.text}</span>
                <small>${this.formatDate(item.date)}</small>
            </div>
        `).join('');
    }

    // Course Management
    loadCourses() {
        const coursesList = document.getElementById('courses-list');

        if (this.courses.length === 0) {
            coursesList.innerHTML = '<p class="text-center">No courses added yet. <button class="btn-primary" onclick="app.openModal(\'course-modal\')">Add your first course</button></p>';
            return;
        }

        coursesList.innerHTML = this.courses.map(course => `
            <div class="course-card" style="border-left-color: ${course.color}">
                <div class="course-header">
                    <div class="course-title">${course.name}</div>
                    <div class="course-code">${course.code}</div>
                </div>
                <div class="course-info">
                    <div class="course-info-item">
                        <strong>Credit Hours:</strong> ${course.credits}
                    </div>
                    <div class="course-info-item">
                        <strong>Instructor:</strong> ${course.instructor || 'N/A'}
                    </div>
                </div>
                <div class="course-credits">
                    ${course.credits} Credits
                </div>
            </div>
        `).join('');
    }

    addCourse(e) {
        e.preventDefault();

        const course = {
            id: Date.now().toString(),
            name: document.getElementById('course-name').value,
            code: document.getElementById('course-code').value,
            credits: parseInt(document.getElementById('course-credits').value),
            instructor: document.getElementById('course-instructor').value,
            color: document.getElementById('course-color').value
        };

        this.courses.push(course);
        this.saveData('courses', this.courses);
        this.closeModal();
        this.loadCourses();
        this.updateStats();

        // Reset form
        document.getElementById('course-form').reset();
    }

    // Assignment Management
    loadAssignments() {
        const assignmentsList = document.getElementById('assignments-list');

        if (this.assignments.length === 0) {
            assignmentsList.innerHTML = '<p class="text-center">No assignments yet. <button class="btn-primary" onclick="app.openModal(\'assignment-modal\')">Add your first assignment</button></p>';
            return;
        }

        assignmentsList.innerHTML = this.assignments.map(assignment => {
            const course = this.courses.find(c => c.id === assignment.courseId);
            const daysUntilDue = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

            return `
                <div class="assignment-item">
                    <div class="assignment-info">
                        <h4>${assignment.title}</h4>
                        <div class="assignment-meta">
                            Course: ${course?.name || 'Unknown'} |
                            Due: ${this.formatDate(assignment.dueDate)} |
                            ${daysUntilDue > 0 ? `${daysUntilDue} days left` : 'Overdue'}
                        </div>
                    </div>
                    <div class="assignment-priority priority-${assignment.priority}">
                        ${assignment.priority}
                    </div>
                </div>
            `;
        }).join('');
    }

    addAssignment(e) {
        e.preventDefault();

        const assignment = {
            id: Date.now().toString(),
            title: document.getElementById('assignment-title').value,
            courseId: document.getElementById('assignment-course').value,
            dueDate: document.getElementById('assignment-due-date').value,
            priority: document.getElementById('assignment-priority').value,
            description: document.getElementById('assignment-description').value,
            completed: false
        };

        this.assignments.push(assignment);
        this.saveData('assignments', this.assignments);
        this.closeModal();
        this.loadAssignments();
        this.updateStats();

        // Reset form
        document.getElementById('assignment-form').reset();
    }

    // Grade Calculator
    loadGrades() {
        this.displayGrades();
    }

    addGrade() {
        const courseName = document.getElementById('grade-course-name').value;
        const creditHours = parseInt(document.getElementById('grade-credit-hours').value);
        const gradeValue = parseFloat(document.getElementById('grade-select').value);

        if (!courseName || !creditHours) {
            alert('Please fill in all fields');
            return;
        }

        const grade = {
            id: Date.now().toString(),
            courseName,
            creditHours,
            grade: gradeValue
        };

        this.grades.push(grade);
        this.saveData('grades', this.grades);
        this.displayGrades();

        // Reset form
        document.getElementById('grade-course-name').value = '';
        document.getElementById('grade-credit-hours').value = '';
        document.getElementById('grade-select').selectedIndex = 0;
    }

    displayGrades() {
        const gradesList = document.getElementById('grades-list');
        const gpaElement = document.getElementById('calculated-gpa');

        if (this.grades.length === 0) {
            gradesList.innerHTML = '<p class="text-center">No grades added yet. Add your first course grade above.</p>';
            gpaElement.textContent = '0.00';
            return;
        }

        gradesList.innerHTML = this.grades.map(grade => `
            <div class="grade-item">
                <div>
                    <strong>${grade.courseName}</strong><br>
                    <small>${grade.creditHours} credit hours</small>
                </div>
                <div class="grade-value">
                    ${grade.grade.toFixed(1)}
                </div>
            </div>
        `).join('');

        const gpa = this.calculateGPA();
        gpaElement.textContent = gpa.toFixed(2);
    }

    // Study Planner
    loadStudyPlanner() {
        this.displayStudyCalendar();
        this.displayStudyStats();
    }

    addStudySession(e) {
        e.preventDefault();

        const session = {
            id: Date.now().toString(),
            courseId: document.getElementById('session-course').value,
            date: document.getElementById('session-date').value,
            duration: parseFloat(document.getElementById('session-duration').value),
            topic: document.getElementById('session-topic').value,
            notes: document.getElementById('session-notes').value
        };

        this.studySessions.push(session);
        this.saveData('studySessions', this.studySessions);
        this.closeModal();
        this.loadStudyPlanner();
        this.updateStats();

        // Reset form
        document.getElementById('study-session-form').reset();
    }

    displayStudyCalendar() {
        const calendar = document.getElementById('study-calendar');
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));

        let calendarHTML = '<div class="calendar-grid">';

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            const daySessions = this.studySessions.filter(s => s.date === dateStr);
            const totalHours = daySessions.reduce((sum, s) => sum + s.duration, 0);

            calendarHTML += `
                <div class="calendar-day">
                    <div class="day-header">
                        <strong>${date.toLocaleDateString('en-US', { weekday: 'short' })}</strong>
                        <small>${date.getDate()}</small>
                    </div>
                    <div class="day-sessions">
                        ${totalHours > 0 ? `${totalHours}h study` : 'No study'}
                    </div>
                </div>
            `;
        }

        calendarHTML += '</div>';
        calendar.innerHTML = calendarHTML;
    }

    displayStudyStats() {
        const stats = document.getElementById('study-stats');
        const totalHours = this.calculateStudyHours();
        const thisWeek = this.getThisWeekSessions();
        const weekHours = thisWeek.reduce((sum, s) => sum + s.duration, 0);

        const courseStats = {};
        this.studySessions.forEach(session => {
            const course = this.courses.find(c => c.id === session.courseId);
            if (course) {
                courseStats[course.name] = (courseStats[course.name] || 0) + session.duration;
            }
        });

        stats.innerHTML = `
            <div class="stat-item">
                <strong>Total Study Hours:</strong> ${totalHours}
            </div>
            <div class="stat-item">
                <strong>This Week:</strong> ${weekHours} hours
            </div>
            <div class="stat-item">
                <strong>Most Studied Course:</strong> ${Object.keys(courseStats).length > 0 ? Object.entries(courseStats).sort((a,b) => b[1]-a[1])[0][0] : 'None'}
            </div>
        `;
    }

    // Utility Functions
    calculateGPA() {
        if (this.grades.length === 0) return 0;

        const totalPoints = this.grades.reduce((sum, grade) => sum + (grade.grade * grade.creditHours), 0);
        const totalCredits = this.grades.reduce((sum, grade) => sum + grade.creditHours, 0);

        return totalCredits > 0 ? totalPoints / totalCredits : 0;
    }

    calculateStudyHours() {
        return this.studySessions.reduce((sum, session) => sum + session.duration, 0);
    }

    getThisWeekSessions() {
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekStartStr = weekStart.toISOString().split('T')[0];

        return this.studySessions.filter(session => session.date >= weekStartStr);
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }
}

// Initialize the application
const app = new StudyPlanner();

// Add CSS for calendar grid
const style = document.createElement('style');
style.textContent = `
    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 10px;
        margin-top: 15px;
    }

    .calendar-day {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
    }

    .day-header {
        margin-bottom: 10px;
    }

    .day-header small {
        color: #666;
        font-size: 0.8rem;
    }

    .day-sessions {
        font-size: 0.9rem;
        color: #333;
    }

    .stat-item {
        padding: 10px 0;
        border-bottom: 1px solid #eee;
    }

    .stat-item:last-child {
        border-bottom: none;
    }

    .grade-value {
        font-size: 1.2rem;
        font-weight: bold;
        color: #4CAF50;
    }

    .recent-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: white;
        border-radius: 8px;
        margin-bottom: 8px;
    }

    .recent-item i {
        color: #4CAF50;
        width: 16px;
    }

    .recent-item small {
        margin-left: auto;
        color: #666;
        font-size: 0.8rem;
    }
`;
document.head.appendChild(style);
