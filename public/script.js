// Initialize flatpickr for time input
flatpickr("#time", {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
    onChange: function(selectedDates, dateStr, instance) {
        // You can handle the change event if needed
    }
});

// Handle form submission
document.getElementById('reservationForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const mobile = document.getElementById('mobile').value;
    const people = document.getElementById('people').value;
    const timeInput = document.getElementById('time').value;

    // Validate mobile number format
    const mobilePattern = /^09\d{9}$/; // Pattern for mobile number starting with 09 and followed by 9 digits
    if (!mobilePattern.test(mobile)) {
        document.getElementById('message').innerText = 'شماره موبایل نامعتبر است. لطفا دوباره بررسی کنید.';
        return;
    }

    // Get the current date
    const currentDate = new Date();
    const [hours, minutes] = timeInput.split(':'); // Split the time into hours and minutes

    // Create a new Date object for the reservation time
    const reservationDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hours, minutes);

    // Create a reservation object
    const reservationData = {
        name,
        mobile,
        people: parseInt(people, 10),
        time: reservationDate.toISOString() // Convert to ISO format
    };

    // Log the reservation data for debugging
    console.log('Reservation Data:', reservationData);

    try {
        const response = await fetch('http://localhost:3000/reserve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reservationData),
        });

        // Check if the response is OK (status 200-299)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Unknown error');
        }

        const result = await response.json();
        document.getElementById('message').innerText = result.message; // Show success message
        document.getElementById('reservationForm').reset(); // Reset the form
    } catch (error) {
        console.error('Error submitting reservation:', error);
        document.getElementById('message').innerText = 'خطا در ارسال رزرو. لطفا دوباره تلاش کنید.'; // Show error message
    }
});
