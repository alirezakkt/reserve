const socket = io(); // Establish connection to the Socket.IO server

// Function to fetch reservations from the server
async function fetchReservations() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'text-center mt-4';
    loadingIndicator.innerHTML = '<strong>در حال بارگذاری...</strong>';
    document.querySelector('#reservationsTable tbody').appendChild(loadingIndicator);

    try {
        const response = await fetch('http://localhost:3000/reservations');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const reservations = await response.json();
        populateTable(reservations);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        alert('خطا در بارگذاری رزروها. لطفاً دوباره تلاش کنید.');
    } finally {
        loadingIndicator.remove();
    }
}

// Function to populate the reservations table
function populateTable(reservations) {
    const tableBody = document.querySelector('#reservationsTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    reservations.forEach(reservation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reservation.name}</td>
            <td>${reservation.mobile}</td>
            <td>${reservation.people}</td>
            <td>${moment(reservation.time).locale('fa').format('YYYY/MM/DD HH:mm:ss')}</td>
            <td>
                <select class="form-control" onchange="updateReservationStatus('${reservation._id}', this.value)">
                    <option value="Cancelled" ${reservation.status === 'Cancelled' ? 'selected' : ''}>کنسل شده</option>
                    <option value="Seated" ${reservation.status === 'Seated' ? 'selected' : ''}>نشسته</option>
                </select>
            </td>
        `;
        setRowColor(row, reservation.status);
        tableBody.appendChild(row);
    });
}

// Function to set row color based on status
function setRowColor(row, status) {
    if (status === 'Cancelled') {
        row.style.backgroundColor = '#ffcccc'; // Light red
        row.style.color = '#c62828'; // Dark red
    } else if (status === 'Seated') {
        row.style.backgroundColor = '#d4edda'; // Light green
        row.style.color = '#155724'; // Dark green
    } else {
        row.style.backgroundColor = '#fff3cd'; // Light yellow
        row.style.color = '#856404'; // Dark yellow
    }
    row.style.textAlign = 'center'; // Center the text
}

// Listen for new reservation events
socket.on('newReservation', (reservation) => {
    const tableBody = document.querySelector('#reservationsTable tbody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${reservation.name}</td>
        <td>${reservation.mobile}</td>
        <td>${reservation.people}</td>
        <td>${moment(reservation.time).locale('fa').format('YYYY/MM/DD HH:mm:ss')}</td>
        <td>
            <select class="form-control" onchange="updateReservationStatus('${reservation._id}', this.value)">
                <option value="Cancelled">کنسل شده</option>
                <option value="Seated">نشسته</option>
            </select>
        </td>
    `;
    setRowColor(row, reservation.status);
    tableBody.appendChild(row);
});

// Function to update reservation status
async function updateReservationStatus(reservationId, status) {
    try {
        const response = await fetch('http://localhost:3000/update-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: reservationId, status }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        alert(result.message);
        fetchReservations(); // Refresh the table
    } catch (error) {
        console.error('Error updating reservation status:', error);
        alert('خطا در به‌روزرسانی وضعیت رزرو. لطفاً دوباره تلاش کنید.');
    }
}

// Function to filter reservations based on search input
function filterReservations() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#reservationsTable tbody tr');

    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const status = row.cells[4].querySelector('select').value.toLowerCase();
        if (name.includes(searchInput) || status.includes(searchInput)) {
            row.style.display = ''; // Show row
        } else {
            row.style.display = 'none'; // Hide row
        }
    });
}

// Initial fetch of reservations when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchReservations();
    document.getElementById('searchInput').addEventListener('input', filterReservations);
});
