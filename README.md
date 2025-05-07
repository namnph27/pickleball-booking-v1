# Pickleball Court Booking System

A comprehensive platform for booking Pickleball courts, managing court availability, and connecting players.

## Features

### For Customers
- Register and log in using a customer account
- Search and view available Pickleball courts
- View user guide/instructions
- Select court and timeslot to make a booking
- View booked courts
- Join courts suitable for their skill level
- Payment processing
- Earn and redeem reward points

### For Court Owners
- Register and log in as a court owner
- Manage Pickleball courts (add, edit, delete available timeslots)
- Post about Pickleball courses or equipment

### For Admins
- Verify court owner accounts and manage user accounts
- Create and manage discount programs and codes
- Send announcements to all users

## Tech Stack

- **Frontend**: Vue.js 3 with Composition API
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **API Testing**: Postman

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL

### Installation

1. Clone the repository
```
git clone <repository-url>
cd pickleball_booking_v1
```

2. Install backend dependencies
```
cd server
npm install
```

3. Install frontend dependencies
```
cd ../client
npm install
```

4. Set up environment variables
   - Create `.env` files in both the `client` and `server` directories
   - Configure database connection and other settings

5. Start the development servers
   - Backend: `npm run dev` in the `server` directory
   - Frontend: `npm run dev` in the `client` directory

## Project Structure

```
pickleball_booking_v1/
├── client/                 # Vue.js frontend
├── server/                 # Node.js backend
├── .gitignore              # Git ignore file
└── README.md               # Project documentation
```

## License

[MIT](LICENSE)
